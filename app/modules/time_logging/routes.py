from datetime import datetime, timezone, timedelta
from flask import render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

from . import time_logging_bp
from .services import TimeLoggingService
from app.models.category import Category
from app.models.time_entry import TimeEntry
from app.extensions import db
from app.utils.time_helpers import format_duration


@time_logging_bp.route('/')
@login_required
def dashboard():
    running_entry = TimeLoggingService.get_running_entry(current_user.id)
    user_tz = current_user.timezone or 'Asia/Ho_Chi_Minh'

    # Date navigation: ?date=YYYY-MM-DD
    from app.utils.time_helpers import tz_offset_from_name
    tz_offset = tz_offset_from_name(user_tz)
    today_local = datetime.now(timezone(timedelta(hours=tz_offset))).date()

    date_str = request.args.get('date')
    selected_date = today_local
    if date_str:
        try:
            selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    is_today = (selected_date == today_local)
    entries = TimeLoggingService.get_entries_for_date(current_user.id, date_obj=selected_date, tz_name=user_tz)
    categories = Category.query.filter_by(user_id=current_user.id).all()
    categories.sort(key=lambda c: c.get_full_path())

    total_day = sum(e.duration or 0 for e in entries if not e.is_running)
    pomodoro_day = sum(e.duration or 0 for e in entries if e.is_pomodoro and not e.is_running)

    return render_template('time_logging/dashboard.html',
                           running_entry=running_entry,
                           entries=entries,
                           categories=categories,
                           total_today=total_day,
                           pomodoro_today=pomodoro_day,
                           selected_date=selected_date,
                           is_today=is_today,
                           format_duration=format_duration)


# ── API Endpoints ──────────────────────────────────────────────

@time_logging_bp.route('/api/start', methods=['POST'])
@login_required
def api_start():
    """Start a new timer (JSON API)."""
    data = request.get_json() or {}
    category_id = data.get('category_id')
    note = data.get('note', '')
    is_pomodoro = data.get('is_pomodoro', False)

    entry = TimeLoggingService.start_timer(
        user_id=current_user.id,
        category_id=category_id,
        note=note,
        is_pomodoro=is_pomodoro,
    )
    return jsonify({'status': 'ok', 'entry': entry.to_dict()}), 200


@time_logging_bp.route('/api/stop', methods=['POST'])
@login_required
def api_stop():
    """Stop the running timer (JSON API)."""
    entry = TimeLoggingService.stop_timer(current_user.id)
    if not entry:
        return jsonify({'status': 'error', 'message': 'Không có timer đang chạy.'}), 404
    return jsonify({'status': 'ok', 'entry': entry.to_dict()}), 200


@time_logging_bp.route('/api/running', methods=['GET'])
@login_required
def api_running():
    """Get the currently running entry (JSON API)."""
    entry = TimeLoggingService.get_running_entry(current_user.id)
    if not entry:
        return jsonify({'running': False}), 200
    return jsonify({'running': True, 'entry': entry.to_dict()}), 200


@time_logging_bp.route('/api/entries', methods=['GET'])
@login_required
def api_entries():
    """Get entries for a given date (JSON API). Query param: ?date=YYYY-MM-DD"""
    date_str = request.args.get('date')
    date_obj = None
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    entries = TimeLoggingService.get_entries_for_date(current_user.id, date_obj)
    return jsonify({'entries': [e.to_dict() for e in entries]}), 200


@time_logging_bp.route('/api/manual', methods=['POST'])
@login_required
def api_manual_entry():
    """Add a manual/retroactive time entry (JSON API)."""
    data = request.get_json()
    if not data or not data.get('start_time') or not data.get('end_time'):
        return jsonify({'status': 'error', 'message': 'start_time và end_time là bắt buộc.'}), 400

    # Parse and validate times
    try:
        start = datetime.fromisoformat(data['start_time'])
        end = datetime.fromisoformat(data['end_time'])
    except (ValueError, TypeError):
        return jsonify({'status': 'error', 'message': 'Định dạng thời gian không hợp lệ.'}), 400

    now = datetime.utcnow()
    if end > now:
        return jsonify({'status': 'error', 'message': 'Không thể thêm bản ghi trong tương lai.'}), 400
    if start > now:
        return jsonify({'status': 'error', 'message': 'Thời gian bắt đầu không thể ở tương lai.'}), 400
    if end <= start:
        return jsonify({'status': 'error', 'message': 'Thời gian kết thúc phải sau thời gian bắt đầu.'}), 400

    entry = TimeLoggingService.add_manual_entry(
        user_id=current_user.id,
        start_time=data['start_time'],
        end_time=data['end_time'],
        category_id=data.get('category_id'),
        note=data.get('note', ''),
        is_pomodoro=data.get('is_pomodoro', False),
    )
    return jsonify({'status': 'ok', 'entry': entry.to_dict()}), 201


@time_logging_bp.route('/api/entry/<int:entry_id>', methods=['DELETE'])
@login_required
def api_delete_entry(entry_id):
    """Delete a time entry (JSON API)."""
    ok = TimeLoggingService.delete_entry(entry_id, current_user.id)
    if not ok:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy.'}), 404
    return jsonify({'status': 'ok'}), 200


@time_logging_bp.route('/api/entry/<int:entry_id>', methods=['PUT'])
@login_required
def api_update_entry(entry_id):
    """Update a time entry (JSON API)."""
    data = request.get_json() or {}
    entry, error = TimeLoggingService.update_entry(entry_id, current_user.id, **data)
    if error:
        return jsonify({'status': 'error', 'message': error}), 400
    return jsonify({'status': 'ok', 'entry': entry.to_dict()}), 200
