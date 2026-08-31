import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "TimeHack - All-In-One Productivity Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Base Directories
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    STORAGE_DIR: str = os.path.abspath(os.path.join(BASE_DIR, "..", "Storage", "database"))
    TIMEHACK_STORAGE_DIR: str = os.path.abspath(os.path.join(BASE_DIR, "..", "Storage", "TimeHack"))

    @property
    def DATABASE_URL(self) -> str:
        custom_url = os.getenv("DATABASE_URL")
        if custom_url:
            return custom_url
        os.makedirs(self.STORAGE_DIR, exist_ok=True)
        db_path = os.path.join(self.STORAGE_DIR, "TimeHack.db")
        return f"sqlite+aiosqlite:///{db_path}"

    # SSO / CentralAuth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "timehack_secret_key_ecosystem_2026")
    CENTRAL_AUTH_URL: str = os.getenv("CENTRAL_AUTH_URL", "https://centralauth.inmind.site")
    CLIENT_ID: str = os.getenv("CLIENT_ID", "timehack-v1")
    CLIENT_SECRET: str = os.getenv("CLIENT_SECRET", "timehack_secret_123")
    APP_BASE_URL: str = os.getenv("APP_BASE_URL", "") # e.g. https://time.inmind.site
    
    # Telegram Notifications
    TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN", None)
    QUEUE_API_SECRET: str = os.getenv("QUEUE_API_SECRET", "super-secret-token-123")

    class Config:
        case_sensitive = True
        extra = "ignore"
        env_file = ".env"

settings = Settings()

if settings.SECRET_KEY == "timehack_secret_key_ecosystem_2026":
    import logging
    logging.getLogger("uvicorn.error").warning(
        "⚠️ SECURITY WARNING: SECRET_KEY is set to default placeholder. "
        "Please set SECRET_KEY in environment variables for production!"
    )
