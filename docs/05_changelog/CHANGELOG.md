# 📝 Lịch sử Cập nhật & Nâng cấp TimeHack (Changelog)

Toàn bộ các mốc phát triển, nâng cấp kiến trúc và các bản vá lỗi của **TimeHack** được ghi nhận tại đây.

---

## 🚀 [2026-09-01] — Chuẩn Hóa Toàn Diện Theo Tiêu Chuẩn Vocaburn & Ecosystem

### 🏗️ Kiến trúc & Dọn dẹp Code
* **Xóa bỏ Code Rác**: Xóa hoàn toàn thư mục cũ `server/` và các module legacy `todo`, `time_logging` dùng Flask.
* **Chuẩn hóa Client Thư mục**: Đổi tên thư mục `frontend/` thành `client/` để đồng nhất với toàn bộ hệ sinh thái Ecosystem.
* **Kiến trúc Modular Monolith**: Phân rã toàn bộ Models về từng module chuyên trách (`auth`, `tasks`, `habits`, `schedule`, `time_tracking`, `notifications`, `settings`).
* **Đóng gói Interface**: Tạo các domain interface `TaskInterface`, `HabitInterface`, `TimeTrackingInterface` cho giao tiếp liên module.

### 🗄️ Cơ sở Dữ liệu & Alembic Migrations
* **Thiết lập Alembic Migrations**: Cấu hình `alembic.ini`, `migrations/env.py` hỗ trợ SQLAlchemy Async Engine và tạo bản migration ban đầu `0001_initial_timehack_schema.py`.
* **Chuyển Database về Thư mục Storage**: Cấu hình lưu trữ tại `Storage/database/TimeHack.db` và kích hoạt chế độ **SQLite WAL Mode** tăng tốc ghi đồng thời.
* **Tự động Migrate khi Deploy**: Cập nhật `remote_update_timehack.py` tự động chạy `alembic upgrade head` trên VPS.

### 🔒 Bảo Mật Xác Thực & SSO CentralAuth
* **Trang Landing Page & Cổng Đăng Nhập Đa Phương Thức**: Khởi tạo `LandingPage.tsx` tích hợp 1-click SSO CentralAuth, form đăng nhập nội bộ và nút đăng nhập nhanh quyền Admin (Backdoor), bảo vệ toàn bộ không gian làm việc trước khi xác thực.
* **Module `sso_module`**: Tích hợp luồng xác thực CentralAuth SSO, endpoint callback `/auth-center/callback`, và endpoint cấu hình `/api/v1/auth/config`.
* **Cookie Chữ Ký Số**: Triệt tiêu lỗ hổng giả mạo cookie với thuật toán HMAC-SHA256 trong `cookie_signer.py` và middleware `clean_user_id_cookie`.
* **Dynamic DB Discovery**: Bổ sung endpoint `POST /api/admin/sso/handshake` phục vụ CentralAuth Admin Hub.
* **Admin Backdoor**: Hỗ trợ cổng đăng nhập quản trị viên khẩn cấp `POST /api/v1/auth/backdoor-login` khi URL có `?backdoor=1`.

### 🤖 Thông báo Telegram
* **Dịch vụ `telegram_service.py`**: Hỗ trợ gửi thông báo qua CentralAuth Queue Hub (`satellite_source="timehack"`) và trực tiếp qua Bot Token.
* **Endpoint Thử nghiệm**: Bổ sung `POST /api/v1/notifications/telegram/test`.

### 📚 Hệ Thống Tài Liệu Kỹ Thuật
* Khởi tạo cây thư mục tài liệu kỹ thuật chuẩn mực `docs/` với 5 phân nhóm chuyên trách (`01_architecture`, `02_api_reference`, `03_features_and_ui`, `04_development_and_ops`, `05_changelog`) và trung tâm điều hướng `docs/README.md`.
