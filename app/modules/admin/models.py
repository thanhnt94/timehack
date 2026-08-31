from sqlalchemy import Column, Integer, String, JSON, DateTime
from app.core.database import Base
from datetime import datetime

class SystemConfig(Base):
    __tablename__ = "system_configs"
    
    id = Column(String(50), primary_key=True) # e.g., 'sso_config', 'telegram_config'
    value = Column(JSON)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AdminLog(Base):
    __tablename__ = "admin_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, index=True)
    action = Column(String(100))
    details = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
