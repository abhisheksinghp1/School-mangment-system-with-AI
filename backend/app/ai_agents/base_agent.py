from abc import ABC, abstractmethod
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
import os
from dotenv import load_dotenv

load_dotenv()


class BaseAgent(ABC):
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.tools_used = []

        # ── Google Gemini LLM via AI Studio ──────────────────────────────────
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",          # fast, free-tier friendly model
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0,
            convert_system_message_to_human=True,  # Gemini requires this
        )

        # Create tools and agent
        self.tools = self.create_tools()
        self.agent_executor = create_react_agent(
            self.llm,
            self.tools,
            prompt=self.get_system_prompt(),
        )

    @abstractmethod
    def get_system_prompt(self) -> str:
        pass

    @abstractmethod
    def create_tools(self) -> List:
        pass

    async def process_query(self, query: str) -> str:
        """Send a query to the Gemini agent and return the text response."""
        try:
            result = await self.agent_executor.ainvoke(
                {"messages": [HumanMessage(content=query)]}
            )
            messages = result.get("messages", [])
            # Walk backwards to find the last AI message
            for msg in reversed(messages):
                if hasattr(msg, "content") and not isinstance(msg, HumanMessage):
                    content = msg.content
                    if isinstance(content, list):
                        # Structured content blocks (Gemini sometimes returns these)
                        parts = [
                            block.get("text", "") if isinstance(block, dict) else str(block)
                            for block in content
                        ]
                        return " ".join(parts).strip()
                    return str(content)
            return "I was unable to process your request."
        except Exception as e:
            return f"I encountered an error: {str(e)}"

    def get_tools_used(self) -> List[str]:
        return self.tools_used

    @tool
    def get_user_data(self) -> Dict[str, Any]:
        """Get current user's basic information."""
        from app.models.user import User

        user = self.db.query(User).filter(User.id == self.user_id).first()
        if not user:
            return {"error": "User not found"}

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
        }
