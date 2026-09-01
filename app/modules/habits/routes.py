from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.timezone_utils import get_user_today
from app.models import Habit, HabitLog, Category, User
from app.modules.notifications.telegram_service import TelegramService

router = APIRouter(prefix="/api/v1/habits", tags=["Habits"])

# --- Pydantic Schemas ---
class HabitCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    frequency_type: Optional[str] = "daily" # daily, weekly_days, weekly_target, monthly_target
    weekly_days: Optional[List[int]] = None # [0,1,2,3,4,5,6] (Mon-Sun)
    time_of_day: Optional[str] = "anytime" # morning, afternoon, evening, anytime
    target_count: Optional[int] = 1
    unit: Optional[str] = "times"
    reminder_time: Optional[str] = None
    icon: Optional[str] = "zap"
    color: Optional[str] = "#10B981"

class HabitUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    frequency_type: Optional[str] = None
    weekly_days: Optional[List[int]] = None
    time_of_day: Optional[str] = None
    target_count: Optional[int] = None
    unit: Optional[str] = None
    reminder_time: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    archived: Optional[bool] = None

class HabitLogUpsertSchema(BaseModel):
    logged_date: str # YYYY-MM-DD
    completed_time: Optional[str] = None # e.g. "08:30"
    count: Optional[int] = 1
    completed: Optional[bool] = True
    is_frozen_day: Optional[bool] = False
    time_spent: Optional[int] = 0
    notes: Optional[str] = None
    mood: Optional[str] = None

class HabitFreezeDaySchema(BaseModel):
    logged_date: Optional[str] = None # YYYY-MM-DD (defaults to today)

class HabitLogFocusSchema(BaseModel):
    duration_minutes: int
    logged_date: Optional[str] = None
    notes: Optional[str] = None

class TelegramCheckinSchema(BaseModel):
    habit_id: int
    action: str # "complete", "freeze", "snooze"
    secret_key: Optional[str] = None

# --- Streak & Analytics Calculation Helper ---
def calculate_streak(valid_dates: List[date], today_d: Optional[date] = None) -> dict:
    if not valid_dates:
        return {"current_streak": 0, "longest_streak": 0}
    
    unique_dates = sorted(set(valid_dates))
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

def calculate_habit_strength(
    logs: List[HabitLog],
    created_at: datetime,
    today_d: date,
    window_days: int = 30
) -> Dict[str, Any]:
    """
    Calculates Habit Strength % and Mastery Rank (S/A/B/C) over rolling 30 days.
    """
    start_d = today_d - timedelta(days=window_days - 1)
    effective_start = max(start_d, created_at.date())
    total_days = max(1, (today_d - effective_start).days + 1)

    valid_log_dates = set()
    for l in logs:
        if (l.completed or l.is_frozen_day) and l.logged_date >= effective_start:
            valid_log_dates.add(l.logged_date)

    success_days = len(valid_log_dates)
    strength_percent = min(100, round((success_days / total_days) * 100))

    if strength_percent >= 90:
        rank = "S"
        rank_title = "Mastered"
    elif strength_percent >= 75:
        rank = "A"
        rank_title = "Consistent"
    elif strength_percent >= 50:
        rank = "B"
        rank_title = "Building"
    else:
        rank = "C"
        rank_title = "Starting"

    return {
        "strength_percent": strength_percent,
        "mastery_rank": rank,
        "rank_title": rank_title,
        "success_days_30d": success_days,
        "window_days": total_days
    }

# --- Endpoints ---

