from datetime import datetime, timezone
from ..extensions import db
from .todo_item import TodoItem

class TimeEntry(db.Model):
    __tablename__ = 'time_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True)
    todo_id = db.Column(db.Integer, db.ForeignKey('todo_items.id', ondelete='SET NULL'), nullable=True)
    
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Integer, nullable=True)
    note = db.Column(db.Text, nullable=True)
    is_pomodoro = db.Column(db.Boolean, default=False)
    is_running = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', back_populates='time_entries')
    category = db.relationship('Category', back_populates='time_entries')
    todo = db.relationship('TodoItem', backref=db.backref('time_entries', lazy=True))
    
    # Gắn Tag cho bản ghi
    from .tag import entry_tags
    tags = db.relationship('Tag', secondary=entry_tags, backref=db.backref('time_entries', lazy='dynamic'))

    def stop(self):
        if self.is_running and not self.end_time:
            self.end_time = datetime.now(timezone.utc)
            self.is_running = False
            start = self.start_time.replace(tzinfo=None) if self.start_time.tzinfo else self.start_time
            end = self.end_time.replace(tzinfo=None) if self.end_time.tzinfo else self.end_time
            delta = end - start
            self.duration = max(1, int(delta.total_seconds() / 60))

    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'category_color': self.category.color if self.category else '#94A3B8',
            'todo_id': self.todo_id,
            'todo_content': self.todo.content if self.todo else None,
            'is_pomodoro': self.is_pomodoro,
            'note': self.note,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'is_running': self.is_running,
            'duration': self.duration,
            'tags': [t.name for t in self.tags]
        }

class PomodoroSettings(db.Model):
    __tablename__ = 'pomodoro_settings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    work_duration = db.Column(db.Integer, default=25)
    short_break = db.Column(db.Integer, default=5)
    long_break = db.Column(db.Integer, default=15)
    sessions_before_long_break = db.Column(db.Integer, default=4)
    auto_start_breaks = db.Column(db.Boolean, default=True)
    auto_start_pomodoros = db.Column(db.Boolean, default=False)
    sound_enabled = db.Column(db.Boolean, default=True)

    user = db.relationship('User', backref=db.backref('pomodoro_settings', uselist=False, cascade='all, delete-orphan'))

    @staticmethod
    def get_or_create(user_id):
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

    user = db.relationship('User', backref=db.backref('daily_goals', lazy='dynamic', cascade='all, delete-orphan'))
    category = db.relationship('Category', backref='goals')
