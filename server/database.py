import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Fix path for global ecosystem run
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "timehack_async.db"

# Use SQLite for development, async-compatible
ASYNC_DATABASE_URL = os.environ.get("ASYNC_DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")

engine = create_async_engine(ASYNC_DATABASE_URL, echo=True)

async_session = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        yield session
