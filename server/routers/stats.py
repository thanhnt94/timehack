from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..auth import get_current_user
from ..models import User
from ..services import TimeLoggingService
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/stats", tags=["stats"])

class RecentEntry(BaseModel):
    id: int
    category_name: Optional[str]
    start_time: datetime
    duration: Optional[int]
    note: Optional[str]

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_today: int
    total_week: int
    deep_work_today: int
    daily_goal: int
    recent_entries: List[dict] # Simplified for now

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    stats = await TimeLoggingService.get_dashboard_stats(db, user_id=current_user.id)
    
    # Process recent entries for frontend
    processed_recent = []
    for entry in stats["recent_entries"]:
        processed_recent.append({
            "id": entry.id,
            "category_name": entry.category.name if entry.category else "Khác",
            "category_icon": entry.category.icon if entry.category else "✨",
            "category_color": entry.category.color if entry.category else "#64748B",
            "start_time": entry.start_time.isoformat(),
            "duration": entry.duration,
            "note": entry.note
        })
    
    stats["recent_entries"] = processed_recent
    return stats
