from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.modules.auth.models import User
from app.modules.settings.models import UserSettings

router = APIRouter(prefix="/api/v1/user/settings", tags=["UserSettings"])

DEFAULT_POMODORO_SETTINGS = {
    "work_duration": 25,
    "short_break": 5,
    "long_break": 15,
    "sessions_before_long_break": 4,
    "auto_start_breaks": False,
    "auto_start_pomodoros": False,
    "sound_enabled": True,
    "ambient_sound": "none",
    "theme": "dark"
}

@router.get("")
async def get_user_settings(request: Request, db: AsyncSession = Depends(get_db)):
    """Fetch user settings (Pomodoro, audio, theme, notifications)."""
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = res.scalar_one_or_none()

    settings_dict = dict(DEFAULT_POMODORO_SETTINGS)
    if user_sett and user_sett.settings:
        settings_dict.update(user_sett.settings)

    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalar_one_or_none()
    if user and user.timezone:
        settings_dict["timezone"] = user.timezone

    return {
        "status": "ok",
        "settings": settings_dict
    }

@router.post("")
async def save_user_settings(payload: Dict[str, Any], request: Request, db: AsyncSession = Depends(get_db)):
    """Save/update user settings (persisted in DB, zero localStorage)."""
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    res = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    user_sett = res.scalar_one_or_none()

    if not user_sett:
        user_sett = UserSettings(user_id=user_id, settings=payload)
        db.add(user_sett)
    else:
        existing = dict(user_sett.settings) if user_sett.settings else {}
        existing.update(payload)
        user_sett.settings = existing

    # Synchronize User.timezone if present
    if "timezone" in payload and payload["timezone"]:
        u_res = await db.execute(select(User).where(User.id == user_id))
        user = u_res.scalar_one_or_none()
        if user:
            user.timezone = str(payload["timezone"]).strip()

    await db.commit()
    await db.refresh(user_sett)

    return {
        "status": "ok",
        "settings": user_sett.settings
    }

from datetime import date, datetime
from sqlalchemy import delete
from app.models import Category, Task, Habit, HabitLog, ScheduleSlot, TimeLog

