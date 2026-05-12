from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from langchain_core.tools import tool
from .base_agent import BaseAgent


class TeacherAgent(BaseAgent):

    def get_system_prompt(self) -> str:
        return (
            "You are a professional AI assistant for teachers in a school management system. "
            "You can help with attendance, homework, marks, student performance reports, and notifications. "
            "You only access data for the teacher's assigned classes. Be efficient and insightful."
        )

    def create_tools(self) -> List:
        db      = self.db
        user_id = self.user_id

        @tool
        def get_my_class_info() -> Dict[str, Any]:
            """Get the teacher's assigned class and list of students."""
            from app.models.teacher import Teacher
            from app.models.student import Student
            from app.models.class_model import Class

            teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
            if not teacher:
                return {"error": "Teacher profile not found"}

            cls = db.query(Class).filter(Class.teacher_id == teacher.id).first()
            if not cls:
                return {"message": "No class assigned yet.", "students": []}

            students = db.query(Student).filter(Student.class_id == cls.id).all()
            return {
                "class": {"id": cls.id, "name": cls.name, "grade": cls.grade, "section": cls.section},
                "students": [
                    {"id": s.id, "name": f"{s.first_name} {s.last_name}", "admission_no": s.admission_number}
                    for s in students
                ],
                "total_students": len(students),
            }

        @tool
        def get_class_attendance(days: int = 7) -> Dict[str, Any]:
            """Get attendance summary for the teacher's class over the last N days."""
            from app.models.teacher import Teacher
            from app.models.student import Student
            from app.models.attendance import Attendance
            from app.models.class_model import Class

            teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
            if not teacher:
                return {"error": "Teacher profile not found"}

            cls = db.query(Class).filter(Class.teacher_id == teacher.id).first()
            if not cls:
                return {"error": "No class assigned"}

            since    = date.today() - timedelta(days=days)
            students = db.query(Student).filter(Student.class_id == cls.id).all()
            summary  = []

            for s in students:
                records = db.query(Attendance).filter(
                    Attendance.student_id == s.id,
                    Attendance.date >= since
                ).all()
                present = sum(1 for r in records if r.status == "PRESENT")
                total   = len(records)
                summary.append({
                    "student": f"{s.first_name} {s.last_name}",
                    "present": present,
                    "total": total,
                    "rate": round(present / total * 100, 1) if total else 0,
                })

            return {"period_days": days, "attendance_summary": summary}

        @tool
        def get_class_performance() -> Dict[str, Any]:
            """Get marks and performance summary for all students in the teacher's class."""
            from app.models.teacher import Teacher
            from app.models.student import Student
            from app.models.mark import Mark
            from app.models.class_model import Class

            teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
            if not teacher:
                return {"error": "Teacher profile not found"}

            cls = db.query(Class).filter(Class.teacher_id == teacher.id).first()
            if not cls:
                return {"error": "No class assigned"}

            students = db.query(Student).filter(Student.class_id == cls.id).all()
            result   = []

            for s in students:
                marks = db.query(Mark).filter(Mark.student_id == s.id).all()
                if marks:
                    avg = round(sum(m.marks_obtained / m.max_marks * 100 for m in marks) / len(marks), 1)
                else:
                    avg = 0
                result.append({
                    "student": f"{s.first_name} {s.last_name}",
                    "average_pct": avg,
                    "assessments": len(marks),
                })

            class_avg = round(sum(r["average_pct"] for r in result) / len(result), 1) if result else 0
            return {"students_performance": result, "class_average": class_avg}

        @tool
        def identify_weak_students(threshold: float = 60.0) -> Dict[str, Any]:
            """Find students performing below the given percentage threshold (default 60%)."""
            from app.models.teacher import Teacher
            from app.models.student import Student
            from app.models.mark import Mark
            from app.models.class_model import Class

            teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
            if not teacher:
                return {"error": "Teacher profile not found"}

            cls = db.query(Class).filter(Class.teacher_id == teacher.id).first()
            if not cls:
                return {"error": "No class assigned"}

            students = db.query(Student).filter(Student.class_id == cls.id).all()
            weak     = []

            for s in students:
                marks = db.query(Mark).filter(Mark.student_id == s.id).all()
                if marks:
                    avg = sum(m.marks_obtained / m.max_marks * 100 for m in marks) / len(marks)
                    if avg < threshold:
                        weak.append({"student": f"{s.first_name} {s.last_name}", "average_pct": round(avg, 1)})

            return {"weak_students": weak, "threshold": threshold, "count": len(weak)}

        @tool
        def get_my_homework() -> Dict[str, Any]:
            """Get all homework assignments created by this teacher."""
            from app.models.teacher import Teacher
            from app.models.homework import Homework

            teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
            if not teacher:
                return {"error": "Teacher profile not found"}

            hw_list = db.query(Homework).filter(Homework.teacher_id == teacher.id).order_by(Homework.due_date.desc()).all()
            today   = date.today()

            return {
                "homework": [
                    {
                        "id": hw.id,
                        "title": hw.title,
                        "due_date": hw.due_date.strftime("%Y-%m-%d"),
                        "status": "pending" if hw.due_date >= today else "past",
                        "max_marks": hw.max_marks,
                    }
                    for hw in hw_list
                ],
                "total": len(hw_list),
            }

        @tool
        def get_salary_info() -> Dict[str, Any]:
            """Get the teacher's salary records."""
            from app.models.teacher import Teacher
            from app.models.salary import Salary

            teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
            if not teacher:
                return {"error": "Teacher profile not found"}

            records = db.query(Salary).filter(Salary.teacher_id == teacher.id).order_by(
                Salary.year.desc(), Salary.month.desc()
            ).limit(6).all()

            return {
                "base_salary": teacher.salary,
                "recent_payments": [
                    {
                        "month": r.month,
                        "year": r.year,
                        "amount": r.amount,
                        "deductions": r.deductions,
                        "bonuses": r.bonuses,
                        "net": r.amount - r.deductions + r.bonuses,
                        "status": r.status,
                    }
                    for r in records
                ],
            }

        return [get_my_class_info, get_class_attendance, get_class_performance,
                identify_weak_students, get_my_homework, get_salary_info]
