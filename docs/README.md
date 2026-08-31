# 📚 Trung tâm Tài liệu Kỹ thuật TimeHack (Documentation Hub)

Chào mừng bạn đến với **Trung tâm Tài liệu Kỹ thuật Duy nhất (Single Source of Truth)** của dự án **TimeHack — All-In-One Productivity Platform**. Toàn bộ tài liệu được phân loại khoa học thành 5 phân nhóm chuyên trách dưới đây:

---

## 🧭 Cây Thư mục & Mục lục Điều hướng

```
docs/
├── 01_architecture/              # 🏗️ Kiến trúc Hệ thống & Cơ sở Dữ liệu
│   ├── MODULE_STRUCTURE.md       # Cấu trúc 8 Modules Backend Modular Monolith & Client SPA
│   ├── DATABASE_STRUCTURE.md     # Cấu trúc 10 Bảng Cơ sở Dữ liệu & Quy chuẩn Storage
│   └── ECOSYSTEM_INTEGRATION.md  # Tích hợp SSO CentralAuth, Handshake API & Telegram Hub
│
├── 02_api_reference/             # 📡 Đặc tả REST API
│   └── API_REFERENCE.md          # Danh mục toàn bộ REST API Endpoints (/api/v1/...)
│
├── 03_features_and_ui/           # 🎴 Tính năng Nghiệp vụ & Giao diện
│   └── TIME_TRACKING_AND_HABITS_GUIDE.md # Hướng dẫn Pomodoro Timer, Ma trận Eisenhower & Habits
│
├── 04_development_and_ops/       # ⚙️ Quy chuẩn Phát triển & Vận hành
│   ├── DEVELOPMENT_RULES.md      # Quy tắc Planning Mode, No-localStorage, Alembic & Deploy
│   └── FRONTEND_GUIDE.md         # Hướng dẫn React 19, TypeScript, Tailwind v4 & Zustand
│
└── 05_changelog/                 # 📝 Lịch sử Nâng cấp & Bản vá
    └── CHANGELOG.md              # Nhật ký chi tiết các đợt phát triển & cập nhật
```

---

## 📖 Chi tiết Các Nhóm Tài liệu

### 1. 🏗️ [Kiến trúc & Cơ sở Dữ liệu](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/01_architecture/)
* **[MODULE_STRUCTURE.md](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/01_architecture/MODULE_STRUCTURE.md)**: Chi tiết kiến trúc Modular Monolith của 8 module Backend (`auth`, `tasks`, `habits`, `schedule`, `time_tracking`, `analytics`, `notifications`, `sso_module`) và các trang React 19 SPA Client.
* **[DATABASE_STRUCTURE.md](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/01_architecture/DATABASE_STRUCTURE.md)**: Đặc tả chi tiết 10 bảng SQLAlchemy models, bao gồm bảng `user_settings` (No-localStorage), quản lý task, subtask, thói quen, lịch trình và nhật ký tập trung.
* **[ECOSYSTEM_INTEGRATION.md](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/01_architecture/ECOSYSTEM_INTEGRATION.md)**: Hướng dẫn kết nối Single Sign-On với CentralAuth (port 5000), cơ chế Dynamic DB Discovery Handshake, Telegram Notification Hub và cổng dự phòng Admin Backdoor (`?backdoor=1`).

---

### 2. 📡 [Đặc tả REST API](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/02_api_reference/)
* **[API_REFERENCE.md](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/02_api_reference/API_REFERENCE.md)**: Bảng tra cứu toàn diện 100% REST Endpoints dưới tiền tố `/api/v1/`: Tasks, Categories, Habits, Time Tracking (Pomodoro), Schedule Slots, Analytics, Notifications và SSO.

---

### 3. 🎴 [Tính năng Nghiệp vụ & Giao diện](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/03_features_and_ui/)
* **[TIME_TRACKING_AND_HABITS_GUIDE.md](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/03_features_and_ui/TIME_TRACKING_AND_HABITS_GUIDE.md)**: Hướng dẫn chi tiết về các chế độ đếm giờ Pomodoro, Ma trận quản lý công việc Eisenhower và Ma trận theo dõi thói quen 7 ngày.

---

### 4. ⚙️ [Quy chuẩn Phát triển & Vận hành](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/04_development_and_ops/)
* **[DEVELOPMENT_RULES.md](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/04_development_and_ops/DEVELOPMENT_RULES.md)**: Bộ quy tắc bắt buộc cho lập trình viên và AI Coding Agent: quy trình Planning Mode, tuyệt đối không dùng localStorage, di cư DB qua Alembic và quy định không polling SSH khi deploy VPS.
* **[FRONTEND_GUIDE.md](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/04_development_and_ops/FRONTEND_GUIDE.md)**: Hướng dẫn phát triển giao diện React 19 + TypeScript + TailwindCSS v4, quản lý state Zustand đồng bộ backend và quy trình đóng gói `build_vite.py`.

---

### 5. 📝 [Nhật ký Chỉnh sửa](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/05_changelog/)
* **[CHANGELOG.md](file:///c:/Users/thanh/OneDrive/CodeHub/Ecosystem/TimeHack/docs/05_changelog/CHANGELOG.md)**: Ghi nhận lịch sử chi tiết tất cả các phiên bản nâng cấp, tái cấu trúc và các bản vá lỗi của TimeHack.
