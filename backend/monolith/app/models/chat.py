from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, Enum, String, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.db import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False, default="Nueva Conversación")
    organization_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    messages = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete",
        order_by="ChatMessage.created_at",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    role = Column(Enum("user", "assistant", name="chat_role"), nullable=False)
    message = Column(Text, nullable=False)
    sources_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")
