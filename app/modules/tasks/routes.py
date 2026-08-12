from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Task, Subtask, Category

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])

# --- Pydantic Schemas ---
class TaskCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "todo"
    eisenhower: Optional[str] = "schedule"
    estimated_minutes: Optional[int] = 30
    due_date: Optional[str] = None

class TaskUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    eisenhower: Optional[str] = None
    estimated_minutes: Optional[int] = None
    spent_seconds: Optional[int] = None
    due_date: Optional[str] = None

class CategoryCreateSchema(BaseModel):
    name: str
    color: Optional[str] = "#8B5CF6"
    icon: Optional[str] = "folder"

# --- Categories Endpoints ---
@router.get("/categories")
async def get_categories(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Category).where(Category.user_id == user_id).order_by(Category.id.asc()))
    categories = res.scalars().all()
    return categories

@router.post("/categories")
async def create_category(payload: CategoryCreateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    cat = Category(user_id=user_id, name=payload.name, color=payload.color, icon=payload.icon)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat

@router.delete("/categories/{cat_id}")
async def delete_category(cat_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Category).where(Category.id == cat_id, Category.user_id == user_id))
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(cat)
    await db.commit()
    return {"status": "ok"}

# --- Tasks Endpoints ---
@router.get("")
async def get_tasks(
    request: Request, 
    status: Optional[str] = None, 
    category_id: Optional[int] = None,
    priority: Optional[str] = None,
    eisenhower: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    user_id = get_current_user_id(request)
    stmt = select(Task).where(Task.user_id == user_id)

    if status:
        stmt = stmt.where(Task.status == status)
    if category_id:
        stmt = stmt.where(Task.category_id == category_id)
    if priority:
        stmt = stmt.where(Task.priority == priority)
    if eisenhower:
        stmt = stmt.where(Task.eisenhower == eisenhower)

    stmt = stmt.order_by(Task.order_index.asc(), Task.id.desc())
    res = await db.execute(stmt)
    tasks = res.scalars().all()

    # Format result with subtasks & category
    result = []
    for t in tasks:
        sub_res = await db.execute(select(Subtask).where(Subtask.task_id == t.id).order_by(Subtask.id.asc()))
        subtasks = sub_res.scalars().all()
        
        cat_info = None
        if t.category_id:
            c_res = await db.execute(select(Category).where(Category.id == t.category_id))
            c_obj = c_res.scalar_one_or_none()
            if c_obj:
                cat_info = {"id": c_obj.id, "name": c_obj.name, "color": c_obj.color, "icon": c_obj.icon}

        result.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category_id": t.category_id,
            "category": cat_info,
            "priority": t.priority,
            "status": t.status,
            "eisenhower": t.eisenhower,
            "estimated_minutes": t.estimated_minutes,
            "spent_seconds": t.spent_seconds,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            "order_index": t.order_index,
            "subtasks": [{"id": st.id, "title": st.title, "is_completed": st.is_completed} for st in subtasks],
            "created_at": t.created_at.isoformat()
        })

    return result

@router.post("")
async def create_task(payload: TaskCreateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    due_dt = None
    if payload.due_date:
        try:
            due_dt = datetime.fromisoformat(payload.due_date.replace("Z", ""))
        except Exception:
            pass

    task = Task(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        priority=payload.priority or "medium",
        status=payload.status or "todo",
        eisenhower=payload.eisenhower or "schedule",
        estimated_minutes=payload.estimated_minutes or 30,
        due_date=due_dt
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return {"status": "ok", "task_id": task.id, "task": {
        "id": task.id,
        "title": task.title,
        "status": task.status,
        "priority": task.priority,
        "eisenhower": task.eisenhower
    }}

@router.patch("/{task_id}")
async def update_task(task_id: int, payload: TaskUpdateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.category_id is not None:
        task.category_id = payload.category_id
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.eisenhower is not None:
        task.eisenhower = payload.eisenhower
    if payload.estimated_minutes is not None:
        task.estimated_minutes = payload.estimated_minutes
    if payload.spent_seconds is not None:
        task.spent_seconds = payload.spent_seconds

    if payload.status is not None:
        old_status = task.status
        task.status = payload.status
        if payload.status == "completed" and old_status != "completed":
            task.completed_at = datetime.utcnow()
        elif payload.status != "completed":
            task.completed_at = None

    if payload.due_date is not None:
        if payload.due_date == "":
            task.due_date = None
        else:
            try:
                task.due_date = datetime.fromisoformat(payload.due_date.replace("Z", ""))
            except Exception:
                pass

    await db.commit()
    await db.refresh(task)
    return {"status": "ok", "task": {
        "id": task.id,
        "title": task.title,
        "status": task.status,
        "spent_seconds": task.spent_seconds,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None
    }}

@router.delete("/{task_id}")
async def delete_task(task_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
    return {"status": "ok"}

# --- Subtask Endpoints ---
@router.post("/{task_id}/subtasks")
async def create_subtask(task_id: int, payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    title = payload.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    subtask = Subtask(task_id=task_id, title=title)
    db.add(subtask)
    await db.commit()
    await db.refresh(subtask)
    return {"id": subtask.id, "title": subtask.title, "is_completed": subtask.is_completed}

@router.patch("/subtasks/{subtask_id}")
async def toggle_subtask(subtask_id: int, payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Subtask).where(Subtask.id == subtask_id))
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subtask not found")

    if "is_completed" in payload:
        sub.is_completed = payload["is_completed"]
    if "title" in payload:
        sub.title = payload["title"]

    await db.commit()
    return {"status": "ok", "subtask": {"id": sub.id, "is_completed": sub.is_completed}}

@router.delete("/subtasks/{subtask_id}")
async def delete_subtask(subtask_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Subtask).where(Subtask.id == subtask_id))
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subtask not found")
    await db.delete(sub)
    await db.commit()
    return {"status": "ok"}
