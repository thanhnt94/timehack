# 🏗️ Cấu trúc Module Hệ thống TimeHack (Modular Monolith)

**TimeHack** được xây dựng theo kiến trúc **Modular Monolith (Hexagonal Style)**, phân chia ranh giới rõ ràng giữa 8 module Backend và giao diện React 19 Client.

---

## 1. Cấu trúc Tổng thể Thư mục (Directory Layout)

```
TimeHack/
├── app/                           # 🐍 Backend FastAPI & Core Modules
│   ├── core/                      # Cấu hình, Database Engine WAL, Bảo mật
│   │   ├── config.py              # Settings Pydantic & Biến môi trường
│   │   ├── database.py            # SQLite Async Engine & WAL Optimization
│   │   └── security.py            # Xác thực Cookie Chữ ký Số (HMAC)
│   ├── modules/                   # 8 Phân hệ Nghiệp vụ Độc lập
│   │   ├── auth/                  # Quản lý User, Thông tin cá nhân, Backdoor Login
│   │   ├── tasks/                 # Nhiệm vụ, Subtask, Danh mục & Eisenhower
│   │   ├── habits/                # Thói quen, Tần suất, HabitLog hàng ngày
│   │   ├── schedule/              # Lịch trình Time-Blocking, Khung giờ học/làm
│   │   ├── time_tracking/         # Đồng hồ Pomodoro, Stopwatch & TimeLog
│   │   ├── analytics/             # Báo cáo hiệu suất, Năng suất hàng ngày
│   │   ├── notifications/         # Thông báo hệ thống & Telegram Bot Service
│   │   └── sso_module/            # Tích hợp CentralAuth SSO, Signed Cookie, Handshake
│   ├── static/                    # Tệp phân phối Frontend sau khi build
│   └── main.py                    # Điểm khởi tạo FastAPI App & Middleware
│
├── client/                        # ⚛️ Frontend React 19 + TypeScript + Tailwind v4
│   ├── src/
│   │   ├── components/            # Sidebar, BottomNav, FloatingTimerBar
│   │   ├── pages/                 # TodayPlanner, TasksBoard, HabitMatrix, PomodoroFocus...
│   │   └── store/                 # Zustand Global Store (No-localStorage)
│   └── vite.config.ts             # Cấu hình Vite build ra app/static
│
├── migrations/                    # 🗄️ Quản lý Cơ sở dữ liệu qua Alembic
│   ├── versions/                  # Các tệp kịch bản Migration
│   └── env.py                     # Cấu hình Async Engine cho Alembic
│
├── docs/                          # 📚 Hệ thống Tài liệu Kỹ thuật Chuẩn
└── remote_update_timehack.py      # 🚀 Script Deploy VPS tự động
```

---

## 2. Chi tiết 8 Modules Backend

### 2.1. Module `tasks` (Quản lý Nhiệm vụ & Ma trận Eisenhower)
* **Models**: `Category`, `Task`, `Subtask`.
* **Interface (`interface.py`)**: `TaskInterface` cung cấp hàm đếm task, kiểm tra quyền sở hữu task cho các module khác.
* **Routes**: CRUD Danh mục, CRUD Task, đánh dấu hoàn thành, phân loại 4 góc Eisenhower (*Do First, Schedule, Delegate, Eliminate*).

### 2.2. Module `habits` (Theo dõi & Duy trì Thói quen)
* **Models**: `Habit`, `HabitLog`.
* **Interface (`interface.py`)**: `HabitInterface` cung cấp tổng hợp thói quen ngày, tính tỷ lệ hoàn thành.
* **Routes**: Tạo thói quen, cấu hình tần suất (hàng ngày, ngày trong tuần), ghi nhận log đánh dấu hoàn thành theo ngày (YYYY-MM-DD).

### 2.3. Module `time_tracking` (Đồng hồ Pomodoro & Ghi nhận Thời gian)
* **Models**: `TimeLog`.
* **Interface (`interface.py`)**: `TimeTrackingInterface` tính toán tổng thời lượng tập trung trong một khoảng thời gian.
* **Routes**: Ghi nhận phiên Pomodoro/Stopwatch, liên kết thời gian với Task hoặc Habit cụ thể.

### 2.4. Module `schedule` (Lập Lịch Time-Blocking)
* **Models**: `ScheduleSlot`.
* **Routes**: Tạo và quản lý các khung thời gian trong ngày (start_time, end_time), gắn task/habit vào lịch trình.

### 2.5. Module `analytics` (Thống kê Hiệu suất)
* **Routes**: Tổng hợp biểu đồ thời gian làm việc theo danh mục, tỷ lệ hoàn thành mục tiêu, xu hướng tập trung 7 ngày và 30 ngày.

### 2.6. Module `notifications` (Thông báo & Telegram Bot Hub)
* **Models**: `UserNotification`.
* **Service (`telegram_service.py`)**: Gửi thông báo đến CentralAuth Queue Worker (`satellite_source="timehack"`) hoặc trực tiếp qua Telegram Bot.
* **Routes**: Lấy danh sách thông báo, liên kết `telegram_chat_id`, gửi tin nhắn thử nghiệm.

### 2.7. Module `auth` (Xác thực & Thiết lập Người dùng)
* **Models**: `User`.
* **Routes**: `/api/v1/auth/me`, `/api/v1/auth/settings`, `/api/v1/auth/backdoor-login`, `/api/v1/auth/logout`.

### 2.8. Module `sso_module` (Single Sign-On CentralAuth)
* **Models**: `SSOConfig`.
* **Cookie Signer (`cookie_signer.py`)**: Ký và xác thực HMAC-SHA256 cho cookie `user_id`.
* **Routes**: `/api/v1/auth/config`, `/auth-center/callback`, `/api/admin/sso/handshake`.
