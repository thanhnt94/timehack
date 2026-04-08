from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
from flask import current_app
from app.extensions import db
from app.models.todo_item import TodoItem
from app.utils.push_helpers import send_web_push

scheduler = BackgroundScheduler()

def check_scheduled_todos(app):
    """Quét các Todo đến hạn và gửi Push Notification."""
    with app.app_context():
        now = datetime.now(timezone.utc).replace(tzinfo=None) # naive UTC so sánh với DB
        
        # Lấy các Todo đến hạn chưa thông báo và chưa hoàn thành
        pending_todos = TodoItem.query.filter(
            TodoItem.scheduled_time <= now,
            TodoItem.is_notified == False,
            TodoItem.is_completed == False
        ).all()

        for todo in pending_todos:
            payload = {
                "title": "⏰ Đến giờ làm việc!",
                "body": f"Đã đến lúc thực hiện: {todo.content}",
                "url": "/todo/",
                "habitId": None, # Dùng cho Smart Habit cũ
                "todoId": todo.id,
                "actions": [
                    { "action": "start_todo", "title": "✅ Track Ngay" },
                    { "action": "snooze_todo", "title": "⏰ Nhắc lại sau 10p" }
                ]
            }
            
            # Gửi Push
            send_web_push(todo.user_id, payload)
            
            # Đánh dấu đã thông báo
            todo.is_notified = True
            db.session.commit()

def start_scheduler(app):
    """Khởi chạy scheduler."""
    if not scheduler.running:
        scheduler.add_job(
            func=check_scheduled_todos,
            trigger="interval",
            minutes=1,
            args=[app]
        )
        scheduler.start()
        print("Background Scheduler started.")
