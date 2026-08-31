from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date
from app.modules.habits.models import Habit, HabitLog

class HabitInterface:
    @staticmethod
    async def get_user_habits_summary(db: AsyncSession, user_id: int, target_date: date) -> Dict[str, Any]:
        total_res = await db.execute(select(func.count(Habit.id)).where(Habit.user_id == user_id, Habit.archived == False))
        done_res = await db.execute(
            select(func.count(HabitLog.id))
            .join(Habit, HabitLog.habit_id == Habit.id)
            .where(
                Habit.user_id == user_id,
                Habit.archived == False,
                HabitLog.logged_date == target_date,
                HabitLog.completed == True
            )
        )
        total = total_res.scalar() or 0
        done = done_res.scalar() or 0
        return {
            "total_habits": total,
            "completed_today": done,
            "completion_rate": round((done / total * 100), 1) if total > 0 else 0
        }
