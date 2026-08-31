from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.modules.tasks.models import Task, Subtask, Category

class TaskInterface:
    @staticmethod
    async def get_user_tasks_count(db: AsyncSession, user_id: int) -> Dict[str, int]:
        total_res = await db.execute(select(func.count(Task.id)).where(Task.user_id == user_id))
        completed_res = await db.execute(select(func.count(Task.id)).where(Task.user_id == user_id, Task.status == "completed"))
        pending_res = await db.execute(select(func.count(Task.id)).where(Task.user_id == user_id, Task.status != "completed"))
        
        return {
            "total": total_res.scalar() or 0,
            "completed": completed_res.scalar() or 0,
            "pending": pending_res.scalar() or 0
        }

    @staticmethod
    async def check_task_ownership(db: AsyncSession, task_id: int, user_id: int) -> bool:
        res = await db.execute(select(Task.id).where(Task.id == task_id, Task.user_id == user_id))
        return res.scalar_one_or_none() is not None
