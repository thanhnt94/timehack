from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class TimeLog(Base):
    __tablename__ = "time_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_seconds = Column(Integer, default=0)
    timer_type = Column(String(20), default="pomodoro") # pomodoro, stopwatch, manual
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="time_logs")
    habit = relationship("Habit")
    category = relationship("Category")