@router.get("")
async def get_habits(
    request: Request,
    include_archived: Optional[bool] = False,
    db: AsyncSession = Depends(get_db)
):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"
    today_user_date = get_user_today(user_tz)

    stmt = select(Habit).where(Habit.user_id == user_id)
    if not include_archived:
        stmt = stmt.where(Habit.archived == False)
    stmt = stmt.order_by(Habit.archived.asc(), Habit.id.desc())

    res = await db.execute(stmt)
    habits = res.scalars().all()

    result = []
    for h in habits:
        # Fetch logs for streak and strength
        log_res = await db.execute(
            select(HabitLog)
            .where(HabitLog.habit_id == h.id)
            .order_by(HabitLog.logged_date.asc())
        )
        all_logs = log_res.scalars().all()
        
        # Valid dates for streak include completed or streak-frozen days
        valid_dates = [l.logged_date for l in all_logs if l.completed or l.is_frozen_day]
        streak_info = calculate_streak(valid_dates, today_user_date)
        strength_info = calculate_habit_strength(all_logs, h.created_at, today_user_date, 30)

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

        # 7-day mini sparkline
        mini_history = []
        log_date_map = {l.logged_date: l for l in all_logs}
        for i in range(6, -1, -1):
            d = today_user_date - timedelta(days=i)
            lg = log_date_map.get(d)
            mini_history.append({
                "date": d.isoformat(),
                "completed": lg.completed if lg else False,
                "is_frozen_day": lg.is_frozen_day if lg else False
            })

        result.append({
            "id": h.id,
            "title": h.title,
            "description": h.description,
            "category_id": h.category_id,
            "category": cat_info,
            "frequency_type": h.frequency_type,
            "weekly_days": h.weekly_days,
            "time_of_day": h.time_of_day or "anytime",
            "target_count": h.target_count,
            "unit": h.unit,
            "reminder_time": h.reminder_time,
            "icon": h.icon,
            "color": h.color,
            "archived": h.archived,
            "streak_freeze_count": h.streak_freeze_count or 2,
            "current_streak": streak_info["current_streak"],
            "longest_streak": streak_info["longest_streak"],
            "strength_percent": strength_info["strength_percent"],
            "mastery_rank": strength_info["mastery_rank"],
            "rank_title": strength_info["rank_title"],
            "total_completions": len([l for l in all_logs if l.completed]),
            "today_completed": today_log.completed if today_log else False,
            "today_frozen": today_log.is_frozen_day if today_log else False,
            "today_count": today_log.count if today_log else 0,
            "today_time_spent": today_log.time_spent if today_log else 0,
            "today_notes": today_log.notes if today_log else None,
            "today_mood": today_log.mood if today_log else None,
            "mini_history": mini_history,
            "created_at": h.created_at.isoformat() + "Z"
        })

    return result

