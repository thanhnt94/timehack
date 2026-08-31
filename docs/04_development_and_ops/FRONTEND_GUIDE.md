# ⚛️ Hướng dẫn Phát triển Frontend TimeHack (React 19 & Tailwind v4)

---

## 1. Công nghệ Frontend
* **Core**: React 19 + TypeScript + Vite.
* **Styling**: TailwindCSS v4 + Lucide Icons + Framer Motion.
* **State Management**: Zustand (Đồng bộ 2 chiều với Backend API `/api/v1/auth/settings`, **KHÔNG dùng localStorage**).
* **Routing**: React Router v7.

---

## 2. Cấu trúc Thư mục `client/`

```
client/
├── src/
│   ├── components/       # Component dùng chung (Sidebar, BottomNav, FloatingTimerBar)
│   ├── pages/            # 6 Màn hình chính SPA
│   │   ├── TodayPlanner.tsx           # Kế hoạch ngày hôm nay
│   │   ├── TasksBoard.tsx             # Bảng quản lý nhiệm vụ & Eisenhower
│   │   ├── HabitMatrix.tsx            # Ma trận theo dõi thói quen 7 ngày
│   │   ├── PomodoroFocus.tsx          # Đồng hồ đếm giờ tập trung
│   │   ├── TimeBlockingSchedule.tsx   # Lập lịch thời gian biểu
│   │   └── ProductivityAnalytics.tsx  # Thống kê & Báo cáo năng suất
│   ├── store/            # Quản lý Global State (Zustand)
│   ├── App.tsx           # Layout chính, Navigation & Floating Timer Bar
│   └── main.tsx          # Entrypoint React
└── vite.config.ts        # Output ra ../app/static
```

---

## 3. Quy trình Kiểm thử & Build

1. **Kiểm tra lỗi Type**:
   ```bash
   cd client
   npx tsc --noEmit
   ```
2. **Build tự động qua Python**:
   ```bash
   python build_vite.py
   ```
