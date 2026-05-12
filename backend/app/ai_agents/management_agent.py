from typing import List, Dict, Any
from datetime import date, timedelta
from langchain_core.tools import tool
from .base_agent import BaseAgent


class ManagementAgent(BaseAgent):

    def get_system_prompt(self) -> str:
        return (
            "You are an analytical AI assistant for school management. "
            "You have full access to school data: students, teachers, attendance, marks, salary, and analytics. "
            "Provide strategic insights, generate reports, and identify issues. Be concise and data-driven."
        )

    def create_tools(self) -> List:
        db      = self.db
        user_id = self.user_id

        @tool
        def get_school_overview() -> Dict[str, Any]:
            """Get a high-level overview of the school: total students, teachers, classes, subjects."""
            from app.models.student import Student
            from app.models.teacher import Teacher
            from app.models.parent import Parent
            from app.models.class_model import Class
            from app.models.subject import Subject

            total_students = db.query(Student).count()
            total_teachers = db.query(Teacher).count()
            total_parents  = db.query(Parent).count()
            total_classes  = db.query(Class).count()
            total_subjects = db.query(Subject).count()

            return {
                "total_students": total_students,
                "total_teachers": total_teachers,
                "total_parents": total_parents,
                "total_classes": total_classes,
                "total_subjects": total_subjects,
                "student_teacher_ratio": round(total_students / total_teachers, 1) if total_teachers else "N/A",
            }

        @tool
        def get_attendance_summary(days: int = 30) -> Dict[str, Any]:
            """Get school-wide attendance summary for the last N days (default 30)."""
            from app.models.attendance import Attendance

            since   = date.today() - timedelta(days=days)
            records = db.query(Attendance).filter(Attendance.date >= since).all()
            total   = len(records)
            present = sum(1 for r in records if r.status == "PRESENT")
            absent  = sum(1 for r in records if r.status == "ABSENT")
            late    = sum(1 for r in records if r.status == "LATE")

            return {
                "period_days": days,
                "total_records": total,
                "present": present,
                "absent": absent,
                "late": late,
                "attendance_rate": round(present / total * 100, 1) if total else 0,
            }

        @tool
        def get_academic_performance() -> Dict[str, Any]:
            """Get school-wide academic performance: overall average and grade distribution."""
            from app.models.mark import Mark
            from app.models.subject import Subject

            marks = db.query(Mark).all()
            if not marks:
                return {"message": "No marks data available yet."}

            total_obtained = sum(m.marks_obtained for m in marks)
            total_max      = sum(m.max_marks for m in marks)
            overall_avg    = round(total_obtained / total_max * 100, 1) if total_max else 0

            grade_dist: Dict[str, int] = {}
            for m in marks:
                g = m.grade or "N/A"
                grade_dist[g] = grade_dist.get(g, 0) + 1

            # Subject averages
            subj_data: Dict[str, list] = {}
            for m in marks:
                subj = db.query(Subject).filter(Subject.id == m.subject_id).first()
                name = subj.name if subj else f"Subject #{m.subject_id}"
                subj_data.setdefault(name, []).append(m.marks_obtained / m.max_marks * 100)
            subj_avg = {k: round(sum(v) / len(v), 1) for k, v in subj_data.items()}

            return {
                "overall_average": overall_avg,
                "total_assessments": len(marks),
                "grade_distribution": grade_dist,
                "subject_averages": subj_avg,
            }

        @tool
        def identify_at_risk_students(perf_threshold: float = 50.0, att_threshold: float = 75.0) -> Dict[str, Any]:
            """Find students at risk due to low performance or poor attendance."""
            from app.models.student import Student
            from app.models.mark import Mark
            from app.models.attendance import Attendance
            from app.models.class_model import Class

            students = db.query(Student).all()
            at_risk  = []
            since    = date.today() - timedelta(days=30)

            for s in students:
                marks   = db.query(Mark).filter(Mark.student_id == s.id).all()
                records = db.query(Attendance).filter(Attendance.student_id == s.id, Attendance.date >= since).all()

                perf_pct = round(sum(m.marks_obtained / m.max_marks * 100 for m in marks) / len(marks), 1) if marks else 0
                att_pct  = round(sum(1 for r in records if r.status == "PRESENT") / len(records) * 100, 1) if records else 0

                if perf_pct < perf_threshold or att_pct < att_threshold:
                    cls = db.query(Class).filter(Class.id == s.class_id).first()
                    factors = []
                    if perf_pct < perf_threshold:
                        factors.append(f"Low performance ({perf_pct}%)")
                    if att_pct < att_threshold:
                        factors.append(f"Poor attendance ({att_pct}%)")
                    at_risk.append({
                        "name": f"{s.first_name} {s.last_name}",
                        "class": cls.name if cls else "N/A",
                        "performance": perf_pct,
                        "attendance": att_pct,
                        "risk_factors": factors,
                    })

            return {"at_risk_students": at_risk, "total": len(at_risk)}

        @tool
        def get_teacher_list() -> Dict[str, Any]:
            """Get all teachers with their subject and salary info."""
            from app.models.teacher import Teacher
            from app.models.subject import Subject

            teachers = db.query(Teacher).all()
            return {
                "teachers": [
                    {
                        "name": f"{t.first_name} {t.last_name}",
                        "employee_id": t.employee_id,
                        "subject": (db.query(Subject).filter(Subject.id == t.subject_id).first() or type("S", (), {"name": "N/A"})()).name,
                        "salary": t.salary,
                    }
                    for t in teachers
                ],
                "total": len(teachers),
            }

        @tool
        def get_salary_summary() -> Dict[str, Any]:
            """Get salary payment summary: total paid, pending, and budget."""
            from app.models.teacher import Teacher
            from app.models.salary import Salary

            teachers = db.query(Teacher).all()
            budget   = sum(t.salary for t in teachers if t.salary)

            paid_records    = db.query(Salary).filter(Salary.status == "PAID").all()
            pending_records = db.query(Salary).filter(Salary.status == "PENDING").all()

            total_paid    = sum(s.amount - s.deductions + s.bonuses for s in paid_records)
            total_pending = sum(s.amount for s in pending_records)

            return {
                "annual_budget": round(budget, 2),
                "monthly_budget": round(budget / 12, 2) if budget else 0,
                "total_paid": round(total_paid, 2),
                "total_pending": round(total_pending, 2),
                "paid_count": len(paid_records),
                "pending_count": len(pending_records),
            }

        @tool
        def generate_school_report() -> Dict[str, Any]:
            """Generate a comprehensive school report covering all key metrics."""
            from app.models.student import Student
            from app.models.teacher import Teacher
            from app.models.attendance import Attendance
            from app.models.mark import Mark

            total_students = db.query(Student).count()
            total_teachers = db.query(Teacher).count()

            since   = date.today() - timedelta(days=30)
            records = db.query(Attendance).filter(Attendance.date >= since).all()
            att_rate = round(
                sum(1 for r in records if r.status == "PRESENT") / len(records) * 100, 1
            ) if records else 0

            marks = db.query(Mark).all()
            avg_perf = round(
                sum(m.marks_obtained / m.max_marks * 100 for m in marks) / len(marks), 1
            ) if marks else 0

            return {
                "report_date": date.today().strftime("%Y-%m-%d"),
                "summary": {
                    "total_students": total_students,
                    "total_teachers": total_teachers,
                    "attendance_rate_30d": att_rate,
                    "academic_average": avg_perf,
                    "student_teacher_ratio": round(total_students / total_teachers, 1) if total_teachers else "N/A",
                },
                "status": "healthy" if att_rate >= 85 and avg_perf >= 60 else "needs_attention",
            }

        return [get_school_overview, get_attendance_summary, get_academic_performance,
                identify_at_risk_students, get_teacher_list, get_salary_summary, generate_school_report]