@router.get("/{habit_id}")
async def get_habit_detail(habit_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"
    today_user_date = get_user_today(user_tz)

    res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Fetch all logs
    log_res = await db.execute(
        select(HabitLog)
        .where(HabitLog.habit_id == habit_id)
        .order_by(HabitLog.logged_date.desc())
    )
    logs = log_res.scalars().all()

    valid_dates = [l.logged_date for l in logs if l.completed or l.is_frozen_day]
    streak_info = calculate_streak(valid_dates, today_user_date)
    strength_info = calculate_habit_strength(logs, habit.created_at, today_user_date, 30)

    # 30-day heatmap data
    heatmap_30d = []
    log_map = {l.logged_date.isoformat(): l for l in logs}
    total_time_spent = sum(l.time_spent or 0 for l in logs)

    for i in range(29, -1, -1):
        d = today_user_date - timedelta(days=i)
        d_str = d.isoformat()
        lg = log_map.get(d_str)
        heatmap_30d.append({
            "date": d_str,
            "completed": lg.completed if lg else False,
            "is_frozen_day": lg.is_frozen_day if lg else False,
            "time_spent": lg.time_spent if lg else 0,
            "count": lg.count if lg else 0,
            "mood": lg.mood if lg else None,
            "notes": lg.notes if lg else None,
            "completed_time": lg.completed_time if lg else None
        })

    cat_info = None
    if habit.category_id:
        c_res = await db.execute(select(Category).where(Category.id == habit.category_id))
        c_obj = c_res.scalar_one_or_none()
        if c_obj:
            cat_info = {"id": c_obj.id, "name": c_obj.name, "color": c_obj.color, "icon": c_obj.icon}

    return {
        "id": habit.id,
        "title": habit.title,
        "description": habit.description,
        "category_id": habit.category_id,
        "category": cat_info,
        "frequency_type": habit.frequency_type,
        "weekly_days": habit.weekly_days,
        "time_of_day": habit.time_of_day or "anytime",
        "target_count": habit.target_count,
        "unit": habit.unit,
        "reminder_time": habit.reminder_time,
        "icon": habit.icon,
        "color": habit.color,
        "archived": habit.archived,
        "streak_freeze_count": habit.streak_freeze_count or 2,
        "current_streak": streak_info["current_streak"],
        "longest_streak": streak_info["longest_streak"],
        "strength_percent": strength_info["strength_percent"],
        "mastery_rank": strength_info["mastery_rank"],
        "rank_title": strength_info["rank_title"],
        "total_completions": len([l for l in logs if l.completed]),
        "total_time_spent": total_time_spent,
        "created_at": habit.created_at.isoformat() + "Z",
        "heatmap": heatmap_30d,
        "logs": [
            {
                "id": l.id,
                "logged_date": l.logged_date.isoformat(),
                "completed_time": l.completed_time,
                "count": l.count,
                "completed": l.completed,
                "is_frozen_day": l.is_frozen_day,
                "time_spent": l.time_spent or 0,
                "notes": l.notes,
                "mood": l.mood,
                "created_at": l.created_at.isoformat() + "Z"
            }
            for l in logs[:50]
        ]
    }

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
        time_of_day=payload.time_of_day or "anytime",
        target_count=payload.target_count or 1,
        unit=payload.unit or "times",
        reminder_time=payload.reminder_time,
        icon=payload.icon or "zap",
        color=payload.color or "#10B981",
        streak_freeze_count=2
    )
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return {"status": "ok", "habit_id": habit.id, "title": habit.title}

