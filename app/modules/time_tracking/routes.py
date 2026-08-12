from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import TimeLog, Task, Habit, HabitLog

router = APIRouter(prefix="/api/v1/time-tracking", tags=["TimeTracking"])

class TimeLogCreateSchema(BaseModel):
    task_id: Optional[int] = None
    habit_id: Optional[int] = None
    category_id: Optional[int] = None
    start_time: str # ISO string
    end_time: str # ISO string
    duration_seconds: int
    timer_type: Optional[str] = "pomodoro" # pomodoro, stopwatch, manual
    notes: Optional[str] = None

@router.get("/logs")
async def get_time_logs(
    date_str: Optional[str] = None, 
    task_id: Optional[int] = None,
    habit_id: Optional[int] = None,
    request: Request = None, 
    db: AsyncSession = Depends(get_db)
):
    user_id = get_current_user_id(request)
    stmt = select(TimeLog).where(TimeLog.user_id == user_id)

    if task_id:
        stmt = stmt.where(TimeLog.task_id == task_id)
    if habit_id:
        stmt = stmt.where(TimeLog.habit_id == habit_id)

    if date_str:
        try:
            target_d = date.fromisoformat(date_str)
            dt_start = datetime.combine(target_d, datetime.min.time())
            dt_end = datetime.combine(target_d, datetime.max.time())
            stmt = stmt.where(TimeLog.start_time >= dt_start, TimeLog.start_time <= dt_end)
        except Exception:
            pass

    stmt = stmt.order_by(TimeLog.start_time.desc())
    res = await db.execute(stmt)
    logs = res.scalars().all()

    return [{
        "id": l.id,
        "task_id": l.task_id,
        "habit_id": l.habit_id,
        "category_id": l.category_id,
        "start_time": l.start_time.isoformat(),
        "end_time": l.end_time.isoformat(),
        "duration_seconds": l.duration_seconds,
        "timer_type": l.timer_type,
        "notes": l.notes
    } for l in logs]

@router.post("/logs")
async def create_time_log(payload: TimeLogCreateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)

    try:
        start_dt = datetime.fromisoformat(payload.start_time.replace("Z", ""))
        end_dt = datetime.fromisoformat(payload.end_time.replace("Z", ""))
    except Exception:
        start_dt = datetime.utcnow()
        end_dt = datetime.utcnow()

    log_entry = TimeLog(
        user_id=user_id,
        task_id=payload.task_id,
        habit_id=payload.habit_id,
        category_id=payload.category_id,
        start_time=start_dt,
        end_time=end_dt,
        duration_seconds=payload.duration_seconds,
        timer_type=payload.timer_type or "pomodoro",
        notes=payload.notes
    )
    db.add(log_entry)

    # 1. Update task spent_seconds if task_id provided
    if payload.task_id:
        t_res = await db.execute(select(Task).where(Task.id == payload.task_id, Task.user_id == user_id))
        task = t_res.scalar_one_or_none()
        if task:
            task.spent_seconds = (task.spent_seconds or 0) + payload.duration_seconds
            if not payload.category_id and task.category_id:
                log_entry.category_id = task.category_id

    # 2. Check-in habit if habit_id provided
    if payload.habit_id:
        h_res = await db.execute(select(Habit).where(Habit.id == payload.habit_id, Habit.user_id == user_id))
        habit = h_res.scalar_one_or_none()
        if habit:
            today_d = date.today()
            hl_res = await db.execute(select(HabitLog).where(HabitLog.habit_id == habit.id, HabitLog.logged_date == today_d))
            h_log = hl_res.scalar_one_or_none()
            if not h_log:
                db.add(HabitLog(habit_id=habit.id, user_id=user_id, logged_date=today_d, count=1, completed=True))
            else:
                h_log.completed = True

    await db.commit()
    await db.refresh(log_entry)
    return {"status": "ok", "log_id": log_entry.id, "duration_seconds": log_entry.duration_seconds}
