from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class TimeLog(Base):
    __tablename__ = "time_logs"
    __table_args__ = (
        Index("ix_time_logs_user_start_time", "user_id", "start_time"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    duration_seconds = Column(Integer, default=0)
    timer_type = Column(String(20), default="pomodoro") # pomodoro, stopwatch, manual
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="time_logs")
    habit = relationship("Habit")
    category = relationship("Category")


class ActiveTrack(Base):
    __tablename__ = "active_tracks"
    __table_args__ = (
        Index("ix_active_tracks_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(255), nullable=False, default="Hoạt động thực tế")
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    timer_type = Column(String(20), default="stopwatch") # stopwatch, pomodoro
    is_paused = Column(Boolean, default=False)
    accumulated_seconds = Column(Integer, default=0)
    last_resumed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    task = relationship("Task")
    habit = relationship("Habit")
    category = relationship("Category")
