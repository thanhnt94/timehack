from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.timezone_utils import parse_to_utc, utc_now
from app.models import Task, Subtask, Category, User, TimeLog

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])

# --- Preset Hierarchical Categories (English) ---
PRESET_CATEGORIES = [
    {
        "name": "Work & Career",
        "icon": "briefcase",
        "color": "#8B5CF6",
        "category_type": "productive",
        "is_default": True,
        "subcategories": [
            {"name": "Coding & Development", "icon": "code", "color": "#7C3AED", "category_type": "productive"},
            {"name": "Email & Comms", "icon": "mail", "color": "#6D28D9", "category_type": "productive"},
            {"name": "Meetings & Calls", "icon": "users", "color": "#5B21B6", "category_type": "productive"},
            {"name": "Planning & Strategy", "icon": "target", "color": "#4C1D95", "category_type": "productive"}
        ]
    },
    {
        "name": "Study & Growth",
        "icon": "book-open",
        "color": "#3B82F6",
        "category_type": "productive",
        "is_default": True,
        "subcategories": [
            {"name": "English & Languages", "icon": "languages", "color": "#2563EB", "category_type": "productive"},
            {"name": "Reading & Research", "icon": "book", "color": "#1D4ED8", "category_type": "productive"},
            {"name": "Online Courses & Skills", "icon": "graduation-cap", "color": "#1E40AF", "category_type": "productive"}
        ]
    },
    {
        "name": "Health & Fitness",
        "icon": "activity",
        "color": "#10B981",
        "category_type": "productive",
        "is_default": True,
        "subcategories": [
            {"name": "Workout & Gym", "icon": "dumbbell", "color": "#059669", "category_type": "productive"},
            {"name": "Meditation & Mindfulness", "icon": "heart", "color": "#047857", "category_type": "productive"},
            {"name": "Walking & Outdoors", "icon": "sun", "color": "#065F46", "category_type": "productive"}
        ]
    },
    {
        "name": "Finance & Wealth",
        "icon": "wallet",
        "color": "#F59E0B",
        "category_type": "productive",
        "is_default": True,
        "subcategories": [
            {"name": "Budget & Expense Tracking", "icon": "pie-chart", "color": "#D97706", "category_type": "productive"},
            {"name": "Investing & Market Analysis", "icon": "trending-up", "color": "#B45309", "category_type": "productive"}
        ]
    },
    {
        "name": "Leisure & Rest",
        "icon": "coffee",
        "color": "#06B6D4",
        "category_type": "neutral",
        "is_default": True,
        "subcategories": [
            {"name": "Movies & Gaming", "icon": "tv", "color": "#0891B2", "category_type": "neutral"},
            {"name": "Socializing & Friends", "icon": "smile", "color": "#0E7490", "category_type": "neutral"}
        ]
    },
    {
        "name": "Distraction & Waste",
        "icon": "alert-triangle",
        "color": "#EF4444",
        "category_type": "wasted",
        "is_default": True,
        "subcategories": [
            {"name": "Doomscrolling Social Media", "icon": "smartphone", "color": "#DC2626", "category_type": "wasted"},
            {"name": "Procrastination & Idling", "icon": "clock", "color": "#B91C1C", "category_type": "wasted"}
        ]
    }
]

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
    reminder_enabled: Optional[bool] = False
    remind_at: Optional[str] = None
    remind_before_mins: Optional[int] = 30

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
    reminder_enabled: Optional[bool] = None
    remind_at: Optional[str] = None
    remind_before_mins: Optional[int] = None

class CategoryCreateSchema(BaseModel):
    name: str
    color: Optional[str] = "#8B5CF6"
    icon: Optional[str] = "folder"
    parent_id: Optional[int] = None
    category_type: Optional[str] = "productive"

