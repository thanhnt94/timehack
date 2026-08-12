from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import engine, Base
from .routers import auth, timer, stats, categories
from .utils import seed_db
from .database import async_session
from contextlib import asynccontextmanager
import os
from pathlib import Path

# Fix path for global ecosystem run
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
ASSETS_DIR = STATIC_DIR / "assets"

# Ensure assets directory exists for mounting (prevents RuntimeError)
if not ASSETS_DIR.exists():
    os.makedirs(ASSETS_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (In production use Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default data
    async with async_session() as session:
        await seed_db(session)
    yield
    # Cleanup on shutdown

app = FastAPI(title="TimeHack API", lifespan=lifespan)

# Configure CORS for React frontend (Development only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(timer.router)
app.include_router(stats.router)
app.include_router(categories.router)

# --- Serving the React SPA ---

# 1. Mount Static Assets (js, css, images)
# We mount specific /assets for high performance, plus a catch-all for root level files
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# 2. Main Entry Point for SPA & Root Static Files
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Check if the requested path is a file in the static directory (like favicon.svg)
    file_path = STATIC_DIR / full_path
    if full_path and file_path.is_file():
        return FileResponse(str(file_path))
    
    # Otherwise, for any path (including /), serve the SPA entry point
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    
    return {"message": "Server started. Please build frontend (npm run build) to see the UI."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="0.0.0.0", port=5050, reload=True)
