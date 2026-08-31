import zoneinfo
from datetime import datetime, date, time, timezone
from typing import Tuple, Optional

DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh"

def get_zoneinfo(tz_name: Optional[str]) -> zoneinfo.ZoneInfo:
    """Safely get ZoneInfo object, fallback to default timezone."""
    if not tz_name:
        return zoneinfo.ZoneInfo(DEFAULT_TIMEZONE)
    try:
        return zoneinfo.ZoneInfo(tz_name.strip())
    except Exception:
        return zoneinfo.ZoneInfo(DEFAULT_TIMEZONE)

def utc_now() -> datetime:
    """Return timezone-naive or timezone-aware UTC datetime standard."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

def parse_to_utc(dt_str: Optional[str], user_tz_name: Optional[str] = None) -> Optional[datetime]:
    """
    Parse an ISO date/time string from client into standardized UTC datetime.
    Handles ISO with Z, ISO with offsets (+07:00), and naive strings.
    """
    if not dt_str:
        return None
    try:
        clean_str = dt_str.strip()
        # Parse ISO format
        if clean_str.endswith("Z"):
            clean_str = clean_str[:-1] + "+00:00"
        
        parsed = datetime.fromisoformat(clean_str)
        if parsed.tzinfo is not None:
            # Convert to UTC and make naive for standard DB storage
            utc_dt = parsed.astimezone(timezone.utc)
            return utc_dt.replace(tzinfo=None)
        else:
            # Naive datetime: assume user timezone then convert to UTC
            tz = get_zoneinfo(user_tz_name)
            localized = parsed.replace(tzinfo=tz)
            utc_dt = localized.astimezone(timezone.utc)
            return utc_dt.replace(tzinfo=None)
    except Exception:
        return utc_now()

def get_user_today(user_tz_name: Optional[str] = None) -> date:
    """Get the current date in the user's specific local timezone."""
    tz = get_zoneinfo(user_tz_name)
    now_in_user_tz = datetime.now(tz)
    return now_in_user_tz.date()

def local_date_to_utc_range(date_str: str, user_tz_name: Optional[str] = None) -> Tuple[datetime, datetime]:
    """
    Given a local date string 'YYYY-MM-DD' and user timezone,
    return the exact (utc_start, utc_end) datetime range for DB queries.
    """
    tz = get_zoneinfo(user_tz_name)
    try:
        local_d = date.fromisoformat(date_str)
    except Exception:
        local_d = get_user_today(user_tz_name)

    # Start of day in user timezone (00:00:00)
    start_local = datetime.combine(local_d, time.min).replace(tzinfo=tz)
    # End of day in user timezone (23:59:59.999999)
    end_local = datetime.combine(local_d, time.max).replace(tzinfo=tz)

    utc_start = start_local.astimezone(timezone.utc).replace(tzinfo=None)
    utc_end = end_local.astimezone(timezone.utc).replace(tzinfo=None)

    return utc_start, utc_end