class CategoryUpdateSchema(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None
    category_type: Optional[str] = None

# --- Categories Endpoints ---
@router.get("/categories")
async def get_categories(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    # 1. Fetch all user categories with subcategories relationship
    res = await db.execute(
        select(Category)
        .options(selectinload(Category.subcategories))
        .where(Category.user_id == user_id)
        .order_by(Category.parent_id.nulls_first(), Category.id.asc())
    )
    categories = res.scalars().all()

    # 2. If user has no categories, auto-seed preset categories
    if not categories and user_id:
        await seed_user_presets(user_id, db)
        res = await db.execute(
            select(Category)
            .options(selectinload(Category.subcategories))
            .where(Category.user_id == user_id)
            .order_by(Category.parent_id.nulls_first(), Category.id.asc())
        )
        categories = res.scalars().all()

    # 3. Batch task count & time spent per category
    t_stmt = select(Task.category_id, func.count(Task.id)).where(Task.user_id == user_id).group_by(Task.category_id)
    t_res = await db.execute(t_stmt)
    task_counts = dict(t_res.all())

    time_stmt = select(TimeLog.category_id, func.sum(TimeLog.duration_seconds)).where(TimeLog.user_id == user_id).group_by(TimeLog.category_id)
    time_res = await db.execute(time_stmt)
    time_counts = dict(time_res.all())

    # Build category list with metrics
    result = []
    cat_map = {c.id: c for c in categories}

    for c in categories:
        sub_list = []
        if c.subcategories:
            for sc in c.subcategories:
                sub_list.append({
                    "id": sc.id,
                    "parent_id": sc.parent_id,
                    "name": sc.name,
                    "color": sc.color,
                    "icon": sc.icon,
                    "category_type": sc.category_type or "productive",
                    "is_default": bool(sc.is_default),
                    "tasks_count": task_counts.get(sc.id, 0),
                    "focus_minutes": round((time_counts.get(sc.id, 0) or 0) / 60.0, 1),
                    "created_at": sc.created_at.isoformat() if sc.created_at else None
                })

        parent_info = None
        if c.parent_id and c.parent_id in cat_map:
            p_obj = cat_map[c.parent_id]
            parent_info = {"id": p_obj.id, "name": p_obj.name, "color": p_obj.color, "icon": p_obj.icon}

        result.append({
            "id": c.id,
            "parent_id": c.parent_id,
            "parent": parent_info,
            "name": c.name,
            "color": c.color,
            "icon": c.icon,
            "category_type": c.category_type or "productive",
            "is_default": bool(c.is_default),
            "tasks_count": task_counts.get(c.id, 0),
            "focus_minutes": round((time_counts.get(c.id, 0) or 0) / 60.0, 1),
            "subcategories": sub_list,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })

    return result

@router.post("/categories")
async def create_category(payload: CategoryCreateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    # Validate parent if specified
    if payload.parent_id:
        p_res = await db.execute(select(Category).where(Category.id == payload.parent_id, Category.user_id == user_id))
        p_cat = p_res.scalar_one_or_none()
        if not p_cat:
            raise HTTPException(status_code=400, detail="Danh mục cha không tồn tại")

    cat = Category(
        user_id=user_id,
        parent_id=payload.parent_id,
        name=payload.name.strip(),
        color=payload.color or "#8B5CF6",
        icon=payload.icon or "folder",
        category_type=payload.category_type or "productive",
        is_default=False
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat

@router.patch("/categories/{cat_id}")
async def update_category(cat_id: int, payload: CategoryUpdateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    res = await db.execute(select(Category).where(Category.id == cat_id, Category.user_id == user_id))
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    if payload.name is not None:
        cat.name = payload.name.strip()
    if payload.color is not None:
        cat.color = payload.color
    if payload.icon is not None:
        cat.icon = payload.icon
    if "parent_id" in payload.__fields_set__:
        if payload.parent_id == cat_id:
            raise HTTPException(status_code=400, detail="Danh mục không thể làm cha của chính nó")
        cat.parent_id = payload.parent_id
    if payload.category_type is not None:
        cat.category_type = payload.category_type

    await db.commit()
    await db.refresh(cat)
    return {"status": "ok", "category": {"id": cat.id, "name": cat.name, "color": cat.color, "icon": cat.icon, "parent_id": cat.parent_id, "category_type": cat.category_type}}

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

@router.post("/categories/seed-presets")
async def seed_presets_endpoint(request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    await seed_user_presets(user_id, db)
    return {"status": "ok", "message": "Nạp danh mục mẫu thành công!"}

async def seed_user_presets(user_id: int, db: AsyncSession):
    """Helper to populate hierarchical preset categories for user."""
    for parent_data in PRESET_CATEGORIES:
        parent_cat = Category(
            user_id=user_id,
            name=parent_data["name"],
            icon=parent_data["icon"],
            color=parent_data["color"],
            category_type=parent_data.get("category_type", "productive"),
            is_default=True
        )
        db.add(parent_cat)
        await db.flush() # get parent_cat.id

        for sub_data in parent_data.get("subcategories", []):
            sub_cat = Category(
                user_id=user_id,
                parent_id=parent_cat.id,
                name=sub_data["name"],
                icon=sub_data["icon"],
                color=sub_data["color"],
                category_type=sub_data.get("category_type", parent_cat.category_type),
                is_default=True
            )
            db.add(sub_cat)

    await db.commit()

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
    stmt = (
        select(Task)
        .options(
            selectinload(Task.subtasks),
            selectinload(Task.category)
        )
        .where(Task.user_id == user_id)
    )

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

    # Format result with eager-loaded subtasks & category (Zero extra SQL roundtrips)
    result = []
    for t in tasks:
        cat_info = None
        if t.category:
            cat_info = {
                "id": t.category.id,
                "name": t.category.name,
                "color": t.category.color,
                "icon": t.category.icon
            }

        subtasks = sorted(t.subtasks, key=lambda st: st.id) if t.subtasks else []

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
            "reminder_enabled": t.reminder_enabled or False,
            "remind_at": t.remind_at.isoformat() if t.remind_at else None,
            "remind_before_mins": t.remind_before_mins if t.remind_before_mins is not None else 30,
            "subtasks": [{"id": st.id, "title": st.title, "is_completed": st.is_completed} for st in subtasks],
            "created_at": t.created_at.isoformat() if t.created_at else ""
        })

    return result

@router.post("")
async def create_task(payload: TaskCreateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"
    
    due_dt = parse_to_utc(payload.due_date, user_tz) if payload.due_date else None
    remind_dt = parse_to_utc(payload.remind_at, user_tz) if payload.remind_at else None

    task = Task(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        priority=payload.priority or "medium",
        status=payload.status or "todo",
        eisenhower=payload.eisenhower or "schedule",
        estimated_minutes=payload.estimated_minutes or 30,
        due_date=due_dt,
        reminder_enabled=payload.reminder_enabled or False,
        remind_at=remind_dt,
        remind_before_mins=payload.remind_before_mins if payload.remind_before_mins is not None else 30
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return {"status": "ok", "task_id": task.id, "task": {
        "id": task.id,
        "title": task.title,
        "status": task.status,
        "priority": task.priority,
        "eisenhower": task.eisenhower,
        "reminder_enabled": task.reminder_enabled,
        "remind_at": task.remind_at.isoformat() if task.remind_at else None,
        "remind_before_mins": task.remind_before_mins
    }}

@router.patch("/{task_id}")
async def update_task(task_id: int, payload: TaskUpdateSchema, request: Request, db: AsyncSession = Depends(get_db)):
    user_id = get_current_user_id(request)
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    user_tz = user.timezone if user else "Asia/Ho_Chi_Minh"

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
    if payload.reminder_enabled is not None:
        task.reminder_enabled = payload.reminder_enabled
    if payload.remind_before_mins is not None:
        task.remind_before_mins = payload.remind_before_mins

    if payload.remind_at is not None:
        if payload.remind_at == "":
            task.remind_at = None
        else:
            task.remind_at = parse_to_utc(payload.remind_at, user_tz)

    if payload.status is not None:
        old_status = task.status
        task.status = payload.status
        if payload.status == "completed" and old_status != "completed":
            task.completed_at = utc_now()
        elif payload.status != "completed":
            task.completed_at = None

    if payload.due_date is not None:
        if payload.due_date == "":
            task.due_date = None
        else:
            task.due_date = parse_to_utc(payload.due_date, user_tz)

    await db.commit()
    await db.refresh(task)
    return {"status": "ok", "task": {
        "id": task.id,
        "title": task.title,
        "status": task.status,
        "spent_seconds": task.spent_seconds,
        "reminder_enabled": task.reminder_enabled,
        "remind_at": task.remind_at.isoformat() if task.remind_at else None,
        "remind_before_mins": task.remind_before_mins,
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
