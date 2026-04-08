from ..extensions import db

# Bảng trung gian liên kết Tag và Category
category_tags = db.Table('category_tags',
    db.Column('category_id', db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

# Bảng trung gian liên kết Tag và TimeEntry
entry_tags = db.Table('entry_tags',
    db.Column('time_entry_id', db.Integer, db.ForeignKey('time_entries.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(50), nullable=False)
    
    # Relationships
    categories = db.relationship('Category', secondary=category_tags, backref=db.backref('tags', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

    def __repr__(self) -> str:
        return f'<Tag {self.name}>'
