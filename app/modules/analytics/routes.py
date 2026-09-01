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

    # 4. Daily Productivity breakdown (Batch query in-memory mapping)
    # 4.1 Time logs in range
    time_logs_stmt = select(TimeLog.start_time, TimeLog.duration_seconds).where(
        TimeLog.user_id == user_id, TimeLog.start_time >= dt_start
    )
    time_logs_res = await db.execute(time_logs_stmt)
    daily_time_sec = {}
    for st, dur in time_logs_res.all():
        if st:
            d_key = st.date().isoformat()
            daily_time_sec[d_key] = daily_time_sec.get(d_key, 0) + (dur or 0)

    # 4.2 Completed tasks in range
    tasks_done_stmt = select(Task.completed_at).where(
        Task.user_id == user_id, Task.status == "completed", Task.completed_at >= dt_start
    )
    tasks_done_res = await db.execute(tasks_done_stmt)
    daily_tasks_done = {}
    for (comp_at,) in tasks_done_res.all():
        if comp_at:
            d_key = comp_at.date().isoformat()
            daily_tasks_done[d_key] = daily_tasks_done.get(d_key, 0) + 1

    # 4.3 Completed habits in range
    habits_done_stmt = select(HabitLog.logged_date).where(
        HabitLog.user_id == user_id, HabitLog.logged_date >= start_date, HabitLog.completed == True
    )
    habits_done_res = await db.execute(habits_done_stmt)
    daily_habits_done = {}
    for (l_date,) in habits_done_res.all():
        if l_date:
            d_key = l_date.isoformat()
            daily_habits_done[d_key] = daily_habits_done.get(d_key, 0) + 1

    daily_productivity = []
    curr_date = start_date
    today = date.today()

    while curr_date <= today:
        iso_str = curr_date.isoformat()
        daily_productivity.append({
            "date": iso_str,
            "day_name": curr_date.strftime("%a"),
            "minutes": round(daily_time_sec.get(iso_str, 0) / 60.0, 1),
            "completed_tasks": daily_tasks_done.get(iso_str, 0),
            "completed_habits": daily_habits_done.get(iso_str, 0)
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
