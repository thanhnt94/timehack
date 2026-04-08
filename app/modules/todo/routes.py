from flask import render_template, request, jsonify
from flask_login import login_required, current_user
from . import todo_bp
from app.models.todo_item import TodoItem
from app.extensions import db
from datetime import datetime, timezone

@todo_bp.route('/')
@login_required
def index():
    todos = TodoItem.query.filter_by(user_id=current_user.id).order_by(TodoItem.created_at.desc()).all()
    return render_template('todo/index.html', todos=todos)

@todo_bp.route('/api/add', methods=['POST'])
@login_required
def add_todo():
    data = request.get_json()
    content = data.get('content')
    if not content:
        return jsonify({'status': 'error', 'message': 'Content is required'}), 400
    
    new_todo = TodoItem(user_id=current_user.id, content=content)
    db.session.add(new_todo)
    db.session.commit()
    return jsonify({'status': 'ok', 'todo': new_todo.to_dict()}), 201

@todo_bp.route('/api/toggle/<int:todo_id>', methods=['POST'])
@login_required
def toggle_todo(todo_id):
    todo = TodoItem.query.filter_by(id=todo_id, user_id=current_user.id).first()
    if not todo:
        return jsonify({'status': 'error', 'message': 'Not found'}), 404
    
    todo.is_completed = not todo.is_completed
    db.session.commit()
    return jsonify({'status': 'ok', 'is_completed': todo.is_completed}), 200

@todo_bp.route('/api/delete/<int:todo_id>', methods=['DELETE'])
@login_required
def delete_todo(todo_id):
    todo = TodoItem.query.filter_by(id=todo_id, user_id=current_user.id).first()
    if not todo:
        return jsonify({'status': 'error', 'message': 'Not found'}), 404
    
    db.session.delete(todo)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200
