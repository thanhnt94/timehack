from ..extensions import db

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=True)
    
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50), default='📌')
    
    # Màu sắc phục vụ Chart/UI cũ (Hex)
    color = db.Column(db.String(20), default='#94A3B8')
    
    # Màu sắc phục vụ UI mới (Tailwind Classes)
    color_bg = db.Column(db.String(50), default='bg-slate-50')
    color_text = db.Column(db.String(50), default='text-slate-600')
    
    # Gamification Fields
    current_exp = db.Column(db.Integer, default=0) # 1 phút = 1 EXP
    current_level = db.Column(db.Integer, default=1)
    
    is_default = db.Column(db.Boolean, default=False)

    # Relationships
    user = db.relationship('User', back_populates='categories')
    time_entries = db.relationship('TimeEntry', back_populates='category', lazy='dynamic')
    
    # Phân tầng: Một danh mục có thể có nhiều danh mục con
    subcategories = db.relationship('Category', 
                                    backref=db.backref('parent', remote_side=[id]), 
                                    cascade='all, delete-orphan')

    def get_full_path(self):
        """Trả về đường dẫn đầy đủ: Cha > Con > Cháu."""
        if self.parent:
            return f"{self.parent.get_full_path()} > {self.name}"
        return self.name

    def get_root(self):
        """Trả về danh mục gốc cao nhất (Level 1)."""
        if self.parent:
            return self.parent.get_root()
        return self

    def get_indent_level(self):
        """Tính độ sâu để phục vụ hiển thị thụt đầu dòng trên UI."""
        level = 0
        p = self.parent
        while p:
            level += 1
            p = p.parent
        return level

    def __repr__(self) -> str:
        return f'<Category {self.name} (ID: {self.id})>'
