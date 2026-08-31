from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, date, timedelta
from typing import Optional, List
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.timezone_utils import get_user_today
from app.models import Habit, HabitLog, Category, User

router = APIRouter(prefix="/api/v1/habits", tags=["Habits"])

class HabitCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    frequency_type: Optional[str] = "daily" # daily, weekly_days, interval
    weekly_days: Optional[List[int]] = None # [0,1,2,3,4,5,6]
    target_count: Optional[int] = 1
    unit: Optional[str] = "lần"
    reminder_time: Optional[str] = None
    icon: Optional[str] = "zap"
    color: Optional[str] = "#10B981"

class HabitLogCheckinSchema(BaseModel):
    logged_date: Optional[str] = None # YYYY-MM-DD
    count: Optional[int] = 1
    completed: Optional[bool] = True
    notes: Optional[str] = None

def calculate_streak(logs: List[date], today_d: Optional[date] = None) -> dict:
    if not logs:
        return {"current_streak": 0, "longest_streak": 0}
    
    unique_dates = sorted(set(logs))
    today = today_d or date.today()
    yesterday = today - timedelta(days=1)

    # Calculate current streak
    current_streak = 0
    check_date = today
    if check_date not in unique_dates and yesterday in unique_dates:
        check_date = yesterday

    while check_date in unique_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Calculate longest streak
    longest_streak = 0
    temp_streak = 0
    prev_d = None

    for d in unique_dates:
        if prev_d is None or (d - prev_d).days == 1:
            temp_streak += 1
        else:
            temp_streak = 1
        if temp_streak > longest_streak:
            longest_streak = temp_streak
        prev_d = d

    return {"current_streak": current_streak, "longest_streak": longest_streak}

@router.get("")
async def get_habits(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"
    today_user_date = get_user_today(user_tz)

    res = await db.execute(
        select(Habit)
        .where(Habit.user_id == user_id, Habit.archived == False)
        .order_by(Habit.id.desc())
    )
    habits = res.scalars().all()

    result = []
    for h in habits:
        # Fetch logs for streak calculation
        log_res = await db.execute(
            select(HabitLog.logged_date, HabitLog.completed, HabitLog.count)
            .where(HabitLog.habit_id == h.id, HabitLog.completed == True)
            .order_by(HabitLog.logged_date.asc())
        )
        log_rows = log_res.all()
        log_dates = [row.logged_date for row in log_rows]
        streak_info = calculate_streak(log_dates, today_user_date)

        # Check today status in user timezone
        today_log_res = await db.execute(
            select(HabitLog).where(HabitLog.habit_id == h.id, HabitLog.logged_date == today_user_date)
        )
        today_log = today_log_res.scalar_one_or_none()

        cat_info = None
        if h.category_id:
            c_res = await db.execute(select(Category).where(Category.id == h.category_id))
            c_obj = c_res.scalar_one_or_none()
            if c_obj:
                cat_info = {"id": c_obj.id, "name": c_obj.name, "color": c_obj.color, "icon": c_obj.icon}

        result.append({
            "id": h.id,
            "title": h.title,
            "description": h.description,
            "category_id": h.category_id,
            "category": cat_info,
            "frequency_type": h.frequency_type,
            "weekly_days": h.weekly_days,
            "target_count": h.target_count,
            "unit": h.unit,
            "reminder_time": h.reminder_time,
            "icon": h.icon,
            "color": h.color,
            "current_streak": streak_info["current_streak"],
            "longest_streak": streak_info["longest_streak"],
            "today_completed": today_log.completed if today_log else False,
            "today_count": today_log.count if today_log else 0,
            "created_at": h.created_at.isoformat() + "Z"
        })

    return result

@router.post("")
async def create_habit(payload: HabitCreateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    habit = Habit(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        frequency_type=payload.frequency_type or "daily",
        weekly_days=payload.weekly_days or [0,1,2,3,4,5,6],
        target_count=payload.target_count or 1,
        unit=payload.unit or "lần",
        reminder_time=payload.reminder_time,
        icon=payload.icon or "zap",
        color=payload.color or "#10B981"
    )
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return {"status": "ok", "habit_id": habit.id, "title": habit.title}

@router.post("/{habit_id}/checkin")
async def checkin_habit(habit_id: int, payload: HabitLogCheckinSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"

    res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    target_date = get_user_today(user_tz)
    if payload.logged_date:
        try:
            target_date = date.fromisoformat(payload.logged_date)
        except Exception:
            pass

    log_res = await db.execute(
        select(HabitLog).where(HabitLog.habit_id == habit_id, HabitLog.logged_date == target_date)
    )
    log_obj = log_res.scalar_one_or_none()

    if not log_obj:
        log_obj = HabitLog(
            habit_id=habit_id,
            user_id=user_id,
            logged_date=target_date,
            count=payload.count or 1,
            completed=payload.completed if payload.completed is not None else True,
            notes=payload.notes
        )
        db.add(log_obj)
    else:
        # Toggle or update count
        log_obj.completed = payload.completed if payload.completed is not None else not log_obj.completed
        if payload.count is not None:
            log_obj.count = payload.count
        if payload.notes is not None:
            log_obj.notes = payload.notes

    await db.commit()

    # Recalculate streak
    all_logs = await db.execute(
        select(HabitLog.logged_date)
        .where(HabitLog.habit_id == habit_id, HabitLog.completed == True)
    )
    streak_info = calculate_streak(all_logs.scalars().all())

    return {
        "status": "ok", 
        "logged_date": target_date.isoformat(), 
        "completed": log_obj.completed,
        "current_streak": streak_info["current_streak"]
    }

@router.get("/{habit_id}/heatmap")
async def get_habit_heatmap(habit_id: int, days: int = 30, request: Request = None, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    start_d = date.today() - timedelta(days=days)
    
    logs_res = await db.execute(
        select(HabitLog)
        .where(HabitLog.habit_id == habit_id, HabitLog.logged_date >= start_d)
        .order_by(HabitLog.logged_date.asc())
    )
    logs = logs_res.scalars().all()
    log_map = {l.logged_date.isoformat(): {"completed": l.completed, "count": l.count} for l in logs}

    result = []
    curr = start_d
    today = date.today()
    while curr <= today:
        iso_str = curr.isoformat()
        info = log_map.get(iso_str, {"completed": False, "count": 0})
        result.append({
            "date": iso_str,
            "completed": info["completed"],
            "count": info["count"]
        })
        curr += timedelta(days=1)

    return result

@router.delete("/{habit_id}")
async def delete_habit(habit_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    h = res.scalar_one_or_none()
    if not h:
        raise HTTPException(status_code=404, detail="Habit not found")
    h.archived = True
    await db.commit()
    return {"status": "ok"}
