import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.modules.auth.routes import router as auth_router
from app.modules.tasks.routes import router as tasks_router
from app.modules.habits.routes import router as habits_router
from app.modules.schedule.routes import router as schedule_router
from app.modules.time_tracking.routes import router as time_tracking_router
from app.modules.analytics.routes import router as analytics_router
from app.modules.notifications.routes import router as notifications_router

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
ASSETS_DIR = STATIC_DIR / "assets"

if not ASSETS_DIR.exists():
    os.makedirs(ASSETS_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(habits_router)
app.include_router(schedule_router)
app.include_router(time_tracking_router)
app.include_router(analytics_router)
app.include_router(notifications_router)

# Mount Static Assets
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# SPA Catch-all Route
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = STATIC_DIR / full_path
    if full_path and file_path.is_file():
        return FileResponse(str(file_path))
    
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    
    return {"message": "TimeHack API is running. Build frontend to view UI."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=5050, reload=True)
