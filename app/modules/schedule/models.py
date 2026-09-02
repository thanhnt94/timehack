from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    date = Column(Date, nullable=False, index=True) # YYYY-MM-DD
    start_time = Column(String(10), nullable=False) # "09:00"
    end_time = Column(String(10), nullable=False) # "10:30"
    title = Column(String(255), nullable=False)
    
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    is_done = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    # Reminder & Notifications
    reminder_enabled = Column(Boolean, default=False)
    remind_at = Column(DateTime, nullable=True)
    remind_before_mins = Column(Integer, default=30)

    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task")
    habit = relationship("Habit")
    category = relationship("Category")
