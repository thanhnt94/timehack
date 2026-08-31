from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from app.modules.time_tracking.models import TimeLog

class TimeTrackingInterface:
    @staticmethod
    async def get_user_focus_time(db: AsyncSession, user_id: int, start_time: datetime, end_time: datetime) -> int:
        res = await db.execute(
            select(func.sum(TimeLog.duration_seconds)).where(
                TimeLog.user_id == user_id,
                TimeLog.start_time >= start_time,
                TimeLog.start_time <= end_time
            )
        )
        return int(res.scalar() or 0)
