from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ..database import get_db
from ..models import User, TimeEntry
from ..auth import get_current_user
from ..services import TimeLoggingService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/timer", tags=["timer"])

class TimerStart(BaseModel):
    category_id: Optional[int] = None
    todo_id: Optional[int] = None
    note: Optional[str] = None
    is_pomodoro: bool = False

class TimeEntryResponse(BaseModel):
    id: int
    category_id: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]
    duration: Optional[int]
    is_running: bool
    note: Optional[str]

    class Config:
        from_attributes = True

@router.post("/start", response_model=TimeEntryResponse)
async def start_timer(
    data: TimerStart, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    entry = await TimeLoggingService.start_timer(
        db, 
        user_id=current_user.id,
        category_id=data.category_id,
        todo_id=data.todo_id,
        note=data.note,
        is_pomodoro=data.is_pomodoro
    )
    return entry

@router.post("/stop", response_model=TimeEntryResponse)
async def stop_timer(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    entry, _ = await TimeLoggingService.stop_timer(db, user_id=current_user.id)
    if not entry:
        raise HTTPException(status_code=404, detail="No running timer found")
    return entry

@router.get("/running", response_model=Optional[TimeEntryResponse])
async def get_running(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    entry = await TimeLoggingService.get_running_entry(db, user_id=current_user.id)
    return entry

@router.get("/recent", response_model=List[TimeEntryResponse])
async def get_recent(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    entries = await TimeLoggingService.get_recent_entries(db, user_id=current_user.id)
    return entries
