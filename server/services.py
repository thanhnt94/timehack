from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from .models import TimeEntry, Category, TodoItem, Tag

class TimeLoggingService:
    @staticmethod
    async def start_timer(
        db: AsyncSession, 
        user_id: int, 
        category_id: Optional[int] = None, 
        note: Optional[str] = None, 
        is_pomodoro: bool = False, 
        todo_id: Optional[int] = None
    ):
        """Start a new running timer. Stops any existing running timer first."""
        # Stop any existing running entry
        await TimeLoggingService.stop_timer(db, user_id)

        entry = TimeEntry(
            user_id=user_id,
            category_id=category_id,
            todo_id=todo_id,
            start_time=datetime.now(timezone.utc).replace(tzinfo=None), # SQLite naive
            is_pomodoro=is_pomodoro,
            is_running=True,
            note=note,
        )
        db.add(entry)
        
        # Update Todo status to 'in_progress'
        if todo_id:
            result = await db.execute(select(TodoItem).where(TodoItem.id == todo_id))
            todo = result.scalar_one_or_none()
            if todo:
                todo.status = 'in_progress'

        await db.commit()
        await db.refresh(entry)
        return entry

    @staticmethod
    async def stop_timer(db: AsyncSession, user_id: int):
        """Stop the currently running timer."""
        result = await db.execute(
            select(TimeEntry)
            .where(TimeEntry.user_id == user_id, TimeEntry.is_running == True)
            .options(selectinload(TimeEntry.category))
        )
        entry = result.scalar_one_or_none()
        
        if not entry:
            return None, None

        # Custom stop logic to handle duration
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        entry.end_time = now_utc
        entry.is_running = False
        
        delta = entry.end_time - entry.start_time
        entry.duration = max(1, int(delta.total_seconds() / 60))
        
        # Update Todo status if attached
        if entry.todo_id:
            todo_res = await db.execute(select(TodoItem).where(TodoItem.id == entry.todo_id))
            todo = todo_res.scalar_one_or_none()
            if todo:
                todo.status = 'completed'
                todo.is_completed = True

        # TODO: Implement Gamification (EXP) logic here
        
        await db.commit()
        await db.refresh(entry)
        return entry, None

    @staticmethod
    async def get_running_entry(db: AsyncSession, user_id: int):
        """Get the currently running timer entry, if any."""
        result = await db.execute(
            select(TimeEntry)
            .where(TimeEntry.user_id == user_id, TimeEntry.is_running == True)
            .options(selectinload(TimeEntry.category), selectinload(TimeEntry.todo))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_recent_entries(db: AsyncSession, user_id: int, limit: int = 20):
        """Get recent completed entries."""
        result = await db.execute(
            select(TimeEntry)
            .where(TimeEntry.user_id == user_id, TimeEntry.is_running == False)
            .order_by(TimeEntry.start_time.desc())
            .limit(limit)
            .options(selectinload(TimeEntry.category), selectinload(TimeEntry.tags))
        )
        return result.scalars().all()

    @staticmethod
    async def get_dashboard_stats(db: AsyncSession, user_id: int):
        """Calculate statistics for the dashboard."""
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())

        # 1. Total Today
        res_today = await db.execute(
            select(TimeEntry.duration)
            .where(
                TimeEntry.user_id == user_id,
                TimeEntry.start_time >= today_start,
                TimeEntry.is_running == False
            )
        )
        total_today = sum(d or 0 for d in res_today.scalars().all())

        # 2. Total Week
        res_week = await db.execute(
            select(TimeEntry.duration)
            .where(
                TimeEntry.user_id == user_id,
                TimeEntry.start_time >= week_start,
                TimeEntry.is_running == False
            )
        )
        total_week = sum(d or 0 for d in res_week.scalars().all())

        # 3. Deep Work Today (Pomodoro)
        res_deep = await db.execute(
            select(TimeEntry.duration)
            .where(
                TimeEntry.user_id == user_id,
                TimeEntry.start_time >= today_start,
                TimeEntry.is_pomodoro == True,
                TimeEntry.is_running == False
            )
        )
        deep_work_today = sum(d or 0 for d in res_deep.scalars().all())

        # 4. Recent Entries
        recent = await TimeLoggingService.get_recent_entries(db, user_id, limit=5)

        return {
            "total_today": total_today,
            "total_week": total_week,
            "deep_work_today": deep_work_today,
            "daily_goal": 480, # Default 8 hours
            "recent_entries": recent
        }
