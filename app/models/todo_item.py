from datetime import datetime, timezone
from ..extensions import db

from sqlalchemy import Index

class TodoItem(db.Model):
    __tablename__ = 'todo_items'
    __table_args__ = (
        Index('idx_todo_user_status', 'user_id', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.String(500), nullable=False)
    
    # Status: 'pending', 'in_progress', 'completed'
    status = db.Column(db.String(20), default='pending')
    is_completed = db.Column(db.Boolean, default=False) # Giữ lại để tương thích ngược
    
    # Scheduled Task Fields
    scheduled_time = db.Column(db.DateTime, nullable=True)
    is_notified = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('todo_items', lazy='dynamic', cascade='all, delete-orphan'))
    category = db.relationship('Category', backref='todo_items')

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'status': self.status,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'category_color': self.category.color if self.category else '#94A3B8',
            'is_completed': self.is_completed or self.status == 'completed',
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'created_at': self.created_at.isoformat()
        }
