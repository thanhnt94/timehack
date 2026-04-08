from flask import render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user

from . import settings_bp
from app.extensions import db
from app.models.category import Category
from app.models.time_entry import PomodoroSettings


@settings_bp.route('/')
@login_required
def preferences():
    """Settings page: categories + pomodoro config."""
    categories = Category.query.filter_by(user_id=current_user.id).all()
    categories.sort(key=lambda c: c.get_full_path())
    pomo = PomodoroSettings.get_or_create(current_user.id)
    return render_template('settings/preferences.html', categories=categories, pomo=pomo)


# ── Category CRUD API ──────────────────────────────────────────

@settings_bp.route('/api/categories', methods=['GET'])
@login_required
def api_categories():
    cats = Category.query.filter_by(user_id=current_user.id).all()
    # Sort by full_path so children appear immediately after parents
    cats.sort(key=lambda c: c.get_full_path())
    
    return jsonify([{
        'id': c.id, 
        'name': c.name, 
        'full_path': c.get_full_path(),
        'parent_id': c.parent_id,
        'indent_level': c.get_indent_level(),
        'color': c.color,
        'icon': c.icon, 
        'is_default': c.is_default,
    } for c in cats]), 200


@settings_bp.route('/api/categories', methods=['POST'])
@login_required
def api_add_category():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'status': 'error', 'message': 'Tên là bắt buộc.'}), 400

    parent_id = data.get('parent_id')
    if parent_id == '': parent_id = None
    
    # Check if parent exists
    if parent_id:
        parent = Category.query.filter_by(id=int(parent_id), user_id=current_user.id).first()
        if not parent:
            return jsonify({'status': 'error', 'message': 'Danh mục cha không tồn tại.'}), 404

    cat = Category(
        user_id=current_user.id,
        name=data['name'],
        parent_id=int(parent_id) if parent_id else None,
        color=data.get('color', '#6366F1'),
        icon=data.get('icon', '📌'),
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify({'status': 'ok', 'id': cat.id}), 201


@settings_bp.route('/api/categories/<int:cat_id>', methods=['PUT'])
@login_required
def api_update_category(cat_id):
    cat = Category.query.filter_by(id=cat_id, user_id=current_user.id).first()
    if not cat:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy.'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        cat.name = data['name']
    if 'color' in data:
        cat.color = data['color']
    if 'icon' in data:
        cat.icon = data['icon']
    if 'parent_id' in data:
        pid = data['parent_id']
        cat.parent_id = int(pid) if pid else None
        
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

@settings_bp.route('/api/categories/<int:cat_id>', methods=['DELETE'])
@login_required
def api_delete_category(cat_id):
    cat = Category.query.filter_by(id=cat_id, user_id=current_user.id).first()
    if not cat:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy.'}), 404
        
    db.session.delete(cat)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200




# ── Pomodoro Settings API ──────────────────────────────────────

@settings_bp.route('/api/pomodoro', methods=['GET'])
@login_required
def api_get_pomodoro():
    pomo = PomodoroSettings.get_or_create(current_user.id)
    return jsonify({
        'work_duration': pomo.work_duration,
        'short_break': pomo.short_break,
        'long_break': pomo.long_break,
        'sessions_before_long_break': pomo.sessions_before_long_break,
        'auto_start_breaks': pomo.auto_start_breaks,
        'auto_start_pomodoros': pomo.auto_start_pomodoros,
        'sound_enabled': pomo.sound_enabled,
    }), 200


@settings_bp.route('/api/pomodoro', methods=['PUT'])
@login_required
def api_update_pomodoro():
    pomo = PomodoroSettings.get_or_create(current_user.id)
    data = request.get_json() or {}

    for field in ['work_duration', 'short_break', 'long_break', 'sessions_before_long_break']:
        if field in data:
            setattr(pomo, field, int(data[field]))
    for field in ['auto_start_breaks', 'auto_start_pomodoros', 'sound_enabled']:
        if field in data:
            setattr(pomo, field, bool(data[field]))

    db.session.commit()
    return jsonify({'status': 'ok'}), 200


# ── User Profile / Timezone API ───────────────────────────────

@settings_bp.route('/api/profile', methods=['PUT'])
@login_required
def api_update_profile():
    """Update user profile (timezone, full_name, etc)."""
    data = request.get_json() or {}
    
    if 'timezone' in data:
        current_user.timezone = data['timezone']
    if 'full_name' in data:
        current_user.full_name = data['full_name']
    
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

