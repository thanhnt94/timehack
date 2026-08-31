# ⏱️ Hướng dẫn Tính năng Tập trung, Thói quen & Nhiệm vụ

Tài liệu hướng dẫn nghiệp vụ các tính năng cốt lõi của **TimeHack**: Đồng hồ đếm giờ Pomodoro, Ma trận Eisenhower và Theo dõi Thói quen 7 ngày.

---

## 1. 🍅 Đồng hồ Đếm giờ Pomodoro & Stopwatch (`PomodoroFocus.tsx`)

`PomodoroFocus` là trung tâm quản lý sự tập trung cá nhân:

```
┌────────────────────────────────────────────────────────┐
│                   [ FOCUS SESSION ]                    │
│                                                        │
│                        24 : 58                         │
│                                                        │
│       [ ⏸️ Tạm dừng ]     [ 🔄 Đặt lại ]   [ ⏭️ Bỏ qua ]     │
│                                                        │
│  🎯 Đang làm: Hoàn thành báo cáo tuần (#Công việc)      │
│  🔔 Chế độ: 25m Focus • 5m Short Break • 15m Long Break│
└────────────────────────────────────────────────────────┘
```

* **FloatingTimerBar**: Thanh đồng hồ thu nhỏ ghim cố định ở đáy màn hình khi chuyển sang các trang khác, giúp người dùng không bao giờ mất dấu phiên làm việc.
* **Tự động lưu**: Kết thúc phiên sẽ tự động cộng dồn giây vào `spent_seconds` của Task và tạo bản ghi `TimeLog`.

---

## 2. 🗂️ Ma trận Eisenhower (`TasksBoard.tsx`)

Hệ thống phân loại công việc theo 4 góc phần tư:

| Góc Phần Tư | Mức Độ | Hành Động | Chiến Lược |
| :--- | :--- | :--- | :--- |
| **Q1: Do First** | Khẩn cấp & Quan trọng | Làm ngay lập tức | Tập trung tối đa, xử lý đầu tiên trong ngày |
| **Q2: Schedule** | Không khẩn cấp nhưng Quan trọng | Lên lịch thực hiện | Lập kế hoạch dài hạn, phát triển bản thân |
| **Q3: Delegate** | Khẩn cấp nhưng Không quan trọng | Ủy quyền / Tối ưu | Xử lý nhanh, giảm thời gian |
| **Q4: Eliminate** | Không khẩn cấp & Không quan trọng | Loại bỏ | Cắt giảm để tránh lãng phí thời gian |

---

## 3. ⚡ Ma trận Thói quen 7 Ngày (`HabitMatrix.tsx`)

Giao diện lưới trực quan theo dõi việc duy trì thói quen theo tuần:
* **Streak Counter**: Tự động tính chuỗi ngày liên tiếp hoàn thành thói quen.
* **One-Click Logging**: Chạm vào từng ô ngày (T2 - CN) để đánh dấu hoàn thành nhanh.
* **Weekly Progress Bar**: Hiển thị tỷ lệ hoàn thành mục tiêu trong tuần.
