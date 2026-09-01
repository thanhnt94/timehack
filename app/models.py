"""
TimeHack Database Models Aggregator (Backward Compatibility & Central Registry)
All models are modularized inside their respective app/modules/<module_name>/models.py
"""

from app.modules.auth.models import User
from app.modules.tasks.models import Category, Task, Subtask
from app.modules.habits.models import Habit, HabitLog
from app.modules.schedule.models import ScheduleSlot
from app.modules.time_tracking.models import TimeLog, ActiveTrack
from app.modules.notifications.models import UserNotification
from app.modules.settings.models import UserSettings

__all__ = [
    "User",
    "Category",
    "Task",
    "Subtask",
    "Habit",
    "HabitLog",
    "ScheduleSlot",
    "TimeLog",
    "ActiveTrack",
    "UserNotification",
    "UserSettings"
]
