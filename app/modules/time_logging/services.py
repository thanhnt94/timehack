"""Business logic for time entry management."""

from datetime import datetime, timezone, timedelta
from app.extensions import db
from app.models.time_entry import TimeEntry
from app.models.category import Category
from app.models.todo_item import TodoItem


class TimeLoggingService:

    @staticmethod
    def start_timer(user_id: int, category_id: int = None, note: str = None, is_pomodoro: bool = False, todo_id: int = None):
        """Start a new running timer. Stops any existing running timer first."""
        # Stop any existing running entry
        TimeLoggingService.stop_timer(user_id)

        entry = TimeEntry(
            user_id=user_id,
            category_id=category_id,
            todo_id=todo_id,
            start_time=datetime.now(timezone.utc),
            is_pomodoro=is_pomodoro,
            is_running=True,
            note=note,
        )
        db.session.add(entry)
        
        # Cập nhật trạng thái Todo sang 'in_progress'
        if todo_id:
            todo = db.session.get(TodoItem, todo_id)
            if todo:
                todo.status = 'in_progress'

        db.session.commit()
        return entry

    @staticmethod
    def stop_timer(user_id: int):
        """Stop the currently running timer and return the entry with level up info."""
        entry = TimeEntry.query.filter_by(user_id=user_id, is_running=True).first()
        if not entry:
            return None, None
        entry.stop()
        
        # Cập nhật trạng thái Todo về 'completed' hoặc 'pending'
        # Ở đây ta mặc định 'completed' theo yêu cầu Phase 4
        if entry.todo_id:
            todo = db.session.get(TodoItem, entry.todo_id)
            if todo:
                todo.status = 'completed'
                todo.is_completed = True

        level_up_info = None
        if entry.category and entry.duration:
            level_up_info = TimeLoggingService._add_exp_to_category(entry.category, entry.duration)

        db.session.commit()
        return entry, level_up_info

    @staticmethod
    def _add_exp_to_category(category, minutes):
        """Helper để cộng EXP và kiểm tra lên cấp."""
        from app.utils.gamification import calculate_level_info
        
        old_level = category.current_level
        category.current_exp += minutes
        
        level_data = calculate_level_info(category.current_exp)
        category.current_level = level_data['level']
        
        if category.current_level > old_level:
            return {
                'leveled_up': True,
                'skill_name': category.name,
                'new_level': category.current_level
            }
        return {'leveled_up': False}

    @staticmethod
    def get_running_entry(user_id: int):
        """Get the currently running timer entry, if any."""
        return TimeEntry.query.filter_by(user_id=user_id, is_running=True).first()

    @staticmethod
    def add_manual_entry(user_id: int, start_time, end_time, category_id=None,
                         note=None, is_pomodoro=False, todo_id: int = None):
        """Add a retroactive/manual time entry."""
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time)
        if isinstance(end_time, str):
            end_time = datetime.fromisoformat(end_time)

        delta = end_time - start_time
        duration = max(1, int(delta.total_seconds() / 60))

        entry = TimeEntry(
            user_id=user_id,
            category_id=category_id,
            todo_id=todo_id,
            start_time=start_time,
            end_time=end_time,
            duration=duration,
            note=note,
            is_pomodoro=is_pomodoro,
            is_running=False,
        )
        db.session.add(entry)
        
        # Ghi thủ công thì mặc định xong task luôn
        if todo_id:
            todo = db.session.get(TodoItem, todo_id)
            if todo:
                todo.status = 'completed'
                todo.is_completed = True
        
        # Gamification
        level_up_info = None
        if entry.category:
            level_up_info = TimeLoggingService._add_exp_to_category(entry.category, duration)
            
        db.session.commit()
        return entry, level_up_info

    @staticmethod
    def get_entries_for_date(user_id: int, date_obj=None, tz_name: str = 'Asia/Ho_Chi_Minh'):
        """Get all entries for a specific date in the user's timezone."""
        from app.utils.time_helpers import get_day_boundaries, tz_offset_from_name

        tz_offset = tz_offset_from_name(tz_name)

        if date_obj is None:
            now_local = datetime.now(timezone(timedelta(hours=tz_offset)))
            date_obj = now_local.date()

        from sqlalchemy.orm import joinedload, selectinload
        start_utc, end_utc = get_day_boundaries(date_obj, tz_offset)

        entries = TimeEntry.query.options(
            joinedload(TimeEntry.category),
            joinedload(TimeEntry.todo),
            selectinload(TimeEntry.tags)
        ).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.start_time >= start_utc,
            TimeEntry.start_time < end_utc,
        ).order_by(TimeEntry.start_time.desc()).all()

        return entries

    @staticmethod
    def delete_entry(entry_id: int, user_id: int):
        """Delete a time entry owned by the user."""
        entry = TimeEntry.query.filter_by(id=entry_id, user_id=user_id).first()
        if entry:
            db.session.delete(entry)
            db.session.commit()
            return True
        return False

    @staticmethod
    def check_overlap(user_id: int, start_time, end_time, exclude_id: int = None):
        """Check if a time range overlaps with any existing entry for this user."""
        query = TimeEntry.query.filter(
            TimeEntry.user_id == user_id,
            TimeEntry.is_running == False,  # noqa: E712
            TimeEntry.start_time < end_time,
            TimeEntry.end_time > start_time,
        )
        if exclude_id:
            query = query.filter(TimeEntry.id != exclude_id)
        return query.first()

    @staticmethod
    def update_entry(entry_id: int, user_id: int, **kwargs):
        """Update a time entry's fields with overlap validation."""
        entry = TimeEntry.query.filter_by(id=entry_id, user_id=user_id).first()
        if not entry:
            return None, 'Không tìm thấy bản ghi.'

        # Parse datetime strings if needed
        for field in ('start_time', 'end_time'):
            if field in kwargs and isinstance(kwargs[field], str) and kwargs[field]:
                from datetime import datetime as dt
                # Handle ISO strings from JS
                val = kwargs[field].replace('Z', '')
                kwargs[field] = dt.fromisoformat(val)

        for key, value in kwargs.items():
            if key == 'tag_ids':
                from app.models.tag import Tag
                tags = Tag.query.filter(Tag.id.in_(value), Tag.user_id == user_id).all()
                entry.tags = tags
            elif hasattr(entry, key) and value is not None:
                setattr(entry, key, value)

        # Recalculate duration if times changed
        if entry.start_time and entry.end_time:
            # Xử lý múi giờ cho chuẩn xác (Coi input là giờ địa phương của user)
            from app.utils.time_helpers import tz_offset_from_name
            from app.models.user import User
            user = db.session.get(User, user_id)
            user_tz = user.timezone or 'Asia/Ho_Chi_Minh'
            offset = tz_offset_from_name(user_tz)
            tz_info = timezone(timedelta(hours=offset))

            # Chuyển về naive UTC để so sánh database nếu cần, hoặc aware UTC
            start = entry.start_time
            if start.tzinfo is None: start = start.replace(tzinfo=tz_info).astimezone(timezone.utc)
            
            end = entry.end_time
            if end.tzinfo is None: end = end.replace(tzinfo=tz_info).astimezone(timezone.utc)

            # Cập nhật lại vào entry (loại bỏ tzinfo để khớp SQLite nếu cần)
            entry.start_time = start.replace(tzinfo=None)
            entry.end_time = end.replace(tzinfo=None)
            
            if entry.end_time <= entry.start_time:
                return None, 'Thời gian kết thúc phải sau thời gian bắt đầu.'
            
            delta = entry.end_time - entry.start_time
            entry.duration = max(1, int(delta.total_seconds() / 60))

        db.session.commit()
        return entry, None
