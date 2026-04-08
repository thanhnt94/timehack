"""TimeHack — Flask Application Factory."""

import os
import time
from flask import Flask, jsonify, request, redirect, url_for
from dotenv import load_dotenv

from .config import config_by_name
from .extensions import db, migrate, login_manager, csrf


def create_app(config_name: str | None = None) -> Flask:
    """Create and configure the Flask application."""
    load_dotenv()

    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # ── Initialise extensions ──────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)
    login_manager.init_app(app)

    # ── Register Jinja globals ─────────────────────────────────
    from .utils.time_helpers import format_duration, format_duration_short, to_user_tz
    app.jinja_env.globals['format_duration'] = format_duration
    app.jinja_env.globals['format_duration_short'] = format_duration_short

    @app.template_filter('localtime')
    def localtime_filter(dt_val):
        """Convert UTC datetime to current user's timezone."""
        from flask_login import current_user
        tz_name = 'Asia/Ho_Chi_Minh'
        if current_user and hasattr(current_user, 'timezone') and current_user.timezone:
            tz_name = current_user.timezone
        return to_user_tz(dt_val, tz_name)

    # ── Register blueprints ────────────────────────────────────
    from .modules.auth import auth_bp
    from .modules.time_logging import time_logging_bp
    from .modules.analytics import analytics_bp
    from .modules.settings import settings_bp
    from .modules.admin import admin_bp
    from .modules.todo import todo_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(time_logging_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(todo_bp)

    # ── Root redirect ──────────────────────────────────────────
    @app.route('/')
    def index():
        return redirect(url_for('time_logging.dashboard'))

    # ── Health check ───────────────────────────────────────────
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'app': 'TimeHack', 'version': '1.0.0'}), 200

    # ── User loader ────────────────────────────────────────────
    from .models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # ══════════════════════════════════════════════════════════
    # ══ Ecosystem SSO Internal APIs ══════════════════════════
    # ══════════════════════════════════════════════════════════

    def _check_sync_secret():
        """Validate the X-Client-Secret header for internal APIs."""
        secret_header = request.headers.get('X-Client-Secret')
        configured_secret = app.config.get('CENTRAL_AUTH_CLIENT_SECRET')
        if not secret_header or secret_header != configured_secret:
            return False
        return True

    @app.route('/api/sso-internal/user-list', methods=['POST'])
    def internal_user_list():
        """Return list of all users for CentralAuth sync scanning."""
        if not _check_sync_secret():
            return jsonify({"error": "Unauthorized"}), 401

        users = User.query.all()
        user_list = [{
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name or u.username,
            "central_auth_id": u.central_auth_id,
        } for u in users]

        return jsonify({"users": user_list}), 200

    @app.route('/api/sso-internal/link-user', methods=['POST'])
    def internal_link_user():
        """Update a user's central_auth_id. Supports Admin Push-Back."""
        if not _check_sync_secret():
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        email = data.get('email')
        ca_id = data.get('central_auth_id')
        username = data.get('username')
        full_name = data.get('full_name')
        is_admin_sync = data.get('is_admin_sync', False)

        if not ca_id:
            return jsonify({"error": "Missing central_auth_id"}), 400

        target_user = None

        # 1. Admin Push-back logic
        if is_admin_sync:
            target_user = User.query.get(1)
            if target_user:
                # Collision Handling: email
                if email:
                    other = User.query.filter(User.email == email, User.id != 1).first()
                    if other:
                        app.logger.warning(f"Sync Conflict: Email {email} -> User {other.id}. Renaming.")
                        other.email = f"{email}_old_{int(time.time())}"

                # Collision Handling: username
                if username:
                    other = User.query.filter(User.username == username, User.id != 1).first()
                    if other:
                        app.logger.warning(f"Sync Conflict: Username {username} -> User {other.id}. Renaming.")
                        other.username = f"{username}_old_{int(time.time())}"

                # Collision Handling: central_auth_id
                if ca_id:
                    other = User.query.filter(User.central_auth_id == ca_id, User.id != 1).first()
                    if other:
                        app.logger.warning(f"Sync Conflict: CA ID {ca_id} -> User {other.id}. Detaching.")
                        other.central_auth_id = None

                # Perform Push-back
                target_user.username = username or target_user.username
                target_user.email = email or target_user.email
                if full_name:
                    target_user.full_name = full_name
                target_user.central_auth_id = ca_id
                db.session.commit()
                return jsonify({"status": "success",
                                "message": f"Admin identity pushed to local ID 1 ({target_user.username})"}), 200

        # 2. Standard linking logic
        if not target_user:
            target_user = User.query.filter_by(email=email).first()

        if not target_user and not is_admin_sync:
            target_user = User.query.filter_by(username=username).first()

        if target_user:
            target_user.central_auth_id = ca_id
            if username:
                target_user.username = username
            if full_name:
                target_user.full_name = full_name
            db.session.commit()
            return jsonify({"status": "success",
                            "message": f"User {target_user.username} linked to CA ID {ca_id}"}), 200

        return jsonify({"error": "User not found for linking"}), 404

    @app.route('/api/sso-internal/delete-user', methods=['POST'])
    def internal_delete_user():
        """Delete a user from this app's database."""
        if not _check_sync_secret():
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        email = data.get('email')
        username = data.get('username')

        user = None
        if email and email != "null":
            user = User.query.filter_by(email=email).first()
        if not user and username and username != "null":
            user = User.query.filter_by(username=username).first()

        if not user:
            return jsonify({"error": f"User {username or email} not found"}), 404

        db.session.delete(user)
        db.session.commit()
        return jsonify({"status": "ok", "message": f"Deleted {user.username}"}), 200

    # Exempt SSO endpoints from CSRF
    csrf.exempt(internal_user_list)
    csrf.exempt(internal_link_user)
    csrf.exempt(internal_delete_user)

    return app
