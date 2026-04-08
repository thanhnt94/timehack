import os
from dotenv import load_dotenv

load_dotenv()
basedir = os.path.abspath(os.path.dirname(__file__))
project_root = os.path.abspath(os.path.join(basedir, '..'))


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-fallback-key')

    # Handle relative paths for SQLite
    _raw_db_url = os.environ.get('DATABASE_URL')
    if _raw_db_url and _raw_db_url.startswith('sqlite:///') and not _raw_db_url.startswith('sqlite:////') and ':' not in _raw_db_url[10:]:
        _path = _raw_db_url.replace('sqlite:///', '')
        _absolute_path = os.path.abspath(os.path.join(project_root, _path))
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{_absolute_path}"
    else:
        SQLALCHEMY_DATABASE_URI = _raw_db_url or \
            f"sqlite:///{os.path.abspath(os.path.join(project_root, '../Storage/database/TimeHack.db'))}"

    # Web Push VAPID Settings
    VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY')
    VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY')
    VAPID_CLAIM_EMAIL = os.environ.get('VAPID_CLAIM_EMAIL', 'mailto:admin@timehack.local')

    # Ecosystem SSO Settings
    CENTRAL_AUTH_SERVER_ADDRESS = os.environ.get('CENTRAL_AUTH_SERVER_ADDRESS', 'http://localhost:5000')
    CENTRAL_AUTH_CLIENT_ID = os.environ.get('CENTRAL_AUTH_CLIENT_ID', 'timehack-v1')
    CENTRAL_AUTH_CLIENT_SECRET = os.environ.get('CENTRAL_AUTH_CLIENT_SECRET')


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}
