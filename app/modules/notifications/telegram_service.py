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
                queue_url = f"{cfg['server_url'].rstrip('/')}/api/queue/submit"
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.post(
                        queue_url,
                        json={
                            "task_type": "telegram_message",
                            "satellite_source": "timehack",
                            "payload": {
                                "user_id": user_id,
                                "chat_id": str(chat_id),
                                "message": text,
                                "text": text,
                                "parse_mode": parse_mode
                            }
                        },
                        headers={"X-Queue-Secret": settings.QUEUE_API_SECRET}
                    )
                    if res.status_code in [200, 201]:
                        logger.info(f"Telegram notification dispatched via CentralAuth Queue for chat_id={chat_id}")
                        return True
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
    async def send_task_reminder(chat_id: str, task_title: str, due_time: str, priority: str = "medium") -> bool:
        priority_emoji = {"urgent": "🚨", "high": "🔥", "medium": "📌", "low": "💡"}.get(priority, "📌")
        text = (
            f"<b>⏰ [TimeHack] Nhắc Nhở Công Việc Đến Hạn</b>\n\n"
            f"{priority_emoji} <b>Nhiệm vụ:</b> {task_title}\n"
            f"⏳ <b>Thời hạn:</b> {due_time}\n\n"
            f"👉 <a href='{settings.APP_BASE_URL or 'https://time.inmind.site'}'>Mở TimeHack để hoàn thành</a>"
        )
        return await TelegramService.send_message(chat_id=chat_id, text=text)

    @staticmethod
    async def send_habit_reminder(
        chat_id: str,
        habit_id: int,
        habit_title: str,
        target_str: str = "1 lần",
        streak: int = 0
    ) -> bool:
        streak_badge = f"🔥 <b>Chuỗi hiện tại:</b> {streak} ngày\n" if streak > 0 else ""
        text = (
            f"<b>⚡ [TimeHack] Nhắc Nhở Thói Quen Hàng Ngày</b>\n\n"
            f"🎯 <b>Thói quen:</b> {habit_title}\n"
            f"📊 <b>Mục tiêu:</b> {target_str}\n"
            f"{streak_badge}\n"
            f"👉 <a href='{settings.APP_BASE_URL or 'https://time.inmind.site'}/habits/{habit_id}'>Mở TimeHack để check-in</a>"
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
        focus_str = f"{h}h {m}p" if h > 0 else f"{m}p"
        
        text = (
            f"<b>📊 [TimeHack] Báo Cáo Tổng Kết Ngày - {user_name}</b>\n\n"
            f"✅ <b>Nhiệm vụ hoàn thành:</b> {tasks_done} việc\n"
            f"⚡ <b>Thói quen đã check-in:</b> {habits_done} mục\n"
            f"⏱️ <b>Thời gian tập trung:</b> {focus_str}\n\n"
            f"Chúc bạn buổi tối nghỉ ngơi vui vẻ và sẵn sàng bứt phá ngày mai! 🚀"
        )
        return await TelegramService.send_message(chat_id=chat_id, text=text)
