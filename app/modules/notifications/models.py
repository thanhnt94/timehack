from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
from app.core.database import Base

class UserNotification(Base):
    __tablename__ = "user_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="system") # task, habit, schedule, system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
