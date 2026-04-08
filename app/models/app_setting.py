from ..extensions import db

class AppSetting(db.Model):
    __tablename__ = 'app_settings'

    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.Text, nullable=True)

    @classmethod
    def get_value(cls, key: str, default=None):
        setting = db.session.get(cls, key)
        if setting is not None:
            return setting.value
        return default

    @classmethod
    def set_value(cls, key: str, value: str):
        setting = db.session.get(cls, key)
        if not setting:
            setting = cls(key=key)
            db.session.add(setting)
        setting.value = value
        db.session.commit()