@router.post("/reset-sample-data")
async def reset_user_sample_data(request: Request, db: AsyncSession = Depends(get_db)):
    """Clear messy user test data and seed a pristine, realistic sample dataset."""
    user_id = get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated")

    today_date = date.today()
    today_iso = today_date.isoformat()

    # 1. Clear old user data (slots, logs, habits, habit_logs, tasks, categories)
    await db.execute(delete(ScheduleSlot).where(ScheduleSlot.user_id == user_id))
    await db.execute(delete(TimeLog).where(TimeLog.user_id == user_id))
    await db.execute(delete(HabitLog).where(HabitLog.user_id == user_id))
    await db.execute(delete(Habit).where(Habit.user_id == user_id))
    await db.execute(delete(Task).where(Task.user_id == user_id))
    await db.execute(delete(Category).where(Category.user_id == user_id))
    await db.commit()

    # 2. Create clean pristine Categories
    cat_coding = Category(user_id=user_id, name="Lập trình & Kỹ thuật", color="#8B5CF6", category_type="productive", icon="code")
    cat_work = Category(user_id=user_id, name="Công việc & Dự án", color="#3B82F6", category_type="productive", icon="briefcase")
    cat_study = Category(user_id=user_id, name="Học tập & Ngoại ngữ", color="#10B981", category_type="productive", icon="book")
    cat_health = Category(user_id=user_id, name="Sức khỏe & Thể thao", color="#F59E0B", category_type="productive", icon="activity")
    cat_lifestyle = Category(user_id=user_id, name="Thói quen & Đời sống", color="#EC4899", category_type="productive", icon="smile")
    
    db.add_all([cat_coding, cat_work, cat_study, cat_health, cat_lifestyle])
    await db.flush()

    # 3. Create realistic Habits with specific reminder_time
    habit1 = Habit(
        user_id=user_id,
        category_id=cat_health.id,
        title="Uống 500ml nước ấm & Thiền định",
        description="Khởi động tâm trí và tuần hoàn buổi sáng",
        frequency_type="daily",
        time_of_day="morning",
        reminder_time="06:30",
        target_count=1,
        unit="lần",
        color="#10B981",
        icon="droplets"
    )
    habit2 = Habit(
        user_id=user_id,
        category_id=cat_health.id,
        title="Chạy bộ / Thể dục 30 phút",
        description="Rèn luyện thể lực và sức bền",
        frequency_type="daily",
        time_of_day="morning",
        reminder_time="07:00",
        target_count=30,
        unit="phút",
        color="#F59E0B",
        icon="activity"
    )
    habit3 = Habit(
        user_id=user_id,
        category_id=cat_work.id,
        title="Lập kế hoạch 3 việc quan trọng nhất",
        description="Xác định rõ trọng tâm trước khi bắt đầu làm việc",
        frequency_type="daily",
        time_of_day="morning",
        reminder_time="08:45",
        target_count=1,
        unit="lần",
        color="#8B5CF6",
        icon="target"
    )
    habit4 = Habit(
        user_id=user_id,
        category_id=cat_lifestyle.id,
        title="Đi bộ giãn cơ & Uống nước",
        description="Nghỉ giải lao buổi chiều, bảo vệ cột sống và mắt",
        frequency_type="daily",
        time_of_day="afternoon",
        reminder_time="15:00",
        target_count=1,
        unit="lần",
        color="#3B82F6",
        icon="coffee"
    )
    habit5 = Habit(
        user_id=user_id,
        category_id=cat_study.id,
        title="Đọc 20 trang sách chuyên môn",
        description="Học hỏi kiến thức mới trước khi ngủ",
        frequency_type="daily",
        time_of_day="evening",
        reminder_time="21:30",
        target_count=20,
        unit="trang",
        color="#6366F1",
        icon="book"
    )
    db.add_all([habit1, habit2, habit3, habit4, habit5])
    await db.flush()

    # Past 4 days streak logs for habits
    for i in range(1, 5):
        past_day = today_date - timedelta(days=i)
        db.add(HabitLog(habit_id=habit1.id, user_id=user_id, logged_date=past_day, completed=True, count=1))
        db.add(HabitLog(habit_id=habit2.id, user_id=user_id, logged_date=past_day, completed=True, count=30))
        db.add(HabitLog(habit_id=habit3.id, user_id=user_id, logged_date=past_day, completed=True, count=1))
        db.add(HabitLog(habit_id=habit4.id, user_id=user_id, logged_date=past_day, completed=True, count=1))
        db.add(HabitLog(habit_id=habit5.id, user_id=user_id, logged_date=past_day, completed=True, count=20))

    # Today habit completions for morning habits
    db.add(HabitLog(habit_id=habit1.id, user_id=user_id, logged_date=today_date, completed=True, count=1))
    db.add(HabitLog(habit_id=habit2.id, user_id=user_id, logged_date=today_date, completed=True, count=30))
    db.add(HabitLog(habit_id=habit3.id, user_id=user_id, logged_date=today_date, completed=True, count=1))

    # 4. Create Tasks with Deadlines & Subtasks
    task1 = Task(
        user_id=user_id,
        category_id=cat_coding.id,
        title="Hoàn thiện tính năng Calendar TimeHack v2",
        description="Tối ưu timeline kế hoạch, dọn sạch actual logs và tích hợp nhắc nhở thói quen",
        priority="urgent",
        due_date=datetime.combine(today_date, datetime.strptime("17:00", "%H:%M").time()),
        status="in_progress",
        estimated_minutes=120,
        spent_seconds=5400
    )
    task2 = Task(
        user_id=user_id,
        category_id=cat_coding.id,
        title="Review Pull Request & Tối ưu Database Indexing",
        description="Đánh index trường date và user_id cho schedule_slots",
        priority="high",
        due_date=datetime.combine(today_date, datetime.strptime("11:30", "%H:%M").time()),
        status="completed",
        estimated_minutes=60,
        spent_seconds=3600
    )
    task3 = Task(
        user_id=user_id,
        category_id=cat_work.id,
        title="Họp đồng bộ tiến độ Sprint với Team",
        description="Báo cáo milestone tuần và chốt deadline phát hành",
        priority="high",
        due_date=datetime.combine(today_date, datetime.strptime("14:00", "%H:%M").time()),
        status="completed",
        estimated_minutes=60,
        spent_seconds=3600
    )
    task4 = Task(
        user_id=user_id,
        category_id=cat_study.id,
        title="Ôn tập 30 từ vựng Vocaburn & Đọc System Design",
        description="Duy trì chuỗi học ngoại ngữ và củng cố kiến thức kiến trúc hệ thống",
        priority="medium",
        due_date=datetime.combine(today_date, datetime.strptime("22:00", "%H:%M").time()),
        status="todo",
        estimated_minutes=45,
        spent_seconds=0
    )
    task5 = Task(
        user_id=user_id,
        category_id=cat_work.id,
        title="Thiết kế Dashboard Thống kê Hiệu suất Tuần",
        description="Tích hợp biểu đồ phân bố thời gian theo Value Category",
        priority="medium",
        due_date=datetime.combine(today_date + timedelta(days=1), datetime.strptime("16:00", "%H:%M").time()),
        status="todo",
        estimated_minutes=90,
        spent_seconds=0
    )

    db.add_all([task1, task2, task3, task4, task5])
    await db.flush()

    # Subtasks for Task 1
    sub1 = Subtask(task_id=task1.id, title="Loại bỏ actual logs khỏi timeline calendar", is_completed=True)
    sub2 = Subtask(task_id=task1.id, title="Tích hợp habit reminders hiển thị theo giờ", is_completed=True)
    sub3 = Subtask(task_id=task1.id, title="Kiểm thử kéo thả và nạp dữ liệu mẫu", is_completed=False)
    db.add_all([sub1, sub2, sub3])

    # 5. Schedule Plan Slots for Today
    slot1 = ScheduleSlot(
        user_id=user_id,
        date=today_date,
        start_time="07:00",
        end_time="08:00",
        title="🏃 Chạy bộ & Thể dục sáng",
        notes="Khởi động ngày mới tràn đầy năng lượng",
        category_id=cat_health.id,
        is_done=True
    )
    slot2 = ScheduleSlot(
        user_id=user_id,
        date=today_date,
        start_time="09:00",
        end_time="11:30",
        title="💻 Deep Work: Phát triển Core Engine TimeHack",
        notes="Tập trung cao độ 2.5h không ngắt quãng",
        category_id=cat_coding.id,
        is_done=True
    )
    slot3 = ScheduleSlot(
        user_id=user_id,
        date=today_date,
        start_time="14:00",
        end_time="15:00",
        title="💼 Họp Sprint Review & Kế hoạch tuần",
        notes="Trình bày roadmap tính năng mới",
        category_id=cat_work.id,
        is_done=True
    )
    slot4 = ScheduleSlot(
        user_id=user_id,
        date=today_date,
        start_time="16:00",
        end_time="17:30",
        title="💻 Code Review & Tối ưu hóa hiệu năng API",
        notes="Refactor query & giảm độ trễ response",
        category_id=cat_coding.id,
        is_done=False
    )
    slot5 = ScheduleSlot(
        user_id=user_id,
        date=today_date,
        start_time="20:00",
        end_time="21:00",
        title="📚 Học tiếng Anh & Đọc sách System Design",
        notes="20 trang sách + luyện phát âm Vocaburn",
        category_id=cat_study.id,
        is_done=False
    )
    db.add_all([slot1, slot2, slot3, slot4, slot5])

    # 6. Actual TimeLogs
    yesterday = today_date - timedelta(days=1)
    log1 = TimeLog(
        user_id=user_id,
        category_id=cat_health.id,
        start_time=datetime.combine(today_date, datetime.strptime("07:05", "%H:%M").time()),
        end_time=datetime.combine(today_date, datetime.strptime("07:50", "%H:%M").time()),
        duration_seconds=2700,
        timer_type="stopwatch",
        notes="🏃 Chạy 5km công viên buổi sáng"
    )
    log2 = TimeLog(
        user_id=user_id,
        task_id=task1.id,
        category_id=cat_coding.id,
        start_time=datetime.combine(today_date, datetime.strptime("09:05", "%H:%M").time()),
        end_time=datetime.combine(today_date, datetime.strptime("11:35", "%H:%M").time()),
        duration_seconds=9000,
        timer_type="pomodoro",
        notes="💻 Deep work: Thiết kế Calendar & Habit Reminders"
    )
    log3 = TimeLog(
        user_id=user_id,
        task_id=task3.id,
        category_id=cat_work.id,
        start_time=datetime.combine(today_date, datetime.strptime("14:00", "%H:%M").time()),
        end_time=datetime.combine(today_date, datetime.strptime("15:00", "%H:%M").time()),
        duration_seconds=3600,
        timer_type="manual",
        notes="💼 Họp sprint demo tính năng với team"
    )
    log4 = TimeLog(
        user_id=user_id,
        category_id=cat_coding.id,
        start_time=datetime.combine(yesterday, datetime.strptime("10:00", "%H:%M").time()),
        end_time=datetime.combine(yesterday, datetime.strptime("12:00", "%H:%M").time()),
        duration_seconds=7200,
        timer_type="pomodoro",
        notes="💻 Refactor database schema & backend API"
    )
    log5 = TimeLog(
        user_id=user_id,
        category_id=cat_study.id,
        start_time=datetime.combine(yesterday, datetime.strptime("20:00", "%H:%M").time()),
        end_time=datetime.combine(yesterday, datetime.strptime("21:30", "%H:%M").time()),
        duration_seconds=5400,
        timer_type="pomodoro",
        notes="📚 Học 50 từ vựng Vocaburn & Đọc System Design"
    )
    db.add_all([log1, log2, log3, log4, log5])

    await db.commit()

    return {
        "status": "ok",
        "message": "Sample data seeded successfully"
    }
