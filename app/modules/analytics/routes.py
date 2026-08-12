from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, date, timedelta
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Task, Habit, HabitLog, TimeLog, Category

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/summary")
async def get_analytics_summary(days: int = 7, request: Request = None, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    start_date = date.today() - timedelta(days=days - 1)
    dt_start = datetime.combine(start_date, datetime.min.time())

    # 1. Total Time Tracked (seconds & minutes)
    time_res = await db.execute(
        select(func.sum(TimeLog.duration_seconds))
        .where(TimeLog.user_id == user_id, TimeLog.start_time >= dt_start)
    )
    total_seconds = time_res.scalar() or 0
    total_hours = round(total_seconds / 3600.0, 1)

    # 2. Task Completion Rate
    completed_tasks_res = await db.execute(
        select(func.count(Task.id)).where(Task.user_id == user_id, Task.status == "completed", Task.completed_at >= dt_start)
    )
    completed_count = completed_tasks_res.scalar() or 0

    total_tasks_res = await db.execute(
        select(func.count(Task.id)).where(Task.user_id == user_id)
    )
    total_tasks_count = total_tasks_res.scalar() or 0

    # 3. Category Distribution
    cat_stmt = (
        select(Category.name, Category.color, func.sum(TimeLog.duration_seconds).label("total_sec"))
        .join(TimeLog, TimeLog.category_id == Category.id)
        .where(TimeLog.user_id == user_id, TimeLog.start_time >= dt_start)
        .group_by(Category.id)
    )
    cat_res = await db.execute(cat_stmt)
    cat_rows = cat_res.all()
    category_distribution = [
        {"name": row.name, "color": row.color, "minutes": round(row.total_sec / 60.0, 1)}
        for row in cat_rows
    ]

    # 4. Daily Productivity breakdown (last `days` days)
    daily_productivity = []
    curr_date = start_date
    today = date.today()

    while curr_date <= today:
        d_start = datetime.combine(curr_date, datetime.min.time())
        d_end = datetime.combine(curr_date, datetime.max.time())

        # Time spent on date
        d_time_res = await db.execute(
            select(func.sum(TimeLog.duration_seconds))
            .where(TimeLog.user_id == user_id, TimeLog.start_time >= d_start, TimeLog.start_time <= d_end)
        )
        d_seconds = d_time_res.scalar() or 0

        # Tasks completed on date
        d_task_res = await db.execute(
            select(func.count(Task.id))
            .where(Task.user_id == user_id, Task.status == "completed", Task.completed_at >= d_start, Task.completed_at <= d_end)
        )
        d_completed_tasks = d_task_res.scalar() or 0

        # Habit checkins on date
        d_habit_res = await db.execute(
            select(func.count(HabitLog.id))
            .where(HabitLog.user_id == user_id, HabitLog.logged_date == curr_date, HabitLog.completed == True)
        )
        d_habits_completed = d_habit_res.scalar() or 0

        daily_productivity.append({
            "date": curr_date.isoformat(),
            "day_name": curr_date.strftime("%a"),
            "minutes": round(d_seconds / 60.0, 1),
            "completed_tasks": d_completed_tasks,
            "completed_habits": d_habits_completed
        })
        curr_date += timedelta(days=1)

    return {
        "days": days,
        "total_hours": total_hours,
        "completed_tasks_count": completed_count,
        "total_tasks_count": total_tasks_count,
        "category_distribution": category_distribution,
        "daily_productivity": daily_productivity
    }
