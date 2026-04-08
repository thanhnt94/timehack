from datetime import datetime, timezone
from ..extensions import db

class TodoItem(db.Model):
    __tablename__ = 'todo_items'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.String(500), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('todo_items', lazy='dynamic', cascade='all, delete-orphan'))
    category = db.relationship('Category', backref='todo_items')

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'category_color': self.category.color if self.category else '#94A3B8',
            'is_completed': self.is_completed,
            'created_at': self.created_at.isoformat()
        }
