"""Utility helpers for time calculations and formatting."""

from datetime import datetime, timedelta, timezone

MINUTES_IN_DAY = 1440


def format_duration(minutes: int) -> str:
    """Format minutes into human-readable string. e.g., 125 -> '2h 05m'"""
    if minutes is None or minutes <= 0:
        return '0m'
    hours = minutes // 60
    mins = minutes % 60
    if hours > 0:
        return f'{hours}h {mins:02d}m'
    return f'{mins}m'


def format_duration_short(minutes: int) -> str:
    """Short format. e.g., 125 -> '2:05'"""
    if minutes is None or minutes <= 0:
        return '0:00'
    hours = minutes // 60
    mins = minutes % 60
    return f'{hours}:{mins:02d}'


def calculate_unlogged(total_logged_minutes: int) -> int:
    """Calculate unlogged/rest time for a given day."""
    return max(0, MINUTES_IN_DAY - total_logged_minutes)


def get_day_boundaries(date_obj, tz_offset_hours: int = 7):
    """
    Return (start_of_day, end_of_day) in UTC for a given local date.
    Default tz_offset_hours=7 for Asia/Ho_Chi_Minh (UTC+7).
    """
    local_tz = timezone(timedelta(hours=tz_offset_hours))

    if isinstance(date_obj, datetime):
        date_obj = date_obj.date()

    start_local = datetime(date_obj.year, date_obj.month, date_obj.day, 0, 0, 0, tzinfo=local_tz)
    end_local = start_local + timedelta(days=1)

    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def percentage(part: int, whole: int) -> float:
    """Calculate percentage, safe from division by zero."""
    if whole == 0:
        return 0.0
    return round((part / whole) * 100, 1)


def to_user_tz(dt_val, tz_name: str = 'Asia/Ho_Chi_Minh'):
    """Convert a (possibly naive-UTC) datetime to the user's timezone."""
    if dt_val is None:
        return None
    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        from backports.zoneinfo import ZoneInfo  # Python < 3.9 fallback

    user_tz = ZoneInfo(tz_name)

    if dt_val.tzinfo is None:
        # Treat naive as UTC
        dt_val = dt_val.replace(tzinfo=timezone.utc)

    return dt_val.astimezone(user_tz)


def tz_offset_from_name(tz_name: str = 'Asia/Ho_Chi_Minh') -> int:
    """Get the UTC offset in hours for a timezone name. Used by get_day_boundaries."""
    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        from backports.zoneinfo import ZoneInfo

    import math
    now = datetime.now(ZoneInfo(tz_name))
    return int(now.utcoffset().total_seconds() / 3600)

