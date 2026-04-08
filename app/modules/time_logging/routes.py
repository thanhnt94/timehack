from datetime import datetime, timezone, timedelta
from flask import render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user

from . import time_logging_bp
from .services import TimeLoggingService
from app.models.category import Category
from app.models.time_entry import TimeEntry
from app.models.tag import Tag
from app.extensions import db

@time_logging_bp.route('/')
@login_required
def dashboard():
    """Home / Dashboard Page."""
    user_tz = current_user.timezone or 'Asia/Ho_Chi_Minh'
    from app.utils.time_helpers import tz_offset_from_name
    tz_offset = tz_offset_from_name(user_tz)
    today_local = datetime.now(timezone(timedelta(hours=tz_offset))).date()

    entries_today = TimeLoggingService.get_entries_for_date(current_user.id, date_obj=today_local, tz_name=user_tz)
    total_today = sum(e.duration or 0 for e in entries_today if not e.is_running)

    from app.modules.analytics.services import AnalyticsService
    weekly_summary = AnalyticsService.get_weekly_summary(current_user.id, today_local)
    total_week = sum(d['total'] for d in weekly_summary)

    free_time = max(0, 1440 - total_today)
    deep_work = sum(e.duration or 0 for e in entries_today if e.is_pomodoro and not e.is_running)
    recent_entries = TimeEntry.query.filter_by(user_id=current_user.id, is_running=False).order_by(TimeEntry.start_time.desc()).limit(5).all()

    daily_goal = 480 
    progress_pct = min(100, (total_today / daily_goal) * 100) if daily_goal > 0 else 0
    remaining_today = max(0, daily_goal - total_today)

    return render_template('time_logging/home.html', total_today=total_today, total_week=total_week, free_time=free_time, deep_work=deep_work, recent_entries=recent_entries, progress_pct=progress_pct, remaining_today=remaining_today, today_local=today_local)

@time_logging_bp.route('/track')
@login_required
def track():
    """Dedicated Track Page."""
    running_entry = TimeLoggingService.get_running_entry(current_user.id)
    categories = Category.query.filter_by(user_id=current_user.id).all()
    categories.sort(key=lambda c: c.get_full_path())

    from app.models.todo_item import TodoItem
    pending_todos = TodoItem.query.filter_by(user_id=current_user.id, is_completed=False).order_by(TodoItem.created_at.desc()).all()

    # Lấy toàn bộ Tag của user kèm theo mapping với category
    all_tags = Tag.query.filter_by(user_id=current_user.id).all()
    
    # Chuẩn bị data tag cho JS: { tag_id: { name: '', categories: [cat_id, ...] } }
    tags_json = []
    for t in all_tags:
        tags_json.append({
            'id': t.id,
            'name': t.name,
            'category_ids': [c.id for c in t.categories]
        })

    return render_template('time_logging/track.html', running_entry=running_entry, categories=categories, pending_todos=pending_todos, tags_data=tags_json)

@time_logging_bp.route('/api/start', methods=['POST'])
@login_required
def api_start():
    try:
        data = request.get_json() or {}
        category_id = data.get('category_id')
        todo_id = data.get('todo_id')
        note = data.get('note', '')
        is_pomodoro = data.get('is_pomodoro', False)
        tag_ids = data.get('tag_ids', []) # Nhận danh sách ID tag

        entry = TimeLoggingService.start_timer(user_id=current_user.id, category_id=category_id, todo_id=todo_id, note=note, is_pomodoro=is_pomodoro)
        
        # Gắn tag vào entry
        if tag_ids:
            tags = Tag.query.filter(Tag.id.in_(tag_ids), Tag.user_id == current_user.id).all()
            entry.tags = tags
            db.session.commit()

        return jsonify({'status': 'ok', 'entry': entry.to_dict()}), 200
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@time_logging_bp.route('/api/stop', methods=['POST'])
@login_required
def api_stop():
    try:
        entry = TimeLoggingService.stop_timer(current_user.id)
        if not entry: return jsonify({'status': 'error', 'message': 'Không có timer đang chạy.'}), 404
        return jsonify({'status': 'ok', 'entry': entry.to_dict()}), 200
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@time_logging_bp.route('/api/running', methods=['GET'])
@login_required
def api_running():
    entry = TimeLoggingService.get_running_entry(current_user.id)
    return jsonify({'running': entry is not None, 'entry': entry.to_dict() if entry else None}), 200

@time_logging_bp.route('/api/manual', methods=['POST'])
@login_required
def api_manual_entry():
    try:
        data = request.get_json()
        start_naive = datetime.fromisoformat(data['start_time'])
        end_naive = datetime.fromisoformat(data['end_time'])
        from app.utils.time_helpers import tz_offset_from_name
        offset = tz_offset_from_name(current_user.timezone or 'Asia/Ho_Chi_Minh')
        tz_info = timezone(timedelta(hours=offset))
        start = start_naive.replace(tzinfo=tz_info).astimezone(timezone.utc)
        end = end_naive.replace(tzinfo=tz_info).astimezone(timezone.utc)
        now_utc = datetime.now(timezone.utc)
        if end > now_utc + timedelta(minutes=1): return jsonify({'status': 'error', 'message': 'Không thể thêm bản ghi trong tương lai.'}), 400
        if end <= start: return jsonify({'status': 'error', 'message': 'Thời gian kết thúc phải sau thời gian bắt đầu.'}), 400

        entry = TimeLoggingService.add_manual_entry(user_id=current_user.id, start_time=start.isoformat(), end_time=end.isoformat(), category_id=data.get('category_id'), todo_id=data.get('todo_id'), note=data.get('note', ''), is_pomodoro=data.get('is_pomodoro', False))
        
        tag_ids = data.get('tag_ids', [])
        if tag_ids:
            tags = Tag.query.filter(Tag.id.in_(tag_ids), Tag.user_id == current_user.id).all()
            entry.tags = tags
            db.session.commit()

        return jsonify({'status': 'ok', 'entry': entry.to_dict()}), 201
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@time_logging_bp.route('/api/entry/<int:entry_id>', methods=['PUT'])
@login_required
def api_update_entry(entry_id):
    data = request.get_json() or {}
    entry, error = TimeLoggingService.update_entry(entry_id, current_user.id, **data)
    if error: return jsonify({'status': 'error', 'message': error}), 400
    return jsonify({'status': 'ok', 'entry': entry.to_dict()}), 200

@time_logging_bp.route('/api/entry/<int:entry_id>', methods=['DELETE'])
@login_required
def api_delete_entry(entry_id):
    ok = TimeLoggingService.delete_entry(entry_id, current_user.id)
    return jsonify({'status': 'ok' if ok else 'error'}), 200 if ok else 404
