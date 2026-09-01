"""
Analytics service layer for TimeHack.
Provides asynchronous aggregation for time tracking, habit completions, and productivity metrics.
"""

from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any, List, Optional

from app.models import TimeLog, Task, Habit, HabitLog, Category


class AnalyticsService:

    @staticmethod
    async def get_daily_summary(user_id: int, target_date: date, db: AsyncSession) -> Dict[str, Any]:
        """
        Get daily breakdown for a single date:
        - Category time distribution
        - Total focus minutes
        - Completed tasks & habits count
        """
        d_start = datetime.combine(target_date, datetime.min.time())
        d_end = datetime.combine(target_date, datetime.max.time())

        # 1. Query Time Logs for this day
        time_stmt = (
            select(Category.name, Category.color, func.sum(TimeLog.duration_seconds))
            .join(Category, TimeLog.category_id == Category.id, isouter=True)
            .where(TimeLog.user_id == user_id, TimeLog.start_time >= d_start, TimeLog.start_time <= d_end)
            .group_by(Category.id)
        )
        time_res = await db.execute(time_stmt)
        cat_breakdown = [
            {
                "category": name or "Uncategorized",
                "color": color or "#8B5CF6",
                "minutes": round((total_sec or 0) / 60.0, 1)
            }
            for name, color, total_sec in time_res.all()
        ]

        total_minutes = sum(c["minutes"] for c in cat_breakdown)

        # 2. Completed Tasks
        tasks_res = await db.execute(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                Task.status == "completed",
                Task.completed_at >= d_start,
                Task.completed_at <= d_end
            )
        )
        completed_tasks = tasks_res.scalar() or 0

        # 3. Completed Habits
        habits_res = await db.execute(
            select(func.count(HabitLog.id)).where(
                HabitLog.user_id == user_id,
                HabitLog.logged_date == target_date,
                HabitLog.completed == True
            )
        )
        completed_habits = habits_res.scalar() or 0

        return {
            "date": target_date.isoformat(),
            "total_minutes": total_minutes,
            "completed_tasks": completed_tasks,
            "completed_habits": completed_habits,
            "category_distribution": cat_breakdown
        }
