from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(50), default="#8B5CF6") # Default violet
    icon = Column(String(50), default="folder")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="categories")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), default="medium") # low, medium, high, urgent
    status = Column(String(20), default="todo") # todo, in_progress, completed
    eisenhower = Column(String(20), default="schedule") # do_first, schedule, delegate, eliminate
    
    estimated_minutes = Column(Integer, default=30)
    spent_seconds = Column(Integer, default=0)
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    order_index = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="tasks")
    category = relationship("Category")
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    time_logs = relationship("TimeLog", back_populates="task", cascade="all, delete-orphan")


class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="subtasks")
