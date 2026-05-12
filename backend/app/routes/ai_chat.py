from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import time
import json
from app.database import get_db
from app.models.user import User, UserRole
from app.models.ai_log import AILog
from app.schemas.ai_log import AILogCreate, AILogResponse
from app.ai_agents.student_agent import StudentAgent
from app.ai_agents.teacher_agent import TeacherAgent
from app.ai_agents.parent_agent import ParentAgent
from app.ai_agents.management_agent import ManagementAgent
from app.auth.jwt_handler import get_current_user

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str
    execution_time_ms: int

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_time = time.time()
    
    try:
        # Initialize appropriate AI agent based on user role
        if current_user.role == UserRole.STUDENT:
            agent = StudentAgent(db, current_user.id)
        elif current_user.role == UserRole.TEACHER:
            agent = TeacherAgent(db, current_user.id)
        elif current_user.role == UserRole.PARENT:
            agent = ParentAgent(db, current_user.id)
        elif current_user.role == UserRole.MANAGEMENT:
            agent = ManagementAgent(db, current_user.id)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user role"
            )
        
        # Process the query
        response = await agent.process_query(chat_request.query)
        
        execution_time = int((time.time() - start_time) * 1000)
        
        # Log the interaction
        ai_log = AILog(
            user_id=current_user.id,
            user_role=current_user.role.value,
            query=chat_request.query,
            response=response,
            tools_used=json.dumps(agent.get_tools_used()),
            execution_time_ms=execution_time
        )
        
        db.add(ai_log)
        db.commit()
        
        return ChatResponse(
            response=response,
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        execution_time = int((time.time() - start_time) * 1000)
        
        # Log the error
        ai_log = AILog(
            user_id=current_user.id,
            user_role=current_user.role.value,
            query=chat_request.query,
            response=f"Error: {str(e)}",
            tools_used="[]",
            execution_time_ms=execution_time
        )
        
        db.add(ai_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI processing failed"
        )

@router.get("/history", response_model=list[AILogResponse])
async def get_chat_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = db.query(AILog).filter(
        AILog.user_id == current_user.id
    ).order_by(
        AILog.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return logs

@router.get("/history/{log_id}", response_model=AILogResponse)
async def get_chat_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = db.query(AILog).filter(
        AILog.id == log_id,
        AILog.user_id == current_user.id
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat log not found"
        )
    
    return log
