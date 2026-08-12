from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from ..database import get_db
from ..auth import get_current_user
from ..models import User, Category
from pydantic import BaseModel

router = APIRouter(prefix="/api/categories", tags=["categories"])

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    color_bg: str
    color_text: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.user_id == current_user.id))
    return result.scalars().all()
