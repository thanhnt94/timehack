from flask import render_template, request, jsonify, abort
from flask_login import login_required, current_user
from functools import wraps
from . import admin_bp
from app.models.user import User
from app.utils.push_helpers import send_web_push
from app.extensions import db

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            return jsonify({'status': 'error', 'message': 'Bạn không có quyền truy cập.'}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/')
@login_required
def dashboard():
    if not current_user.is_admin:
        abort(403)
    user_count = User.query.count()
    return render_template('admin/dashboard.html', user_count=user_count)

@admin_bp.route('/api/push/broadcast', methods=['POST'])
@login_required
@admin_required
def api_push_broadcast():
    data = request.get_json() or {}
    title = data.get('title')
    body = data.get('body')
    url = data.get('url', '/')

    if not title or not body:
        return jsonify({'status': 'error', 'message': 'Tiêu đề và nội dung không được để trống.'}), 400

    users = User.query.all()
    sent_count = 0
    
    # Payload gửi đi
    payload = {
        "title": title,
        "body": body,
        "url": url,
        "habitId": None # Tương thích với cấu trúc của SW hiện tại
    }

    for user in users:
        # Hàm send_web_push đã có sẵn trong utils
        send_web_push(user.id, payload)
        sent_count += 1

    return jsonify({
        'status': 'ok', 
        'message': f'Đã gửi thông báo thành công tới {sent_count} người dùng.'
    }), 200
