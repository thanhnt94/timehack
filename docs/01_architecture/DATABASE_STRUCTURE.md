# 🗄️ Cấu trúc Cơ sở Dữ liệu TimeHack (Database Structure)

Hệ thống Cơ sở Dữ liệu của **TimeHack** được xây dựng dựa trên **SQLite** tối ưu hóa ghi đồng thời với chế độ **Write-Ahead Logging (WAL)**. Quản lý cấu trúc bảng, quan hệ ORM và di cư dữ liệu được thực thi bất đồng bộ qua **SQLAlchemy Async ORM** (`AsyncSession`) và **Alembic Migrations**.

* **Vị trí tệp cơ sở dữ liệu mặc định**: `Storage/database/TimeHack.db` (lưu trữ tại thư mục Storage dùng chung của Ecosystem).
* **Quy chuẩn Không localStorage**: Toàn bộ cấu hình cá nhân, theme, thời gian Pomodoro, và Telegram Chat ID đều được lưu trữ trực tiếp tại bảng `user_settings`.

---

## 1. Danh sách 10 Bảng Cơ sở Dữ liệu

### 1. `users` (`app/modules/auth/models.py`)
Bảng chứa thông tin tài khoản người dùng (đồng bộ từ CentralAuth hoặc tạo cục bộ).
* `id` (INTEGER, Khóa chính, Index): ID định danh người dùng.
* `central_auth_id` (INTEGER, UNIQUE, Index, NULL): ID liên kết CentralAuth.
* `username` (VARCHAR(100), UNIQUE, Index): Tên đăng nhập.
* `email` (VARCHAR(255), UNIQUE, Index): Email.
* `full_name` (VARCHAR(255)): Họ và tên hiển thị.
* `avatar_url` (TEXT): Đường dẫn ảnh đại diện.
* `role` (VARCHAR(50), default: 'user'): Vai trò tài khoản (`admin` | `user`).
* `created_at` (DATETIME): Thời điểm tạo tài khoản.

---

### 2. `categories` (`app/modules/tasks/models.py`)
Danh mục phân loại công việc và thói quen (Công việc, Học tập, Sức khỏe...).
* `id` (INTEGER, Khóa chính, Index).
* `user_id` (INTEGER, Khóa ngoại `users.id`, Index, Non-null).
* `name` (VARCHAR(100)): Tên danh mục.
* `color` (VARCHAR(50), default: '#8B5CF6'): Mã màu HEX.
* `icon` (VARCHAR(50), default: 'folder'): Tên biểu tượng Lucide.
* `is_default` (BOOLEAN, default: False): Đánh dấu danh mục mặc định.
* `created_at` (DATETIME).

---

### 3. `tasks` (`app/modules/tasks/models.py`)
Nhiệm vụ cần thực hiện với phân loại 4 góc Ma trận Eisenhower.
* `id` (INTEGER, Khóa chính, Index).
* `user_id` (INTEGER, Khóa ngoại `users.id`, Index, Non-null).
* `category_id` (INTEGER, Khóa ngoại `categories.id`, NULL, SET NULL).
* `title` (VARCHAR(255)): Tiêu đề nhiệm vụ.
* `description` (TEXT): Mô tả chi tiết.
* `priority` (VARCHAR(20), default: 'medium'): Mức độ ưu tiên (`low` | `medium` | `high` | `urgent`).
* `status` (VARCHAR(20), default: 'todo'): Trạng thái (`todo` | `in_progress` | `completed`).
* `eisenhower` (VARCHAR(20), default: 'schedule'): Ma trận Eisenhower (`do_first` | `schedule` | `delegate` | `eliminate`).
* `estimated_minutes` (INTEGER, default: 30): Thời gian dự tính (phút).
* `spent_seconds` (INTEGER, default: 0): Tổng giây đã dành cho task.
* `due_date` (DATETIME, NULL): Hạn chót.
* `completed_at` (DATETIME, NULL): Thời điểm hoàn thành.
* `order_index` (INTEGER, default: 0): Thứ tự sắp xếp.
* `created_at` (DATETIME), `updated_at` (DATETIME).

---

### 4. `subtasks` (`app/modules/tasks/models.py`)
Nhiệm vụ con bên trong Task chính.
* `id` (INTEGER, Khóa chính, Index).
* `task_id` (INTEGER, Khóa ngoại `tasks.id`, ON DELETE CASCADE, Index).
* `title` (VARCHAR(255)): Tên nhiệm vụ con.
* `is_completed` (BOOLEAN, default: False): Trạng thái hoàn thành.
* `created_at` (DATETIME).

---

