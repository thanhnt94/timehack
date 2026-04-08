from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from ..extensions import db

class PushSubscription(db.Model):
    __tablename__ = 'push_subscriptions'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    
    endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    p256dh: Mapped[str] = mapped_column(String(255), nullable=False) # Public key của browser
    auth: Mapped[str] = mapped_column(String(255), nullable=False)   # Auth secret của browser

    def to_subscription_info(self):
        """Trả về định dạng mà pywebpush yêu cầu."""
        return {
            "endpoint": self.endpoint,
            "keys": {
                "p256dh": self.p256dh,
                "auth": self.auth
            }
        }
