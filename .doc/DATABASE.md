# Database Schema

Hệ thống sử dụng SQLAlchemy với các bảng dữ liệu có quan hệ chặt chẽ.

## 1. Các Model chính

### User
- Quản lý thông tin tài khoản, mật khẩu (hash) và múi giờ (`timezone`).

### Category (Phân tầng - Hierarchy Tree)
- `parent_id`: ID của danh mục cha (Hỗ trợ cấu trúc Cha-Con-Cháu).
- `color_bg`, `color_text`: Chứa các class Tailwind (Pastel Style).
- `get_root()`: Phương thức đệ quy để tìm danh mục cấp 1 cao nhất.

### TimeEntry (Bản ghi thời gian)
- Liên kết với `User`, `Category`, `TodoItem`.
- `is_running`: Flag đánh dấu bản ghi đang được bấm giờ.
- `is_pomodoro`: Flag đánh dấu chế độ Tập trung (Deep Work).
- `tags`: Quan hệ Many-to-Many với bảng `Tag`.

### Tag (Smart Tag)
- Liên kết Nhiều-Nhiều với `Category` (Bảng `category_tags`).
- Chỉ hiển thị gợi ý khi Category tương ứng được chọn.

### TodoItem (Việc cần làm)
- Liên kết bắt buộc với `Category`.
- `is_completed`: Trạng thái hoàn thành (do người dùng tự đánh dấu).

## 2. Các bảng trung gian (Many-to-Many)
- `category_tags`: Liên kết các Tag khả dụng cho mỗi Category.
- `entry_tags`: Lưu các Tag thực tế được gắn cho mỗi bản ghi thời gian.
