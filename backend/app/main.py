from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
from app.database import get_db
from app.routes import auth, students, teachers, parents, management, attendance, homework, marks, notifications
from app.routes import ai_chat
from app.routes import salary

app = FastAPI(
    title="AI School Management ERP System",
    description="AI-powered School Management System with role-based access",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["teachers"])
app.include_router(parents.router, prefix="/api/parents", tags=["parents"])
app.include_router(management.router, prefix="/api/management", tags=["management"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(homework.router, prefix="/api/homework", tags=["homework"])
app.include_router(marks.router, prefix="/api/marks", tags=["marks"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(ai_chat.router, prefix="/api/ai", tags=["ai-chat"])
app.include_router(salary.router, prefix="/api/salary", tags=["salary"])

@app.get("/")
async def root():
    return {"message": "AI School Management ERP System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
