from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, ForeignKey, Boolean, DateTime, Text, Table, Column, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

# Association table for TimeEntry <-> Tag
entry_tags = Table(
    "entry_tags",
    Base.metadata,
    Column("entry_id", ForeignKey("time_entries.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for Category <-> Tag (to suggest tags for categories)
category_tags = Table(
    "category_tags",
    Base.metadata,
    Column("category_id", ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    full_name: Mapped[Optional[str]] = mapped_column(String(100))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(default=False)
    central_auth_id: Mapped[Optional[str]] = mapped_column(String(36), unique=True, index=True)
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Ho_Chi_Minh")
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    categories: Mapped[List["Category"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    time_entries: Mapped[List["TimeEntry"]] = relationship(back_populates="user", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))
    
    name: Mapped[str] = mapped_column(String(100))
    icon: Mapped[str] = mapped_column(String(50), default="📌")
    color: Mapped[str] = mapped_column(String(20), default="#94A3B8")
    color_bg: Mapped[str] = mapped_column(String(50), default="bg-slate-50")
    color_text: Mapped[str] = mapped_column(String(50), default="text-slate-600")
    
    current_exp: Mapped[int] = mapped_column(default=0)
    current_level: Mapped[int] = mapped_column(default=1)
    is_default: Mapped[bool] = mapped_column(default=False)

    user: Mapped["User"] = relationship(back_populates="categories")
    time_entries: Mapped[List["TimeEntry"]] = relationship(back_populates="category")
    
    # Hierarchical relationship (Self-referential)
    subcategories: Mapped[List["Category"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    parent: Mapped[Optional["Category"]] = relationship(
        back_populates="subcategories", remote_side=[id]
    )

class Tag(Base):
    __tablename__ = "tags"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(50), index=True)
    
    categories: Mapped[List["Category"]] = relationship(secondary=category_tags, backref="tags")

class TodoItem(Base):
    __tablename__ = "todo_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"))
    
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending") # pending, in_progress, completed
    is_completed: Mapped[bool] = mapped_column(default=False)
    scheduled_time: Mapped[Optional[datetime]] = mapped_column()
    is_notified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    category: Mapped["Category"] = relationship(backref="todos")

class TimeEntry(Base):
    __tablename__ = "time_entries"
    __table_args__ = (
        Index("idx_user_start_time", "user_id", "start_time"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"))
    todo_id: Mapped[Optional[int]] = mapped_column(ForeignKey("todo_items.id", ondelete="SET NULL"))
    
    start_time: Mapped[datetime] = mapped_column()
    end_time: Mapped[Optional[datetime]] = mapped_column()
    duration: Mapped[Optional[int]] = mapped_column()
    note: Mapped[Optional[str]] = mapped_column(Text)
    is_pomodoro: Mapped[bool] = mapped_column(default=False)
    is_running: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="time_entries")
    category: Mapped[Optional["Category"]] = relationship(back_populates="time_entries")
    todo: Mapped[Optional["TodoItem"]] = relationship()
    tags: Mapped[List["Tag"]] = relationship(secondary=entry_tags)
