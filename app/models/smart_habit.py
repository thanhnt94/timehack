from datetime import time
from typing import Optional
from sqlalchemy import ForeignKey, Time, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..extensions import db

class SmartHabit(db.Model):
    __tablename__ = 'smart_habits'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id', ondelete='CASCADE'))
    tag_id: Mapped[Optional[int]] = mapped_column(ForeignKey('tags.id', ondelete='SET NULL'), nullable=True)
    
    expected_time: Mapped[time] = mapped_column(Time, nullable=False) 
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    ignore_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user = relationship("User", backref="smart_habits")
    category = relationship("Category")
    tag = relationship("Tag")

    def to_dict(self):
        return {
            "id": self.id,
            "category_name": self.category.name if self.category else "Unknown",
            "category_icon": self.category.icon if self.category else "📌",
            "expected_time": self.expected_time.strftime("%H:%M"),
            "is_active": self.is_active,
            "ignore_count": self.ignore_count
        }
