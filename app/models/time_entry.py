from datetime import datetime, timezone

from ..extensions import db


class TimeEntry(db.Model):
    __tablename__ = 'time_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)        # NULL = đang tracking
    duration = db.Column(db.Integer, nullable=True)           # Minutes, calculated on stop
    note = db.Column(db.Text, nullable=True)
    is_pomodoro = db.Column(db.Boolean, default=False)        # Flag: Deep Work / Focused session
    is_running = db.Column(db.Boolean, default=False)         # Flag: timer đang chạy
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.Index('ix_time_entries_user_date', 'user_id', 'start_time'),
        db.Index('ix_time_entries_user_category', 'user_id', 'category_id'),
    )

    # Relationships
    user = db.relationship('User', back_populates='time_entries')
    category = db.relationship('Category', back_populates='time_entries')

    def stop(self):
        """Stop the running timer and calculate duration."""
        if self.is_running and not self.end_time:
            self.end_time = datetime.now(timezone.utc)
            self.is_running = False
            # Normalize: SQLite strips tzinfo, so ensure both are aware or both naive
            end = self.end_time.replace(tzinfo=None) if self.end_time.tzinfo else self.end_time
            start = self.start_time.replace(tzinfo=None) if self.start_time.tzinfo else self.start_time
            delta = end - start
            self.duration = max(1, int(delta.total_seconds() / 60))

    def to_dict(self):
        """Serialize for JSON API responses."""
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'category_color': self.category.color if self.category else '#94A3B8',
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'note': self.note,
            'is_pomodoro': self.is_pomodoro,
            'is_running': self.is_running,
        }

    def __repr__(self) -> str:
        return f'<TimeEntry {self.id} user={self.user_id} dur={self.duration}min>'


class PomodoroSettings(db.Model):
    __tablename__ = 'pomodoro_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'),
                        nullable=False, unique=True, index=True)
    work_duration = db.Column(db.Integer, default=25)
    short_break = db.Column(db.Integer, default=5)
    long_break = db.Column(db.Integer, default=15)
    sessions_before_long_break = db.Column(db.Integer, default=4)
    auto_start_breaks = db.Column(db.Boolean, default=True)
    auto_start_pomodoros = db.Column(db.Boolean, default=False)
    sound_enabled = db.Column(db.Boolean, default=True)

    user = db.relationship('User', backref=db.backref('pomodoro_settings', uselist=False,
                                                       cascade='all, delete-orphan'))

    @staticmethod
    def get_or_create(user_id):
        """Get existing settings or create defaults."""
        settings = PomodoroSettings.query.filter_by(user_id=user_id).first()
        if not settings:
            settings = PomodoroSettings(user_id=user_id)
            db.session.add(settings)
            db.session.commit()
        return settings


class DailyGoal(db.Model):
    __tablename__ = 'daily_goals'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    target_minutes = db.Column(db.Integer, nullable=False, default=480)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('daily_goals', lazy='dynamic',
                                                       cascade='all, delete-orphan'))
    category = db.relationship('Category', backref='goals')
