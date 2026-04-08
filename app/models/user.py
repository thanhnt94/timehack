from datetime import datetime, timezone as dt_timezone
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from ..extensions import db


class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(100))
    avatar_url = db.Column(db.String(255))
    is_admin = db.Column(db.Boolean, default=False)
    central_auth_id = db.Column(db.String(36), unique=True, index=True, nullable=True)
    timezone = db.Column(db.String(50), default='Asia/Ho_Chi_Minh')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(dt_timezone.utc))

    # Relationships
    categories = db.relationship('Category', back_populates='user', lazy='dynamic',
                                 cascade='all, delete-orphan')
    time_entries = db.relationship('TimeEntry', back_populates='user', lazy='dynamic',
                                   cascade='all, delete-orphan')

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def __repr__(self) -> str:
        return f'<User {self.username}>'
