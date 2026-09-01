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
from app.models import TimeLog, ActiveTrack, Task, Habit, HabitLog, User

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

class ActiveTrackCreateSchema(BaseModel):
    title: str = "Hoạt động thực tế"
    task_id: Optional[int] = None
    habit_id: Optional[int] = None
    category_id: Optional[int] = None
    start_time: Optional[str] = None # ISO or None for utcnow
    timer_type: Optional[str] = "stopwatch"
    is_paused: Optional[bool] = False
    accumulated_seconds: Optional[int] = 0

class ActiveTrackUpdateSchema(BaseModel):
    title: Optional[str] = None
    category_id: Optional[int] = None
    start_time: Optional[str] = None
    is_paused: Optional[bool] = None
    accumulated_seconds: Optional[int] = None

# ── ACTIVE TRACKS (PERSISTED IN DB) ──

@router.get("/active-tracks")
async def get_active_tracks(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    stmt = select(ActiveTrack).options(
        selectinload(ActiveTrack.task),
        selectinload(ActiveTrack.habit),
        selectinload(ActiveTrack.category)
    ).where(ActiveTrack.user_id == user_id).order_by(ActiveTrack.created_at.desc())

    res = await db.execute(stmt)
    tracks = res.scalars().all()

    now_utc = datetime.utcnow()

    result = []
    for t in tracks:
        # Calculate real-time elapsed seconds from start_time / accumulated
        elapsed = t.accumulated_seconds
        if not t.is_paused and t.start_time:
            diff = max(0, int((now_utc - t.start_time).total_seconds()))
            elapsed = max(elapsed, diff)

        result.append({
            "id": str(t.id),
            "db_id": t.id,
            "title": t.title,
            "task_id": t.task_id,
            "task_title": t.task.title if t.task else None,
            "habit_id": t.habit_id,
            "habit_title": t.habit.title if t.habit else None,
            "category_id": t.category_id,
            "category_name": t.category.name if t.category else None,
            "category_color": t.category.color if t.category else None,
            "category_type": t.category.category_type if t.category else "productive",
            "start_time": t.start_time.isoformat() + "Z" if t.start_time else None,
            "is_paused": t.is_paused,
            "elapsed_seconds": elapsed,
            "timer_type": t.timer_type
        })
    return result

@router.post("/active-tracks")
async def create_active_track(payload: ActiveTrackCreateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"

    start_dt = parse_to_utc(payload.start_time, user_tz) if payload.start_time else datetime.utcnow()

    track = ActiveTrack(
        user_id=user_id,
        title=payload.title.strip() or "Hoạt động thực tế",
        task_id=payload.task_id,
        habit_id=payload.habit_id,
        category_id=payload.category_id,
        start_time=start_dt,
        timer_type=payload.timer_type or "stopwatch",
        is_paused=payload.is_paused or False,
        accumulated_seconds=payload.accumulated_seconds or 0,
        last_resumed_at=datetime.utcnow()
    )
    db.add(track)
    await db.commit()
    await db.refresh(track)

    # Load relationships
    stmt = select(ActiveTrack).options(
        selectinload(ActiveTrack.task),
        selectinload(ActiveTrack.habit),
        selectinload(ActiveTrack.category)
    ).where(ActiveTrack.id == track.id)
    res = await db.execute(stmt)
    loaded = res.scalar_one()

    return {
        "id": str(loaded.id),
        "db_id": loaded.id,
        "title": loaded.title,
        "task_id": loaded.task_id,
        "task_title": loaded.task.title if loaded.task else None,
        "habit_id": loaded.habit_id,
        "habit_title": loaded.habit.title if loaded.habit else None,
        "category_id": loaded.category_id,
        "category_name": loaded.category.name if loaded.category else None,
        "category_color": loaded.category.color if loaded.category else None,
        "category_type": loaded.category.category_type if loaded.category else "productive",
        "start_time": loaded.start_time.isoformat() + "Z",
        "is_paused": loaded.is_paused,
        "elapsed_seconds": loaded.accumulated_seconds,
        "timer_type": loaded.timer_type
    }

@router.patch("/active-tracks/{track_id}")
async def update_active_track(track_id: int, payload: ActiveTrackUpdateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    stmt = select(ActiveTrack).where(ActiveTrack.id == track_id, ActiveTrack.user_id == user_id)
    res = await db.execute(stmt)
    track = res.scalar_one_or_none()

    if not track:
        raise HTTPException(status_code=404, detail="Active track not found")

    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"

    if payload.title is not None:
        track.title = payload.title.strip()
    if payload.category_id is not None:
        track.category_id = payload.category_id if payload.category_id > 0 else None
    if payload.start_time is not None:
        track.start_time = parse_to_utc(payload.start_time, user_tz)
    if payload.is_paused is not None:
        track.is_paused = payload.is_paused
    if payload.accumulated_seconds is not None:
        track.accumulated_seconds = payload.accumulated_seconds

    track.updated_at = datetime.utcnow()
    await db.commit()
    return {"status": "ok"}

@router.delete("/active-tracks/{track_id}")
async def delete_active_track(track_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    stmt = delete(ActiveTrack).where(ActiveTrack.id == track_id, ActiveTrack.user_id == user_id)
    await db.execute(stmt)
    await db.commit()
    return {"status": "deleted"}

@router.post("/active-tracks/{track_id}/finish")
async def finish_active_track(track_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    stmt = select(ActiveTrack).options(
        selectinload(ActiveTrack.task),
        selectinload(ActiveTrack.habit),
        selectinload(ActiveTrack.category)
    ).where(ActiveTrack.id == track_id, ActiveTrack.user_id == user_id)
    res = await db.execute(stmt)
    track = res.scalar_one_or_none()

    if not track:
        raise HTTPException(status_code=404, detail="Active track not found")

    now_utc = datetime.utcnow()
    start_utc = track.start_time or now_utc
    duration_seconds = max(1, int((now_utc - start_utc).total_seconds()))
    if track.accumulated_seconds > duration_seconds:
        duration_seconds = track.accumulated_seconds

    # Create TimeLog entry
    log_entry = TimeLog(
        user_id=user_id,
        task_id=track.task_id,
        habit_id=track.habit_id,
        category_id=track.category_id,
        start_time=start_utc,
        end_time=now_utc,
        duration_seconds=duration_seconds,
        timer_type=track.timer_type or "stopwatch",
        notes=track.title
    )
    db.add(log_entry)

    # Update task spent seconds
    if track.task_id:
        t_res = await db.execute(select(Task).where(Task.id == track.task_id, Task.user_id == user_id))
        task = t_res.scalar_one_or_none()
        if task:
            task.spent_seconds = (task.spent_seconds or 0) + duration_seconds

    # Delete active track row
    await db.delete(track)
    await db.commit()

    return {"status": "finished", "log_id": log_entry.id, "duration_seconds": duration_seconds}

# ── COMPLETED TIME LOGS ──

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

    # 2. Update habit time_spent if habit_id provided
    if payload.habit_id:
        today_date = get_user_today(user_tz)
        hl_res = await db.execute(select(HabitLog).where(
            HabitLog.habit_id == payload.habit_id,
            HabitLog.user_id == user_id,
            HabitLog.logged_date == today_date
        ))
        habit_log = hl_res.scalar_one_or_none()
        if habit_log:
            habit_log.time_spent = (habit_log.time_spent or 0) + (payload.duration_seconds // 60)
        else:
            habit_log = HabitLog(
                habit_id=payload.habit_id,
                user_id=user_id,
                logged_date=today_date,
                count=0,
                completed=False,
                time_spent=(payload.duration_seconds // 60)
            )
            db.add(habit_log)

    await db.commit()
    await db.refresh(log_entry)

    return {
        "id": log_entry.id,
        "task_id": log_entry.task_id,
        "habit_id": log_entry.habit_id,
        "category_id": log_entry.category_id,
        "start_time": log_entry.start_time.isoformat() + "Z",
        "end_time": log_entry.end_time.isoformat() + "Z",
        "duration_seconds": log_entry.duration_seconds,
        "timer_type": log_entry.timer_type,
        "notes": log_entry.notes
    }

@router.patch("/logs/{log_id}")
async def update_time_log(log_id: int, payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"

    stmt = select(TimeLog).where(TimeLog.id == log_id, TimeLog.user_id == user_id)
    res = await db.execute(stmt)
    log = res.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Time log not found")

    if "notes" in payload:
        log.notes = payload["notes"]
    if "category_id" in payload:
        log.category_id = payload["category_id"]
    if "start_time" in payload and payload["start_time"]:
        log.start_time = parse_to_utc(payload["start_time"], user_tz)
    if "end_time" in payload and payload["end_time"]:
        log.end_time = parse_to_utc(payload["end_time"], user_tz)
    if "duration_seconds" in payload:
        log.duration_seconds = payload["duration_seconds"]

    await db.commit()
    return {"status": "ok"}

@router.delete("/logs/{log_id}")
async def delete_time_log(log_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    stmt = delete(TimeLog).where(TimeLog.id == log_id, TimeLog.user_id == user_id)
    await db.execute(stmt)
    await db.commit()
    return {"status": "deleted"}
