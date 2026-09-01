from sqlalchemy import Column, String, Boolean, Integer
from app.core.database import Base

class SSOConfig(Base):
    """
    This model manages SSO settings and Local Telegram Bot settings locally via its own Admin Panel.
    """
    __tablename__ = "sso_settings"

    id = Column(Integer, primary_key=True, index=True)
    is_enabled = Column(Boolean, default=False)
    server_url = Column(String(255), nullable=True)
    client_id = Column(String(100), nullable=True)
    client_secret = Column(String(255), nullable=True)
    redirect_uri = Column(String(255), nullable=True)

    # Local Telegram Bot Settings (used when CentralAuth SSO is disabled)
    telegram_bot_token = Column(String(255), nullable=True)
    telegram_bot_username = Column(String(100), nullable=True)
    telegram_bot_enabled = Column(Boolean, default=False)

    def to_dict(self):
        return {
            "is_enabled": self.is_enabled,
            "server_url": self.server_url,
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "telegram_bot_token": self.telegram_bot_token,
            "telegram_bot_username": self.telegram_bot_username,
            "telegram_bot_enabled": self.telegram_bot_enabled
        }
