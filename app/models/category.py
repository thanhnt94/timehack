from datetime import datetime, timezone

from ..extensions import db


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=True, index=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), default='#6366F1')
    icon = db.Column(db.String(30), default='clock')
    is_default = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', back_populates='categories')
    time_entries = db.relationship('TimeEntry', back_populates='category', lazy='dynamic')
    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]), cascade='all, delete-orphan')

    def get_full_path(self) -> str:
        """Returns full hierarchical path (e.g. Học tập / Tiếng Nhật / Từ vựng)"""
        if self.parent:
            return f"{self.parent.get_full_path()} / {self.name}"
        return self.name

    def get_root(self):
        """Returns the top-level root category"""
        if self.parent:
            return self.parent.get_root()
        return self

    def get_indent_level(self) -> int:
        """Returns the nesting depth (0 for root)"""
        if self.parent:
            return self.parent.get_indent_level() + 1
        return 0

    def __repr__(self) -> str:
        return f'<Category {self.get_full_path()}>'

    @staticmethod
    def seed_defaults(user_id):
        """Create default root categories for a new user."""
        defaults = [
            {'name': 'Công việc', 'color': '#3B82F6', 'icon': '💼', 'sort_order': 0},
            {'name': 'Họp / Meeting', 'color': '#F59E0B', 'icon': '🤝', 'sort_order': 1},
            {'name': 'Học tập', 'color': '#10B981', 'icon': '📚', 'sort_order': 2},
            {'name': 'Thể dục', 'color': '#EF4444', 'icon': '💪', 'sort_order': 3},
            {'name': 'Giải trí', 'color': '#8B5CF6', 'icon': '🎮', 'sort_order': 4},
            {'name': 'Việc nhà', 'color': '#64748B', 'icon': '🏠', 'sort_order': 5},
        ]
        for d in defaults:
            cat = Category(user_id=user_id, is_default=True, **d)
            db.session.add(cat)
        db.session.commit()
