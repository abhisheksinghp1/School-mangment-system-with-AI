from typing import List, Dict, Any
from datetime import date, timedelta
from langchain_core.tools import tool
from .base_agent import BaseAgent


class ParentAgent(BaseAgent):

    def get_system_prompt(self) -> str:
        return (
            "You are a supportive AI assistant for parents in a school management system. "
            "You can show your child's attendance, homework, marks, performance reports, and notifications. "
            "You only access data for this parent's children. Be warm and helpful."
        )

    def create_tools(self) -> List:
        db      = self.db
        user_id = self.user_id

        @tool
        def get_my_children() -> Dict[str, Any]:
            """Get information about the parent's children enrolled in the school."""
            from app.models.parent import Parent
            from app.models.student import Student
            from app.models.class_model import Class

            parent = db.query(Parent).filter(Parent.user_id == user_id).first()
            if not parent:
                return {"error": "Parent profile not found"}

            children = db.query(Student).filter(Student.parent_id == parent.id).all()
            result   = []
            for c in children:
                cls = db.query(Class).filter(Class.id == c.class_id).first()
                result.append({
                    "id": c.id,
                    "name": f"{c.first_name} {c.last_name}",
                    "admission_no": c.admission_number,
                    "class": cls.name if cls else "N/A",
                    "grade": cls.grade if cls else "N/A",
                })
            return {"children": result, "total": len(result)}

        @tool
        def get_child_attendance(child_name: str = "") -> Dict[str, Any]:
            """Get attendance for a child. Optionally specify child_name; defaults to first child."""
            from app.models.parent import Parent
            from app.models.student import Student
            from app.models.attendance import Attendance

            parent = db.query(Parent).filter(Parent.user_id == user_id).first()
            if not parent:
                return {"error": "Parent profile not found"}

            children = db.query(Student).filter(Student.parent_id == parent.id).all()
            if not children:
                return {"error": "No children found"}

            child = children[0]
            if child_name:
                for c in children:
                    if child_name.lower() in f"{c.first_name} {c.last_name}".lower():
                        child = c
                        break

            since   = date.today() - timedelta(days=30)
            records = db.query(Attendance).filter(
                Attendance.student_id == child.id,
                Attendance.date >= since
            ).order_by(Attendance.date.desc()).all()

            total   = len(records)
            present = sum(1 for r in records if r.status == "PRESENT")
            absent  = sum(1 for r in records if r.status == "ABSENT")
            late    = sum(1 for r in records if r.status == "LATE")

            return {
                "child": f"{child.first_name} {child.last_name}",
                "period": "Last 30 days",
                "total_days": total,
                "present": present,
                "absent": absent,
                "late": late,
                "attendance_rate": round(present / total * 100, 1) if total else 0,
            }

        @tool
        def get_child_marks(child_name: str = "") -> Dict[str, Any]:
            """Get marks and performance for a child. Optionally specify child_name."""
            from app.models.parent import Parent
            from app.models.student import Student
            from app.models.mark import Mark
            from app.models.subject import Subject

            parent = db.query(Parent).filter(Parent.user_id == user_id).first()
            if not parent:
                return {"error": "Parent profile not found"}

            children = db.query(Student).filter(Student.parent_id == parent.id).all()
            if not children:
                return {"error": "No children found"}

            child = children[0]
            if child_name:
                for c in children:
                    if child_name.lower() in f"{c.first_name} {c.last_name}".lower():
                        child = c
                        break

            marks = db.query(Mark).filter(Mark.student_id == child.id).all()
            if not marks:
                return {"child": f"{child.first_name} {child.last_name}", "message": "No marks recorded yet."}

            subject_avg: Dict[str, list] = {}
            for m in marks:
                subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
                name = subj.name if subj else f"Subject #{m.subject_id}"
                subject_avg.setdefault(name, []).append(m.marks_obtained / m.max_marks * 100)

            subject_avg = {k: round(sum(v) / len(v), 1) for k, v in subject_avg.items()}
            overall     = round(sum(subject_avg.values()) / len(subject_avg), 1)

            return {
                "child": f"{child.first_name} {child.last_name}",
                "subject_averages": subject_avg,
                "overall_average": overall,
                "total_assessments": len(marks),
            }

        @tool
        def get_child_homework(child_name: str = "") -> Dict[str, Any]:
            """Get pending homework for a child. Optionally specify child_name."""
            from app.models.parent import Parent
            from app.models.student import Student
            from app.models.homework import Homework

            parent = db.query(Parent).filter(Parent.user_id == user_id).first()
            if not parent:
                return {"error": "Parent profile not found"}

            children = db.query(Student).filter(Student.parent_id == parent.id).all()
            if not children:
                return {"error": "No children found"}

            child = children[0]
            if child_name:
                for c in children:
                    if child_name.lower() in f"{c.first_name} {c.last_name}".lower():
                        child = c
                        break

            today   = date.today()
            hw_list = db.query(Homework).filter(Homework.class_id == child.class_id).all()
            pending = [
                {"title": hw.title, "due_date": hw.due_date.strftime("%Y-%m-%d"), "max_marks": hw.max_marks}
                for hw in hw_list if hw.due_date >= today
            ]

            return {
                "child": f"{child.first_name} {child.last_name}",
                "pending_homework": pending,
                "total_pending": len(pending),
            }

        @tool
        def get_performance_report(child_name: str = "") -> Dict[str, Any]:
            """Get a full performance report for a child including marks and attendance."""
            from app.models.parent import Parent
            from app.models.student import Student
            from app.models.mark import Mark
            from app.models.attendance import Attendance
            from app.models.subject import Subject

            parent = db.query(Parent).filter(Parent.user_id == user_id).first()
            if not parent:
                return {"error": "Parent profile not found"}

            children = db.query(Student).filter(Student.parent_id == parent.id).all()
            if not children:
                return {"error": "No children found"}

            child = children[0]
            if child_name:
                for c in children:
                    if child_name.lower() in f"{c.first_name} {c.last_name}".lower():
                        child = c
                        break

            # Marks
            marks = db.query(Mark).filter(Mark.student_id == child.id).all()
            subject_avg: Dict[str, list] = {}
            for m in marks:
                subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
                name = subj.name if subj else f"Subject #{m.subject_id}"
                subject_avg.setdefault(name, []).append(m.marks_obtained / m.max_marks * 100)
            subject_avg = {k: round(sum(v) / len(v), 1) for k, v in subject_avg.items()}
            overall_marks = round(sum(subject_avg.values()) / len(subject_avg), 1) if subject_avg else 0

            # Attendance
            since   = date.today() - timedelta(days=30)
            records = db.query(Attendance).filter(Attendance.student_id == child.id, Attendance.date >= since).all()
            total   = len(records)
            present = sum(1 for r in records if r.status == "PRESENT")
            att_rate = round(present / total * 100, 1) if total else 0

            # Recommendations
            weak   = [k for k, v in subject_avg.items() if v < 60]
            strong = [k for k, v in subject_avg.items() if v >= 80]
            recs   = []
            if weak:
                recs.append(f"Needs improvement in: {', '.join(weak)}")
            if strong:
                recs.append(f"Excelling in: {', '.join(strong)}")
            if att_rate < 85:
                recs.append("Attendance is below 85% — please ensure regular school attendance.")
            if overall_marks >= 80:
                recs.append("Outstanding academic performance!")

            return {
                "child": f"{child.first_name} {child.last_name}",
                "academic": {"overall_average": overall_marks, "subjects": subject_avg},
                "attendance": {"rate": att_rate, "present": present, "total": total},
                "recommendations": recs,
            }

        @tool
        def get_my_notifications() -> Dict[str, Any]:
            """Get the latest notifications sent to this parent."""
            from app.models.parent import Parent
            from app.models.notification import Notification

            parent = db.query(Parent).filter(Parent.user_id == user_id).first()
            if not parent:
                return {"error": "Parent profile not found"}

            notifs = db.query(Notification).filter(
                Notification.recipient_id   == parent.id,
                Notification.recipient_type == "PARENT"
            ).order_by(Notification.created_at.desc()).limit(10).all()

            return {
                "notifications": [
                    {"title": n.title, "message": n.message, "priority": n.priority, "read": n.is_read}
                    for n in notifs
                ],
                "unread": sum(1 for n in notifs if not n.is_read),
            }

        return [get_my_children, get_child_attendance, get_child_marks,
                get_child_homework, get_performance_report, get_my_notifications]
