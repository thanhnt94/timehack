from datetime import datetime, timezone, timedelta
from flask import render_template, request, jsonify
from flask_login import login_required, current_user
from . import todo_bp
from app.models.todo_item import TodoItem
from app.extensions import db

@todo_bp.route('/')
@login_required
def index():
    todos = TodoItem.query.filter_by(user_id=current_user.id).order_by(TodoItem.created_at.desc()).all()
    from app.models.category import Category
    categories = Category.query.filter_by(user_id=current_user.id).all()
    categories.sort(key=lambda c: c.get_full_path())
    return render_template('todo/index.html', todos=todos, categories=categories)

@todo_bp.route('/api/add', methods=['POST'])
@login_required
def api_add():
    data = request.get_json()
    content = data.get('content')
    category_id = data.get('category_id')
    scheduled_time_str = data.get('scheduled_time') # Định dạng ISO: YYYY-MM-DDTHH:MM
    
    if not content or not category_id:
        return jsonify({'error': 'Nội dung và Danh mục là bắt buộc'}), 400

    scheduled_time = None
    if scheduled_time_str:
        try:
            # Chuyển đổi từ giờ địa phương của User sang UTC
            naive_dt = datetime.fromisoformat(scheduled_time_str)
            from app.utils.time_helpers import tz_offset_from_name
            offset = tz_offset_from_name(current_user.timezone or 'Asia/Ho_Chi_Minh')
            tz_info = timezone(timedelta(hours=offset))
            scheduled_time = naive_dt.replace(tzinfo=tz_info).astimezone(timezone.utc).replace(tzinfo=None)
        except ValueError:
            pass

    todo = TodoItem(
        user_id=current_user.id, 
        content=content, 
        category_id=category_id,
        scheduled_time=scheduled_time
    )
    db.session.add(todo)
    db.session.commit()
    return jsonify({'status': 'ok', 'todo': todo.to_dict()}), 201

@todo_bp.route('/api/toggle/<int:todo_id>', methods=['POST'])
@login_required
def toggle_todo(todo_id):
    todo = TodoItem.query.filter_by(id=todo_id, user_id=current_user.id).first()
    if not todo: return jsonify({'error': 'Not found'}), 404
    todo.is_completed = not todo.is_completed
    db.session.commit()
    return jsonify({'status': 'ok', 'is_completed': todo.is_completed})

@todo_bp.route('/api/delete/<int:todo_id>', methods=['DELETE'])
@login_required
def delete_todo(todo_id):
    todo = TodoItem.query.filter_by(id=todo_id, user_id=current_user.id).first()
    if not todo: return jsonify({'error': 'Not found'}), 404
    db.session.delete(todo)
    db.session.commit()
    return jsonify({'status': 'ok'})
