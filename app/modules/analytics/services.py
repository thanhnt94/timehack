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

        entries = TimeEntry.query.filter(
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

            if cat_name not in category_map:
                category_map[cat_name] = {'minutes': 0, 'color': cat_color}
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
