from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Date, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    frequency_type = Column(String(20), default="daily") # daily, weekly_days, weekly_target, monthly_target
    weekly_days = Column(JSON, nullable=True) # e.g. [0,1,2,3,4,5,6] (Mon-Sun)
    time_of_day = Column(String(20), default="anytime") # morning, afternoon, evening, anytime
    target_count = Column(Integer, default=1)
    unit = Column(String(50), default="times")
    target_count_secondary = Column(Integer, nullable=True) # Optional either/or target
    unit_secondary = Column(String(50), nullable=True) # Optional either/or unit
    reminder_time = Column(String(10), nullable=True) # e.g. "08:00"
    icon = Column(String(50), default="zap")
    color = Column(String(50), default="#10B981")
    archived = Column(Boolean, default=False)
    streak_freeze_count = Column(Integer, default=2) # available freeze shields

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="habits")
    category = relationship("Category")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    __tablename__ = "habit_logs"
    __table_args__ = (
        UniqueConstraint("habit_id", "logged_date", name="uq_habit_date"),
        Index("ix_habit_logs_user_logged_date", "user_id", "logged_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    logged_date = Column(Date, nullable=False, index=True) # YYYY-MM-DD
    completed_time = Column(String(10), nullable=True) # e.g. "08:30" or "21:15"
    count = Column(Integer, default=1)
    completed = Column(Boolean, default=True)
    is_frozen_day = Column(Boolean, default=False) # Streak Freeze shield applied
    time_spent = Column(Integer, default=0) # Minutes spent in Pomodoro Focus
    notes = Column(Text, nullable=True)
    mood = Column(String(50), nullable=True) # energized, happy, focused, tired, mindful

    created_at = Column(DateTime, default=datetime.utcnow)

    habit = relationship("Habit", back_populates="logs")
