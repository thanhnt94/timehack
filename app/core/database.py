from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("sqlite://") and not db_url.startswith("sqlite+aiosqlite://"):
    db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args,
)

# SQLite optimization: WAL Mode
if "sqlite" in db_url:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=-64000") # 64MB cache
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.execute("PRAGMA busy_timeout=5000") # 5s busy timeout
            cursor.close()
        except Exception:
            pass

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

SessionLocal = AsyncSessionLocal

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
