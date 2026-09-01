import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class TelegramService:
    @staticmethod
    async def send_message(chat_id: str, text: str, user_id: Optional[int] = None, parse_mode: str = "HTML") -> bool:
        """
        Sends a Telegram notification via CentralAuth Queue Hub or directly via bot token.
        """
        if not chat_id:
            logger.warning("Telegram notification skipped: No chat_id provided.")
            return False

        # 1. Try CentralAuth Queue Hub
        if settings.CENTRAL_AUTH_URL:
            try:
                queue_url = f"{settings.CENTRAL_AUTH_URL.rstrip('/')}/api/queue/submit"
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.post(
                        queue_url,
                        json={
                            "task_type": "telegram_message",
                            "satellite_source": "timehack",
                            "payload": {
                                "user_id": user_id,
                                "chat_id": chat_id,
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
                logger.warning(f"CentralAuth Queue Telegram dispatch error: {e}, falling back to direct Bot API...")

        # 2. Fallback to direct Telegram Bot API
        if settings.TELEGRAM_BOT_TOKEN:
            try:
                bot_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.post(
                        bot_url,
                        json={
                            "chat_id": chat_id,
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
            f"👉 <a href='{settings.APP_BASE_URL or 'https://time.inmind.site'}/habits/{habit_id}'>Mở TimeHack để check-in & ghi nhận cảm xúc</a>"
        )
        return await TelegramService.send_message(chat_id=chat_id, text=text)

    @staticmethod
    async def send_daily_wrap_up(
        chat_id: str,
        user_name: str,
        tasks_done: int,
        tasks_total: int,
        habits_done: int,
        habits_total: int,
        focus_minutes: int
    ) -> bool:
        text = (
            f"<b>📊 [TimeHack] Tổng Kết Năng Suất Ngày Hôm Nay</b>\n"
            f"Chào <b>{user_name}</b>, dưới đây là kết quả của bạn:\n\n"
            f"✅ <b>Công việc hoàn thành:</b> {tasks_done}/{tasks_total}\n"
            f"⚡ <b>Thói quen duy trì:</b> {habits_done}/{habits_total}\n"
            f"⏱️ <b>Thời gian tập trung:</b> {focus_minutes} phút ({round(focus_minutes / 60, 1)}h)\n\n"
            f"🔥 <i>Tiếp tục giữ vững phong độ vào ngày mai nhé!</i>\n"
            f"👉 <a href='{settings.APP_BASE_URL or 'https://time.inmind.site'}'>Xem biểu đồ chi tiết</a>"
        )
        return await TelegramService.send_message(chat_id=chat_id, text=text)
