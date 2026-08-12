from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import date
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import ScheduleSlot, Category, Task, Habit

router = APIRouter(prefix="/api/v1/schedule", tags=["Schedule"])

class ScheduleSlotCreateSchema(BaseModel):
    date: str # YYYY-MM-DD
    start_time: str # "09:00"
    end_time: str # "10:30"
    title: str
    task_id: Optional[int] = None
    habit_id: Optional[int] = None
    category_id: Optional[int] = None
    notes: Optional[str] = None

@router.get("")
async def get_schedule_slots(date_str: Optional[str] = None, request: Request = None, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    target_date = date.today()
    if date_str:
        try:
            target_date = date.fromisoformat(date_str)
        except Exception:
            pass

    stmt = select(ScheduleSlot).where(ScheduleSlot.user_id == user_id, ScheduleSlot.date == target_date).order_by(ScheduleSlot.start_time.asc())
    res = await db.execute(stmt)
    slots = res.scalars().all()

    result = []
    for s in slots:
        cat_info = None
        if s.category_id:
            c_res = await db.execute(select(Category).where(Category.id == s.category_id))
            c_obj = c_res.scalar_one_or_none()
            if c_obj:
                cat_info = {"id": c_obj.id, "name": c_obj.name, "color": c_obj.color}

        result.append({
            "id": s.id,
            "date": s.date.isoformat(),
            "start_time": s.start_time,
            "end_time": s.end_time,
            "title": s.title,
            "task_id": s.task_id,
            "habit_id": s.habit_id,
            "category_id": s.category_id,
            "category": cat_info,
            "is_done": s.is_done,
            "notes": s.notes
        })

    return result

@router.post("")
async def create_schedule_slot(payload: ScheduleSlotCreateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    try:
        slot_date = date.fromisoformat(payload.date)
    except Exception:
        slot_date = date.today()

    slot = ScheduleSlot(
        user_id=user_id,
        date=slot_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        title=payload.title,
        task_id=payload.task_id,
        habit_id=payload.habit_id,
        category_id=payload.category_id,
        notes=payload.notes
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return {"status": "ok", "slot_id": slot.id, "title": slot.title}

@router.patch("/{slot_id}")
async def update_schedule_slot(slot_id: int, payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(ScheduleSlot).where(ScheduleSlot.id == slot_id, ScheduleSlot.user_id == user_id))
    slot = res.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Schedule slot not found")

    if "is_done" in payload:
        slot.is_done = payload["is_done"]
    if "title" in payload:
        slot.title = payload["title"]
    if "start_time" in payload:
        slot.start_time = payload["start_time"]
    if "end_time" in payload:
        slot.end_time = payload["end_time"]

    await db.commit()
    return {"status": "ok", "is_done": slot.is_done}

@router.delete("/{slot_id}")
async def delete_schedule_slot(slot_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(ScheduleSlot).where(ScheduleSlot.id == slot_id, ScheduleSlot.user_id == user_id))
    slot = res.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Schedule slot not found")
    await db.delete(slot)
    await db.commit()
    return {"status": "ok"}
