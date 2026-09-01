import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

from app.core.config import settings
from app.modules.sso_module.routes import router as sso_router
from app.modules.auth.routes import router as auth_router
from app.modules.tasks.routes import router as tasks_router
from app.modules.habits.routes import router as habits_router
from app.modules.schedule.routes import router as schedule_router
from app.modules.time_tracking.routes import router as time_tracking_router
from app.modules.analytics.routes import router as analytics_router
from app.modules.notifications.routes import router as notifications_router
from app.modules.settings.routes import router as settings_router
from app.modules.admin.routes import router as admin_router

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
ASSETS_DIR = STATIC_DIR / "assets"

if not ASSETS_DIR.exists():
    os.makedirs(ASSETS_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Middleware: Verify & Clean HMAC signed user_id cookie
@app.middleware("http")
async def clean_user_id_cookie(request: Request, call_next):
    headers = request.scope.get("headers", [])
    cookie_idx = -1
    cookie_val = None
    for i, (k, v) in enumerate(headers):
        if k == b"cookie":
            cookie_idx = i
            cookie_val = v.decode("utf-8", errors="ignore")
            break
            
    if cookie_idx != -1 and cookie_val:
        from app.modules.sso_module.cookie_signer import verify_cookie
        items = cookie_val.split(";")
        new_items = []
        modified = False
        for item in items:
            parts = item.strip().split("=", 1)
            if len(parts) == 2 and parts[0] == "user_id":
                val = parts[1]
                verified_id = verify_cookie(val, settings.SECRET_KEY)
                if verified_id:
                    new_items.append(f"user_id={verified_id}")
                modified = True
                continue
            new_items.append(item.strip())
            
        if modified:
            new_cookie_str = "; ".join(new_items)
            new_headers = list(headers)
            new_headers[cookie_idx] = (b"cookie", new_cookie_str.encode("utf-8"))
            request.scope["headers"] = new_headers
            if hasattr(request, "_cookies"):
                delattr(request, "_cookies")

    return await call_next(request)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(sso_router)
app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(habits_router)
app.include_router(schedule_router)
app.include_router(time_tracking_router)
app.include_router(analytics_router)
app.include_router(notifications_router)
app.include_router(settings_router)
app.include_router(admin_router)

# Mount Static Assets
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# SPA Explicit & Catch-all Routes
@app.get("/")
@app.get("/login")
@app.get("/tasks")
@app.get("/habits")
@app.get("/calendar")
@app.get("/schedule")
@app.get("/categories")
@app.get("/analytics")
@app.get("/admin")
@app.get("/admin/{path:path}")
@app.get("/{full_path:path}")
async def serve_spa(full_path: str = ""):
    # Ignore API requests that reach here so they return proper 404 JSON
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not Found")
        
    file_path = STATIC_DIR / full_path
    if full_path and file_path.is_file():
        return FileResponse(str(file_path))
    
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        response = FileResponse(str(index_path))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    
    return {"message": "TimeHack API is running. Build client to view UI."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=5050, reload=True)
