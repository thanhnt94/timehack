# 📡 Đặc tả REST API TimeHack (API Reference)

Tất cả các API của **TimeHack** đều tuân thủ chuẩn RESTful, trả về dữ liệu định dạng **JSON** và sử dụng tiền tố `/api/v1/`.

---

## 1. 🔑 Xác thực & SSO CentralAuth (`/api/v1/auth`, `SSO Integration`)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/auth/config` | Lấy cấu hình SSO (CentralAuth Jump URL, Provider) |
| `GET` | `/auth-center/callback` | Điểm tiếp nhận OAuth code từ CentralAuth SSO |
| `POST` | `/api/admin/sso/handshake` | API Dynamic Discovery DB Path cho CentralAuth Hub |
| `GET` | `/api/v1/auth/me` | Lấy thông tin tài khoản hiện tại và cài đặt |
| `POST` | `/api/v1/auth/settings` | Cập nhật cấu hình người dùng (No-localStorage) |
| `POST` | `/api/v1/auth/backdoor-login` | Đăng nhập khẩn cấp nội bộ (`?backdoor=1`) |
| `POST` | `/api/v1/auth/logout` | Đăng xuất và xóa cookie `user_id` |

---

## 2. 📝 Quản lý Nhiệm vụ & Danh mục (`/api/v1/tasks`)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/tasks/categories` | Lấy danh sách danh mục phân loại của người dùng |
| `POST` | `/api/v1/tasks/categories` | Tạo danh mục mới |
| `DELETE` | `/api/v1/tasks/categories/{cat_id}` | Xóa danh mục |
| `GET` | `/api/v1/tasks` | Lấy danh sách Task (lọc theo priority, status, eisenhower) |
| `POST` | `/api/v1/tasks` | Tạo Task mới |
| `PATCH` | `/api/v1/tasks/{task_id}` | Cập nhật thông tin Task |
| `DELETE` | `/api/v1/tasks/{task_id}` | Xóa Task |
| `POST` | `/api/v1/tasks/{task_id}/subtasks` | Thêm Subtask mới vào Task |
| `PATCH` | `/api/v1/tasks/subtasks/{subtask_id}` | Cập nhật trạng thái hoàn thành Subtask |
| `DELETE` | `/api/v1/tasks/subtasks/{subtask_id}` | Xóa Subtask |

---

## 3. ⚡ Quản lý Thói quen (`/api/v1/habits`)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/habits` | Lấy danh sách Thói quen và nhật ký 7 ngày gần nhất |
| `POST` | `/api/v1/habits` | Tạo thói quen mới |
| `PATCH` | `/api/v1/habits/{habit_id}` | Chỉnh sửa thói quen |
| `DELETE` | `/api/v1/habits/{habit_id}` | Xóa / Lưu trữ thói quen |
| `POST` | `/api/v1/habits/{habit_id}/log` | Ghi nhận tiến độ / Đánh dấu hoàn thành theo ngày |

---

## 4. ⏱️ Ghi nhận Thời gian & Pomodoro (`/api/v1/time-tracking`)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/time-tracking/logs` | Lấy lịch sử các phiên tập trung |
| `POST` | `/api/v1/time-tracking/logs` | Ghi nhận phiên Pomodoro/Stopwatch vừa hoàn thành |
| `DELETE` | `/api/v1/time-tracking/logs/{log_id}` | Xóa bản ghi thời gian |

---

## 5. 📅 Lập Lịch Lịch Trình (`/api/v1/schedule`)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/schedule?date=YYYY-MM-DD` | Lấy danh sách khung giờ đã lên lịch theo ngày |
| `POST` | `/api/v1/schedule` | Tạo khung giờ Time-Blocking mới |
| `PATCH` | `/api/v1/schedule/{slot_id}` | Cập nhật khung giờ hoặc trạng thái hoàn thành |
| `DELETE` | `/api/v1/schedule/{slot_id}` | Xóa khung giờ |

---

## 6. 📊 Thống kê Hiệu suất (`/api/v1/analytics`)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/summary` | Tổng hợp thời gian tập trung, số task đã xong, streak |
| `GET` | `/api/v1/analytics/category-distribution` | Phân bố thời lượng theo từng danh mục |
| `GET` | `/api/v1/analytics/weekly-trend` | Xu hướng năng suất 7 ngày qua |

---

## 7. 🔔 Thông báo & Telegram (`/api/v1/notifications`)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Lấy 30 thông báo gần nhất |
| `PATCH` | `/api/v1/notifications/{id}/read` | Đánh dấu đã đọc thông báo |
| `POST` | `/api/v1/notifications/telegram/link` | Liên kết Telegram Chat ID |
| `POST` | `/api/v1/notifications/telegram/test` | Gửi thông báo kiểm tra đến Telegram |
