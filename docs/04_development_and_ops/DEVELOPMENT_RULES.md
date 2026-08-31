# ⚙️ Quy tắc Phát triển & Vận hành TimeHack (Development Rules)

Tài liệu này quy định các nguyên tắc bắt buộc dành cho lập trình viên và **AI Coding Assistant** khi phát triển và bảo trì **TimeHack**.

---

## 1. 🚫 Quy tắc Triệt để Không Dùng localStorage (No localStorage Directive)

* **YÊU CẦU BẮT BUỘC**: Tuyệt đối **KHÔNG** sử dụng `localStorage` hoặc `sessionStorage` của trình duyệt để lưu cấu hình, trạng thái giao diện, chế độ Pomodoro hoặc thông tin người dùng.
* **Đồng bộ Cơ sở Dữ liệu**: Mọi cấu hình cá nhân, theme, cài đặt thời gian Pomodoro, và Chat ID Telegram **PHẢI** được lưu trữ trong bảng `user_settings` thông qua API `/api/v1/auth/settings` và đồng bộ qua Zustand store để đảm bảo đồng nhất trên mọi thiết bị.

---

## 2. 🚫 Quy tắc Triển khai VPS & Không `npm run build` Trong AI Turn

* **KHÔNG chạy `npm run build` trong AI turn**: AI không được tự ý thực thi `npm run build` hoặc các tác vụ build nền gây tốn tài nguyên. Script `python remote_update_timehack.py` sẽ tự động kích hoạt `build_vite.py` khi chạy.
* **KHÔNG Polling/Lặp lệnh SSH**: Khi thực thi `python remote_update_timehack.py`, **KHÔNG** được polling kiểm tra trạng thái lặp lại liên tục. Sau khi kích hoạt script hoặc cập nhật code, hãy kết thúc câu trả lời và báo cáo ngắn gọn.

---

## 3. 🗄️ Quy tắc Thay đổi Database qua Alembic (Alembic Only Rule)

* **MỌI thay đổi Database Schema PHẢI qua Alembic**: Tuyệt đối **KHÔNG** viết script python ad-hoc hay can thiệp trực tiếp DB trên VPS. Mọi thay đổi schema hoặc dữ liệu seed đều phải tạo bản migration trong `migrations/versions/`.
* **Tự động Migrate khi Deploy**: `remote_update_timehack.py` luôn tự động thực thi `alembic upgrade head` trên VPS.
* **Hiển thị Log sau Restart**: Lệnh deploy trên VPS luôn hiển thị log gần nhất (`journalctl -u timehack -n 25 --no-pager`).

---

## 4. 🏛️ Kiến trúc Modular Monolith

* Giữ vững tính đóng gói của 8 module độc lập.
* Các module giao tiếp với nhau qua các Interface (`TaskInterface`, `HabitInterface`, `TimeTrackingInterface`).
* Không phụ thuộc vòng (circular imports).
