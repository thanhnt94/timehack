from sqlalchemy import Column, Integer, DateTime, ForeignKey, JSON
from datetime import datetime
from app.core.database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    settings = Column(JSON, nullable=True) # Pomodoro configs, Telegram Chat ID, Theme preferences
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
