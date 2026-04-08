# Project Architecture

TimeHack được xây dựng theo mô hình **Modular Monolith** sử dụng Flask Blueprints.

## 1. Cấu trúc thư mục
- `app/`: Thư mục gốc chứa mã nguồn.
    - `models/`: Chứa các SQLAlchemy Models (User, Category, TimeEntry, Tag, TodoItem).
    - `modules/`: Chứa các module chức năng chính (Blueprints).
        - `auth/`: Đăng nhập, Đăng ký.
        - `time_logging/`: Xử lý bấm giờ (Track) và Dashboard.
        - `analytics/`: Thống kê biểu đồ và Nhật ký lịch sử (History).
        - `todo/`: Quản lý danh sách việc cần làm.
        - `settings/`: Cài đặt Profile, Pomodoro và Danh mục.
    - `static/`: Chứa tài nguyên tĩnh (manifest.json, sw.js).
    - `templates/`: Giao diện Jinja2.
    - `utils/`: Các hàm hỗ trợ (Xử lý thời gian, Múi giờ).
- `run_timehack.py`: Entry point khởi chạy ứng dụng.
- `reset_db.py`: Script khởi tạo lại database và Seed dữ liệu mẫu.

## 2. Các quy ước quan trọng
- **Múi giờ (Timezone)**: Luôn lưu dữ liệu vào database dưới dạng **Naive UTC**. Chuyển đổi sang giờ địa phương của User bằng `current_user.timezone` ở lớp View/Template.
- **API Response**: Các API luôn trả về JSON dạng `{'status': 'ok', 'data': ...}` hoặc `{'status': 'error', 'message': ...}`.
- **Layout**: Sử dụng `base.html` làm layout tổng với hệ thống 5-tab Bottom Navigation phẳng.
