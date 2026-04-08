from flask import render_template, request, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from functools import wraps
from . import admin_bp
from ...models import User, AppSetting

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Access denied. Admin only.', 'danger')
            return redirect(url_for('time_logging.dashboard'))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/')
@admin_required
def index():
    sso_enabled = AppSetting.get_value('sso_enabled', 'false') == 'true'
    users_count = User.query.count()
    return render_template('admin/dashboard.html', sso_enabled=sso_enabled, users_count=users_count)

@admin_bp.route('/api/settings', methods=['POST'])
@admin_required
def update_settings():
    try:
        data = request.get_json()
        sso_enabled = data.get('sso_enabled')
        
        if sso_enabled is not None:
            # Stored as string 'true' / 'false'
            val_str = 'true' if sso_enabled else 'false'
            AppSetting.set_value('sso_enabled', val_str)
            
        return jsonify({"status": "success", "message": "Settings updated"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
