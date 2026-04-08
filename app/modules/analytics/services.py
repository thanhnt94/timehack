"""Analytics aggregation logic."""

from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from app.extensions import db
from app.models.time_entry import TimeEntry
from app.models.category import Category
from app.utils.time_helpers import MINUTES_IN_DAY, get_day_boundaries


class AnalyticsService:

    @staticmethod
    def get_daily_summary(user_id: int, date_obj=None):
        """
        Get a summary for a single day:
        - category breakdown (for pie chart)
        - total logged vs unlogged
        - pomodoro count & total
        """
        if date_obj is None:
            now_local = datetime.now(timezone(timedelta(hours=7)))
            date_obj = now_local.date()

        start_utc, end_utc = get_day_boundaries(date_obj)

        from sqlalchemy.orm import joinedload
        entries = TimeEntry.query.options(joinedload(TimeEntry.category)).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.start_time >= start_utc,
            TimeEntry.start_time < end_utc,
            TimeEntry.is_running == False,  # noqa: E712
        ).all()

        # Category breakdown
        category_map = {}
        total_logged = 0
        pomodoro_count = 0
        pomodoro_minutes = 0

        for entry in entries:
            dur = entry.duration or 0
            total_logged += dur

            if entry.is_pomodoro:
                pomodoro_count += 1
                pomodoro_minutes += dur

            root_cat = entry.category.get_root() if entry.category else None
            cat_name = root_cat.name if root_cat else 'Không phân loại'
            cat_color = root_cat.color if root_cat else '#94A3B8'
            cat_icon = root_cat.icon if root_cat else '📌'

            if cat_name not in category_map:
                from app.utils.gamification import calculate_level_info
                lvl_info = calculate_level_info(root_cat.current_exp if root_cat else 0)
                category_map[cat_name] = {
                    'minutes': 0, 
                    'color': cat_color, 
                    'icon': cat_icon,
                    'level': root_cat.current_level if root_cat else 1,
                    'level_info': lvl_info
                }
            category_map[cat_name]['minutes'] += dur

        unlogged = max(0, MINUTES_IN_DAY - total_logged)

        # Build chart data
        chart_labels = list(category_map.keys())
        chart_values = [v['minutes'] for v in category_map.values()]
        chart_colors = [v['color'] for v in category_map.values()]

        # Always append unlogged
        if unlogged > 0:
            chart_labels.append('Nghỉ ngơi / Sinh hoạt')
            chart_values.append(unlogged)
            chart_colors.append('#E2E8F0')

        return {
            'date': date_obj.isoformat(),
            'total_logged': total_logged,
            'unlogged': unlogged,
            'pomodoro_count': pomodoro_count,
            'pomodoro_minutes': pomodoro_minutes,
            'categories': category_map,
            'chart': {
                'labels': chart_labels,
                'data': chart_values,
                'colors': chart_colors,
            }
        }

    @staticmethod
    def get_weekly_summary(user_id: int, end_date=None):
        """Get daily totals for the past 7 days (for bar chart)."""
        if end_date is None:
            now_local = datetime.now(timezone(timedelta(hours=7)))
            end_date = now_local.date()

        days = []
        for i in range(6, -1, -1):
            day = end_date - timedelta(days=i)
            start_utc, end_of_day_utc = get_day_boundaries(day)

            total = db.session.query(func.coalesce(func.sum(TimeEntry.duration), 0)).filter(
                TimeEntry.user_id == user_id,
                TimeEntry.start_time >= start_utc,
                TimeEntry.start_time < end_of_day_utc,
                TimeEntry.is_running == False,  # noqa: E712
            ).scalar()

            pomo = db.session.query(func.coalesce(func.sum(TimeEntry.duration), 0)).filter(
                TimeEntry.user_id == user_id,
                TimeEntry.start_time >= start_utc,
                TimeEntry.start_time < end_of_day_utc,
                TimeEntry.is_running == False,  # noqa: E712
                TimeEntry.is_pomodoro == True,  # noqa: E712
            ).scalar()

            days.append({
                'date': day.isoformat(),
                'label': day.strftime('%a %d/%m'),
                'total': total,
                'pomodoro': pomo,
            })

        return days

    @staticmethod
    def get_heatmap_data(user_id: int):
        """Get daily totals for the last 365 days for the heatmap."""
        end_date = datetime.now(timezone(timedelta(hours=7))).date()
        start_date = end_date - timedelta(days=364)

        # Use group by to get all sums in one query
        # sqlite: strftime('%Y-%m-%d', start_time)
        # postgres: start_time::date
        # We'll use a more generic approach or check for sqlite
        results = db.session.query(
            func.date(TimeEntry.start_time).label('date'),
            func.sum(TimeEntry.duration).label('total')
        ).filter(
            TimeEntry.user_id == user_id,
            TimeEntry.start_time >= start_date,
            TimeEntry.is_running == False  # noqa: E712
        ).group_by(func.date(TimeEntry.start_time)).all()

        data_map = {r.date.isoformat() if hasattr(r.date, 'isoformat') else str(r.date): r.total for r in results}

        heatmap = []
        for i in range(365):
            day = start_date + timedelta(days=i)
            iso = day.isoformat()
            heatmap.append({
                'date': iso,
                'total': data_map.get(iso, 0)
            })

        return heatmap

class HabitRecognitionService:
    @staticmethod
    def analyze_and_create_habits(user_id: int):
        """Phân tích lịch sử 7 ngày để tìm các khung giờ lặp lại (Patterns)."""
        from app.models.smart_habit import SmartHabit
        from datetime import time
        
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        # 1. Query TimeEntry trong 7 ngày qua
        entries = TimeEntry.query.filter(
            TimeEntry.user_id == user_id,
            TimeEntry.start_time >= seven_days_ago,
            TimeEntry.is_running == False  # noqa: E712
        ).all()

        # 2. Heuristic: Gom nhóm theo Category và Slot 30 phút
        patterns = {}
        for e in entries:
            # Chuyển về giờ địa phương (giả sử VN) để phân tích slot
            # Trong thực tế nên dùng current_user.timezone
            h = e.start_time.hour 
            m = e.start_time.minute
            slot_idx = (h * 60 + m) // 30
            key = (e.category_id, slot_idx)
            patterns[key] = patterns.get(key, 0) + 1

        new_suggestions = []
        for (cat_id, slot_idx), count in patterns.items():
            if count >= 3: # Lặp lại ít nhất 3 lần trong tuần
                h, m = divmod(slot_idx * 30, 60)
                habit_time = time(h, m)

                # Kiểm tra habit đã tồn tại chưa
                exists = SmartHabit.query.filter_by(
                    user_id=user_id, 
                    category_id=cat_id, 
                    expected_time=habit_time
                ).first()

                if not exists:
                    habit = SmartHabit(
                        user_id=user_id,
                        category_id=cat_id,
                        expected_time=habit_time
                    )
                    db.session.add(habit)
                    db.session.commit()
                    new_suggestions.append(habit.to_dict())
        
        return new_suggestions
