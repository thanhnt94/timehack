from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.timezone_utils import parse_to_utc, local_date_to_utc_range, get_user_today
from app.models import TimeLog, Task, Habit, HabitLog, User

router = APIRouter(prefix="/api/v1/time-tracking", tags=["TimeTracking"])

class TimeLogCreateSchema(BaseModel):
    task_id: Optional[int] = None
    habit_id: Optional[int] = None
    category_id: Optional[int] = None
    start_time: str # ISO string or YYYY-MM-DDTHH:MM:SS
    end_time: str # ISO string or YYYY-MM-DDTHH:MM:SS
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
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"

    stmt = select(TimeLog).options(
        selectinload(TimeLog.task),
        selectinload(TimeLog.habit),
        selectinload(TimeLog.category)
    ).where(TimeLog.user_id == user_id)

    if task_id:
        stmt = stmt.where(TimeLog.task_id == task_id)
    if habit_id:
        stmt = stmt.where(TimeLog.habit_id == habit_id)

    if date_str:
        utc_start, utc_end = local_date_to_utc_range(date_str, user_tz)
        stmt = stmt.where(TimeLog.start_time >= utc_start, TimeLog.start_time <= utc_end)

    stmt = stmt.order_by(TimeLog.start_time.desc())
    res = await db.execute(stmt)
    logs = res.scalars().all()

    return [{
        "id": l.id,
        "task_id": l.task_id,
        "task_title": l.task.title if l.task else None,
        "habit_id": l.habit_id,
        "habit_title": l.habit.title if l.habit else None,
        "category_id": l.category_id,
        "category_name": l.category.name if l.category else None,
        "category_color": l.category.color if l.category else None,
        "start_time": l.start_time.isoformat() + "Z", # UTC ISO format
        "end_time": l.end_time.isoformat() + "Z",
        "duration_seconds": l.duration_seconds,
        "timer_type": l.timer_type,
        "notes": l.notes
    } for l in logs]

@router.post("/logs")
async def create_time_log(payload: TimeLogCreateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"

    start_dt = parse_to_utc(payload.start_time, user_tz)
    end_dt = parse_to_utc(payload.end_time, user_tz)

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
            user_today = get_user_today(user_tz)
            hl_res = await db.execute(select(HabitLog).where(HabitLog.habit_id == habit.id, HabitLog.logged_date == user_today))
            h_log = hl_res.scalar_one_or_none()
            if not h_log:
                db.add(HabitLog(habit_id=habit.id, user_id=user_id, logged_date=user_today, count=1, completed=True))
            else:
                h_log.completed = True

    await db.commit()
    await db.refresh(log_entry)
    return {"status": "ok", "log_id": log_entry.id, "duration_seconds": log_entry.duration_seconds}

@router.patch("/logs/{log_id}")
async def update_time_log(log_id: int, payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(TimeLog).where(TimeLog.id == log_id, TimeLog.user_id == user_id))
    log = res.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Time log not found")

    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"

    if "notes" in payload:
        log.notes = payload["notes"]
    if "category_id" in payload:
        log.category_id = payload["category_id"]
    if "timer_type" in payload:
        log.timer_type = payload["timer_type"]
    if "start_time" in payload:
        log.start_time = parse_to_utc(payload["start_time"], user_tz)
    if "end_time" in payload:
        log.end_time = parse_to_utc(payload["end_time"], user_tz)
    if "duration_seconds" in payload:
        log.duration_seconds = payload["duration_seconds"]

    await db.commit()
    return {"status": "ok", "log_id": log.id}

@router.delete("/logs/{log_id}")
async def delete_time_log(log_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(TimeLog).where(TimeLog.id == log_id, TimeLog.user_id == user_id))
    log = res.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Time log not found")
        
    # Subtract spent_seconds from task if needed
    if log.task_id:
        t_res = await db.execute(select(Task).where(Task.id == log.task_id, Task.user_id == user_id))
        task = t_res.scalar_one_or_none()
        if task and task.spent_seconds:
            task.spent_seconds = max(0, task.spent_seconds - log.duration_seconds)
            
    await db.delete(log)
    await db.commit()
    return {"status": "ok"}
