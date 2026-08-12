import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "TimeHack - All-In-One Productivity Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "timehack_secret_key_ecosystem_2026")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./timehack_async.db"
    )
    CENTRAL_AUTH_URL: str = os.getenv("CENTRAL_AUTH_URL", "https://centralauth.inmind.site")
    TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN", None)

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
