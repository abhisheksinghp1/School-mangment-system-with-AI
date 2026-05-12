from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import date, timedelta
from langchain_core.tools import tool
from .base_agent import BaseAgent


class StudentAgent(BaseAgent):

    def get_system_prompt(self) -> str:
        return (
            "You are a helpful AI assistant for students in a school management system. "
            "You can check attendance, homework, marks, exam schedules, and give academic guidance. "
            "You only access data for the current student. Be friendly and encouraging."
        )

    def create_tools(self) -> List:
        db      = self.db
        user_id = self.user_id

        @tool
        def get_attendance() -> Dict[str, Any]:
            """Get the student's attendance records for the last 30 days."""
            from app.models.student import Student
            from app.models.attendance import Attendance

            student = db.query(Student).filter(Student.user_id == user_id).first()
            if not student:
                return {"error": "Student profile not found"}

            since = date.today() - timedelta(days=30)
            records = db.query(Attendance).filter(
                Attendance.student_id == student.id,
                Attendance.date >= since
            ).order_by(Attendance.date.desc()).all()

            total   = len(records)
            present = sum(1 for r in records if r.status == "PRESENT")
            absent  = sum(1 for r in records if r.status == "ABSENT")
            late    = sum(1 for r in records if r.status == "LATE")

            return {
                "total_days": total,
                "present": present,
                "absent": absent,
                "late": late,
                "attendance_percentage": round(present / total * 100, 1) if total else 0,
                "recent_records": [
                    {"date": r.date.strftime("%Y-%m-%d"), "status": r.status, "remarks": r.remarks}
                    for r in records[:10]
                ],
            }

        @tool
        def get_homework() -> Dict[str, Any]:
            """Get the student's homework assignments (pending and past)."""
            from app.models.student import Student
            from app.models.homework import Homework

            student = db.query(Student).filter(Student.user_id == user_id).first()
            if not student:
                return {"error": "Student profile not found"}

            hw_list = db.query(Homework).filter(Homework.class_id == student.class_id).all()
            today   = date.today()
            pending = []
            past    = []

            for hw in hw_list:
                item = {
                    "id": hw.id,
                    "title": hw.title,
                    "description": hw.description,
                    "due_date": hw.due_date.strftime("%Y-%m-%d"),
                    "max_marks": hw.max_marks,
                }
                (pending if hw.due_date >= today else past).append(item)

            return {
                "pending_homework": pending,
                "past_homework": past,
                "total_pending": len(pending),
            }

        @tool
        def get_marks() -> Dict[str, Any]:
            """Get the student's marks and subject-wise performance."""
            from app.models.student import Student
            from app.models.mark import Mark
            from app.models.subject import Subject

            student = db.query(Student).filter(Student.user_id == user_id).first()
            if not student:
                return {"error": "Student profile not found"}

            marks = db.query(Mark).filter(Mark.student_id == student.id).all()
            if not marks:
                return {"message": "No marks recorded yet.", "total_assessments": 0}

            subject_perf: Dict[str, Any] = {}
            total_obtained = 0
            total_max      = 0

            for m in marks:
                subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
                name = subj.name if subj else f"Subject #{m.subject_id}"
                if name not in subject_perf:
                    subject_perf[name] = {"obtained": 0, "max": 0, "count": 0}
                subject_perf[name]["obtained"] += m.marks_obtained
                subject_perf[name]["max"]      += m.max_marks
                subject_perf[name]["count"]    += 1
                total_obtained += m.marks_obtained
                total_max      += m.max_marks

            for name in subject_perf:
                sp = subject_perf[name]
                sp["average_pct"] = round(sp["obtained"] / sp["max"] * 100, 1) if sp["max"] else 0

            return {
                "subject_performance": subject_perf,
                "overall_average": round(total_obtained / total_max * 100, 1) if total_max else 0,
                "total_assessments": len(marks),
            }

        @tool
        def get_exam_schedule() -> Dict[str, Any]:
            """Get upcoming exams in the next 30 days for the student's class."""
            from app.models.student import Student
            from app.models.exam import Exam
            from app.models.subject import Subject

            student = db.query(Student).filter(Student.user_id == user_id).first()
            if not student:
                return {"error": "Student profile not found"}

            today  = date.today()
            future = today + timedelta(days=30)
            exams  = db.query(Exam).filter(
                Exam.class_id  == student.class_id,
                Exam.exam_date >= today,
                Exam.exam_date <= future,
            ).order_by(Exam.exam_date).all()

            return {
                "upcoming_exams": [
                    {
                        "title": e.title,
                        "subject": (db.query(Subject).filter(Subject.id == e.subject_id).first() or type("S", (), {"name": "Unknown"})()).name,
                        "date": e.exam_date.strftime("%Y-%m-%d"),
                        "total_marks": e.total_marks,
                        "duration_minutes": e.duration_minutes,
                        "type": e.exam_type,
                    }
                    for e in exams
                ],
                "total_upcoming": len(exams),
            }

        @tool
        def get_performance_analysis() -> Dict[str, Any]:
            """Analyse the student's performance: identify weak/strong subjects and give recommendations."""
            from app.models.student import Student
            from app.models.mark import Mark
            from app.models.subject import Subject

            student = db.query(Student).filter(Student.user_id == user_id).first()
            if not student:
                return {"error": "Student profile not found"}

            marks = db.query(Mark).filter(Mark.student_id == student.id).all()
            if not marks:
                return {"message": "No marks available for analysis yet."}

            subject_avg: Dict[str, float] = {}
            for m in marks:
                subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
                name = subj.name if subj else f"Subject #{m.subject_id}"
                if name not in subject_avg:
                    subject_avg[name] = []
                subject_avg[name].append(m.marks_obtained / m.max_marks * 100)

            subject_avg = {k: round(sum(v) / len(v), 1) for k, v in subject_avg.items()}
            weak   = {k: v for k, v in subject_avg.items() if v < 60}
            strong = {k: v for k, v in subject_avg.items() if v >= 80}
            overall = round(sum(subject_avg.values()) / len(subject_avg), 1)

            recs = []
            if weak:
                recs.append(f"Focus on: {', '.join(weak.keys())} — these are below 60%.")
            if strong:
                recs.append(f"Great work in: {', '.join(strong.keys())}!")
            if overall < 60:
                recs.append("Consider asking teachers for extra help or forming study groups.")
            elif overall >= 80:
                recs.append("Excellent overall performance! Keep it up.")

            return {
                "weak_subjects": weak,
                "strong_subjects": strong,
                "overall_average": overall,
                "recommendations": recs,
            }

        return [get_attendance, get_homework, get_marks, get_exam_schedule, get_performance_analysis]