### 5. `habits` (`app/modules/habits/models.py`)
Thói quen cần xây dựng và duy trì hàng ngày/hàng tuần.
* `id` (INTEGER, Khóa chính, Index).
* `user_id` (INTEGER, Khóa ngoại `users.id`, Index, Non-null).
* `category_id` (INTEGER, Khóa ngoại `categories.id`, NULL).
* `title` (VARCHAR(255)): Tên thói quen.
* `description` (TEXT): Mô tả thói quen.
* `frequency_type` (VARCHAR(20), default: 'daily'): Tần suất (`daily` | `weekly_days` | `interval`).
* `weekly_days` (JSON, NULL): Danh sách các ngày trong tuần (ví dụ `[0,1,2,3,4,5,6]`).
* `target_count` (INTEGER, default: 1): Mục tiêu số lần/ngày.
* `unit` (VARCHAR(50), default: 'lần'): Đơn vị đo lường.
* `reminder_time` (VARCHAR(10), NULL): Giờ nhắc nhở (ví dụ `08:00`).
* `icon` (VARCHAR(50), default: 'zap'): Biểu tượng.
* `color` (VARCHAR(50), default: '#10B981'): Mã màu.
* `archived` (BOOLEAN, default: False): Đã lưu trữ hay chưa.
* `created_at` (DATETIME).

---

### 6. `habit_logs` (`app/modules/habits/models.py`)
Nhật ký ghi nhận tiến độ thói quen theo từng ngày.
* `id` (INTEGER, Khóa chính, Index).
* `habit_id` (INTEGER, Khóa ngoại `habits.id`, ON DELETE CASCADE, Index).
* `user_id` (INTEGER, Khóa ngoại `users.id`, Index).
* `logged_date` (DATE, Non-null): Ngày ghi nhận (YYYY-MM-DD).
* `count` (INTEGER, default: 1): Số lượng hoàn thành.
* `completed` (BOOLEAN, default: True): Đạt mục tiêu ngày hay chưa.
* `notes` (TEXT): Ghi chú.
* `created_at` (DATETIME).
* **Ràng buộc Unique**: `UNIQUE(habit_id, logged_date)`.

---

### 7. `schedule_slots` (`app/modules/schedule/models.py`)
Các khung thời gian đã được lên lịch trong ngày (Time Blocking).
* `id` (INTEGER, Khóa chính, Index).
* `user_id` (INTEGER, Khóa ngoại `users.id`, Index).
* `date` (DATE, Non-null, Index): Ngày lên lịch (YYYY-MM-DD).
* `start_time` (VARCHAR(10)): Giờ bắt đầu (`09:00`).
* `end_time` (VARCHAR(10)): Giờ kết thúc (`10:30`).
* `title` (VARCHAR(255)): Nội dung lịch trình.
* `task_id` (INTEGER, NULL), `habit_id` (INTEGER, NULL), `category_id` (INTEGER, NULL).
* `is_done` (BOOLEAN, default: False).
* `notes` (TEXT).
* `created_at` (DATETIME).

---

### 8. `time_logs` (`app/modules/time_tracking/models.py`)
Nhật ký các phiên tập trung Pomodoro, Stopwatch hoặc nhập thủ công.
* `id` (INTEGER, Khóa chính, Index).
* `user_id` (INTEGER, Khóa ngoại `users.id`, Index).
* `task_id` (INTEGER, NULL), `habit_id` (INTEGER, NULL), `category_id` (INTEGER, NULL).
* `start_time` (DATETIME): Thời điểm bắt đầu.
* `end_time` (DATETIME): Thời điểm kết thúc.
* `duration_seconds` (INTEGER, default: 0): Số giây tập trung thực tế.
* `timer_type` (VARCHAR(20), default: 'pomodoro'): Loại đồng hồ (`pomodoro` | `stopwatch` | `manual`).
* `notes` (TEXT): Ghi chú phiên tập trung.
* `created_at` (DATETIME).

---

### 9. `user_notifications` (`app/modules/notifications/models.py`)
Thông báo trong ứng dụng.
* `id` (INTEGER, Khóa chính, Index).
* `user_id` (INTEGER, Khóa ngoại `users.id`, Index).
* `title` (VARCHAR(255)): Tiêu đề thông báo.
* `message` (TEXT): Nội dung thông báo.
* `type` (VARCHAR(50), default: 'system'): Phân loại (`task` | `habit` | `schedule` | `system`).
* `is_read` (BOOLEAN, default: False): Đã đọc hay chưa.
* `created_at` (DATETIME).

---

### 10. `user_settings` (`app/modules/settings/models.py`)
Lưu trữ toàn bộ cài đặt giao diện, cấu hình Pomodoro và kết nối Telegram (No-localStorage).
* `id` (INTEGER, Khóa chính, Index).
* `user_id` (INTEGER, Khóa ngoại `users.id`, UNIQUE, Index, Non-null).
* `settings` (JSON): Chứa các trường:
  * `theme`: `light` | `dark`.
  * `pomodoro_duration`: Thời lượng Pomodoro (mặc định 25 phút).
  * `short_break_duration`: Thời lượng nghỉ ngắn (mặc định 5 phút).
  * `long_break_duration`: Thời lượng nghỉ dài (mặc định 15 phút).
  * `auto_start_breaks`: Tự động chuyển phiên nghỉ.
  * `telegram_chat_id`: ID chat Telegram nhận thông báo.
  * `sound_enabled`: Âm thanh chuông báo.
* `updated_at` (DATETIME).