@router.patch("/{habit_id}")
async def update_habit(habit_id: int, payload: HabitUpdateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    if payload.title is not None:
        habit.title = payload.title
    if payload.description is not None:
        habit.description = payload.description
    if payload.category_id is not None:
        habit.category_id = payload.category_id
    if payload.frequency_type is not None:
        habit.frequency_type = payload.frequency_type
    if payload.weekly_days is not None:
        habit.weekly_days = payload.weekly_days
    if payload.time_of_day is not None:
        habit.time_of_day = payload.time_of_day
    if payload.target_count is not None:
        habit.target_count = payload.target_count
    if payload.unit is not None:
        habit.unit = payload.unit
    if payload.reminder_time is not None:
        habit.reminder_time = payload.reminder_time
    if payload.icon is not None:
        habit.icon = payload.icon
    if payload.color is not None:
        habit.color = payload.color
    if payload.archived is not None:
        habit.archived = payload.archived

    await db.commit()
    await db.refresh(habit)
    return {"status": "ok", "habit": {"id": habit.id, "title": habit.title, "archived": habit.archived}}

@router.post("/{habit_id}/toggle-freeze")
async def toggle_freeze_habit(habit_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    habit.archived = not habit.archived
    await db.commit()
    return {"status": "ok", "archived": habit.archived}

@router.post("/{habit_id}/freeze-day")
async def freeze_habit_day(habit_id: int, payload: HabitFreezeDaySchema, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Applies a Streak Freeze shield to a specific day (preventing streak loss).
    """
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
            is_frozen_day=True,
            completed=False,
            notes="🛡️ Streak Freeze applied"
        )
        db.add(log_obj)
    else:
        log_obj.is_frozen_day = not log_obj.is_frozen_day

    if habit.streak_freeze_count and habit.streak_freeze_count > 0:
        habit.streak_freeze_count -= 1

    await db.commit()

    # Recalculate streak
    all_logs = await db.execute(
        select(HabitLog)
        .where(HabitLog.habit_id == habit_id)
    )
    logs_list = all_logs.scalars().all()
    valid_dates = [l.logged_date for l in logs_list if l.completed or l.is_frozen_day]
    streak_info = calculate_streak(valid_dates, target_date)

    return {
        "status": "ok",
        "logged_date": target_date.isoformat(),
        "is_frozen_day": log_obj.is_frozen_day,
        "current_streak": streak_info["current_streak"]
    }

@router.post("/{habit_id}/log-focus")
async def log_habit_focus(habit_id: int, payload: HabitLogFocusSchema, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Logs Pomodoro focus duration directly to habit progress.
    """
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
    target_count = habit.target_count or 1

    current_time_str = datetime.now().strftime("%H:%M")

    if not log_obj:
        new_count = payload.duration_minutes if habit.unit == "mins" else 1
        is_completed = new_count >= target_count
        log_obj = HabitLog(
            habit_id=habit_id,
            user_id=user_id,
            logged_date=target_date,
            completed_time=current_time_str,
            time_spent=payload.duration_minutes,
            count=new_count,
            completed=is_completed,
            notes=payload.notes or f"⏱️ Pomodoro session: {payload.duration_minutes} mins"
        )
        db.add(log_obj)
    else:
        log_obj.time_spent = (log_obj.time_spent or 0) + payload.duration_minutes
        if habit.unit == "mins":
            log_obj.count = (log_obj.count or 0) + payload.duration_minutes
        else:
            log_obj.count = (log_obj.count or 0) + 1

        log_obj.completed = log_obj.count >= target_count
        if log_obj.completed and not log_obj.completed_time:
            log_obj.completed_time = current_time_str

    await db.commit()

    all_logs = await db.execute(
        select(HabitLog).where(HabitLog.habit_id == habit_id)
    )
    valid_dates = [l.logged_date for l in all_logs.scalars().all() if l.completed or l.is_frozen_day]
    streak_info = calculate_streak(valid_dates, target_date)

    return {
        "status": "ok",
        "logged_date": target_date.isoformat(),
        "today_count": log_obj.count,
        "completed": log_obj.completed,
        "time_spent": log_obj.time_spent,
        "current_streak": streak_info["current_streak"]
    }

@router.post("/{habit_id}/checkin")
async def checkin_habit(habit_id: int, payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"

    res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    target_date = get_user_today(user_tz)
    if payload.get("logged_date"):
        try:
            target_date = date.fromisoformat(payload["logged_date"])
        except Exception:
            pass

    log_res = await db.execute(
        select(HabitLog).where(HabitLog.habit_id == habit_id, HabitLog.logged_date == target_date)
    )
    log_obj = log_res.scalar_one_or_none()

    current_time_str = datetime.now().strftime("%H:%M")
    target_count = habit.target_count or 1

    if not log_obj:
        initial_count = payload.get("count", 1)
        is_completed = payload.get("completed", initial_count >= target_count)
        log_obj = HabitLog(
            habit_id=habit_id,
            user_id=user_id,
            logged_date=target_date,
            completed_time=payload.get("completed_time", current_time_str),
            count=initial_count,
            completed=is_completed,
            is_frozen_day=payload.get("is_frozen_day", False),
            time_spent=payload.get("time_spent", 0),
            notes=payload.get("notes"),
            mood=payload.get("mood")
        )
        db.add(log_obj)
    else:
        if "count" in payload:
            log_obj.count = payload["count"]
            log_obj.completed = log_obj.count >= target_count
        elif "step" in payload:
            new_c = max(0, log_obj.count + payload["step"])
            log_obj.count = new_c
            log_obj.completed = new_c >= target_count
        elif "completed" in payload:
            log_obj.completed = payload["completed"]
            if log_obj.completed and log_obj.count < target_count:
                log_obj.count = target_count
            elif not log_obj.completed:
                log_obj.count = 0
        else:
            # Default quick tap behavior:
            if target_count > 1:
                if log_obj.count < target_count:
                    log_obj.count += 1
                    log_obj.completed = log_obj.count >= target_count
                else:
                    log_obj.count = 0
                    log_obj.completed = False
            else:
                log_obj.completed = not log_obj.completed
                log_obj.count = 1 if log_obj.completed else 0

        if log_obj.completed and not log_obj.completed_time:
            log_obj.completed_time = current_time_str

        if "is_frozen_day" in payload:
            log_obj.is_frozen_day = payload["is_frozen_day"]
        if "time_spent" in payload:
            log_obj.time_spent = payload["time_spent"]
        if "notes" in payload:
            log_obj.notes = payload["notes"]
        if "mood" in payload:
            log_obj.mood = payload["mood"]
        if "completed_time" in payload:
            log_obj.completed_time = payload["completed_time"]

    await db.commit()

    # Recalculate streak
    all_logs = await db.execute(
        select(HabitLog)
        .where(HabitLog.habit_id == habit_id)
    )
    valid_dates = [l.logged_date for l in all_logs.scalars().all() if l.completed or l.is_frozen_day]
    streak_info = calculate_streak(valid_dates, target_date)

    return {
        "status": "ok", 
        "logged_date": target_date.isoformat(), 
        "completed": log_obj.completed,
        "is_frozen_day": log_obj.is_frozen_day,
        "count": log_obj.count,
        "target_count": target_count,
        "completed_time": log_obj.completed_time,
        "current_streak": streak_info["current_streak"]
    }

@router.post("/{habit_id}/logs")
async def upsert_habit_log(habit_id: int, payload: HabitLogUpsertSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    habit = res.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    try:
        log_d = date.fromisoformat(payload.logged_date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format (YYYY-MM-DD expected)")

    log_res = await db.execute(
        select(HabitLog).where(HabitLog.habit_id == habit_id, HabitLog.logged_date == log_d)
    )
    log_obj = log_res.scalar_one_or_none()

    if not log_obj:
        log_obj = HabitLog(
            habit_id=habit_id,
            user_id=user_id,
            logged_date=log_d,
            completed_time=payload.completed_time or datetime.now().strftime("%H:%M"),
            count=payload.count or 1,
            completed=payload.completed if payload.completed is not None else True,
            is_frozen_day=payload.is_frozen_day if payload.is_frozen_day is not None else False,
            time_spent=payload.time_spent or 0,
            notes=payload.notes,
            mood=payload.mood
        )
        db.add(log_obj)
    else:
        if payload.completed is not None:
            log_obj.completed = payload.completed
        if payload.is_frozen_day is not None:
            log_obj.is_frozen_day = payload.is_frozen_day
        if payload.time_spent is not None:
            log_obj.time_spent = payload.time_spent
        if payload.completed_time is not None:
            log_obj.completed_time = payload.completed_time
        if payload.count is not None:
            log_obj.count = payload.count
        if payload.notes is not None:
            log_obj.notes = payload.notes
        if payload.mood is not None:
            log_obj.mood = payload.mood

    await db.commit()
    await db.refresh(log_obj)
    return {
        "status": "ok",
        "log": {
            "id": log_obj.id,
            "logged_date": log_obj.logged_date.isoformat(),
            "completed_time": log_obj.completed_time,
            "count": log_obj.count,
            "completed": log_obj.completed,
            "is_frozen_day": log_obj.is_frozen_day,
            "time_spent": log_obj.time_spent,
            "notes": log_obj.notes,
            "mood": log_obj.mood
        }
    }

@router.delete("/{habit_id}")
async def delete_habit(habit_id: int, permanent: bool = False, request: Request = None, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    h = res.scalar_one_or_none()
    if not h:
        raise HTTPException(status_code=404, detail="Habit not found")

    if permanent:
        await db.delete(h)
    else:
        h.archived = True

    await db.commit()
    return {"status": "ok"}
