import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from sqlalchemy import select

logger = logging.getLogger(__name__)

class TelegramService:
    @staticmethod
    async def get_bot_token_and_mode() -> Dict[str, Any]:
        """Loads SSO mode and local bot token from DB/Config."""
        try:
            from app.modules.sso_module.models import SSOConfig
            async with AsyncSessionLocal() as db:
                res = await db.execute(select(SSOConfig).limit(1))
                sso = res.scalar_one_or_none()
                if sso:
                    return {
                        "is_sso_enabled": sso.is_enabled,
                        "server_url": sso.server_url or settings.CENTRAL_AUTH_URL,
                        "local_token": sso.telegram_bot_token or settings.TELEGRAM_BOT_TOKEN,
                        "local_username": sso.telegram_bot_username
                    }
        except Exception as e:
            logger.warning(f"Error loading SSO/Telegram config from DB: {e}")

        return {
            "is_sso_enabled": bool(settings.CENTRAL_AUTH_URL),
            "server_url": settings.CENTRAL_AUTH_URL,
            "local_token": settings.TELEGRAM_BOT_TOKEN,
            "local_username": "InMindBot"
        }

    @staticmethod
    async def send_message(chat_id: str, text: str, user_id: Optional[int] = None, parse_mode: str = "HTML") -> bool:
        """
        Sends a Telegram notification.
        If SSO is enabled: routes through CentralAuth Queue Hub.
        If Standalone: sends direct via local Telegram Bot Token.
        """
        if not chat_id:
            logger.warning("Telegram notification skipped: No chat_id provided.")
            return False

        cfg = await TelegramService.get_bot_token_and_mode()

        # 1. If SSO is enabled: Dispatch via CentralAuth Queue Hub
        if cfg["is_sso_enabled"] and cfg["server_url"]:
            try:
                queue_url = f"{cfg['server_url'].rstrip('/')}/api/queue/telegram/send-message"
                queue_token = getattr(settings, "QUEUE_API_SECRET", "super-secret-token-123")
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(
                        queue_url,
                        json={
                            "chat_id": str(chat_id),
                            "text": text,
                            "source": "timehack",
                            "message_type": "custom_notification"
                        },
                        headers={"X-Queue-Token": queue_token, "X-Queue-Secret": queue_token}
                    )
                    if res.status_code in [200, 201]:
                        logger.info(f"Telegram notification dispatched via CentralAuth Queue for chat_id={chat_id}")
                        return True
                    else:
                        logger.warning(f"CentralAuth send-message returned {res.status_code}: {res.text}")
            except Exception as e:
                logger.warning(f"CentralAuth Queue Telegram dispatch error: {e}, attempting direct Bot fallback...")

        # 2. Standalone Mode / Fallback: Direct Telegram Bot API
        token = cfg.get("local_token")
        if token:
            try:
                bot_url = f"https://api.telegram.org/bot{token}/sendMessage"
                async with httpx.AsyncClient(timeout=6.0) as client:
                    res = await client.post(
                        bot_url,
                        json={
                            "chat_id": str(chat_id),
                            "text": text,
                            "parse_mode": parse_mode
                        }
                    )
                    if res.status_code == 200:
                        logger.info(f"Telegram direct message sent successfully to chat_id={chat_id}")
                        return True
                    else:
                        logger.error(f"Telegram direct message failed: {res.status_code} - {res.text}")
            except Exception as e:
                logger.error(f"Telegram direct send exception: {e}")

        return False

    @staticmethod
    async def send_task_reminder(chat_id: str, task_title: str, due_time: str, priority: str = "medium", before_mins: Optional[int] = None) -> bool:
        priority_emoji = {"urgent": "🚨", "high": "🔥", "medium": "📌", "low": "💡"}.get(priority, "📌")
        time_info = f"{due_time} ({before_mins}m before deadline)" if before_mins else due_time
        text = (
            f"<b>⏰ [TimeHack] Task Due Reminder</b>\n\n"
            f"{priority_emoji} <b>Task:</b> {task_title}\n"
            f"⏳ <b>Due:</b> {time_info}\n\n"
            f"👉 <a href='{settings.APP_BASE_URL or 'https://time.inmind.site'}'>Open TimeHack to Complete</a>"
        )
        return await TelegramService.send_message(chat_id=chat_id, text=text)

    @staticmethod
    async def send_habit_reminder(
        chat_id: str,
        habit_id: int,
        habit_title: str,
        target_str: str = "1 time",
        streak: int = 0
    ) -> bool:
        streak_badge = f"🔥 <b>Current Streak:</b> {streak} days\n" if streak > 0 else ""
        text = (
            f"<b>⚡ [TimeHack] Daily Habit Reminder</b>\n\n"
            f"🎯 <b>Habit:</b> {habit_title}\n"
            f"📊 <b>Goal:</b> {target_str}\n"
            f"{streak_badge}\n"
            f"👉 <a href='{settings.APP_BASE_URL or 'https://time.inmind.site'}'>Open TimeHack to Check In</a>"
        )
        return await TelegramService.send_message(chat_id=chat_id, text=text)

    @staticmethod
    async def send_plan_reminder(
        chat_id: str,
        slot_title: str,
        start_time: str,
        end_time: str,
        before_mins: int = 30
    ) -> bool:
        text = (
            f"<b>📅 [TimeHack] Focus Plan Reminder</b>\n\n"
            f"🎯 <b>Planned Block:</b> {slot_title}\n"
            f"⏰ <b>Scheduled Time:</b> {start_time} - {end_time} (in {before_mins} mins)\n\n"
            f"👉 <a href='{settings.APP_BASE_URL or 'https://time.inmind.site'}'>Open TimeHack to Start Focus Session</a>"
        )
        return await TelegramService.send_message(chat_id=chat_id, text=text)

    @staticmethod
    async def send_daily_wrap_up(
        chat_id: str,
        user_name: str,
        tasks_done: int,
        habits_done: int,
        focus_minutes: int
    ) -> bool:
        h = focus_minutes // 60
        m = focus_minutes % 60
        focus_str = f"{h}h {m}m" if h > 0 else f"{m}m"
        
        text = (
            f"<b>📊 [TimeHack] Daily Summary Report - {user_name}</b>\n\n"
            f"✅ <b>Tasks Completed:</b> {tasks_done}\n"
            f"⚡ <b>Habits Checked-In:</b> {habits_done}\n"
            f"⏱️ <b>Focus Time:</b> {focus_str}\n\n"
            f"Great job today! Rest well and get ready for tomorrow. 🚀"
        )
        return await TelegramService.send_message(chat_id=chat_id, text=text)
