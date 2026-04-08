# TimeHack - Project Overview

**TimeHack** là một ứng dụng quản lý thời gian cá nhân (Time Ledger) được thiết kế theo phong cách di động bản địa (Native Mobile App) với triết lý tối giản, sang trọng và tập trung tối đa vào hiệu suất (Deep Work).

## 1. Triết lý Thiết kế (UI/UX)
- **Premium Wow**: Sử dụng Tailwind CSS với các hiệu ứng Kính mờ (Frosted Glass), Mesh Gradient và Bento Grid.
- **Apple/iOS Style**: Các góc bo tròn lớn (`rounded-[2rem]`, `rounded-3xl`), font chữ Inter sắc nét, màu sắc Pastel nhẹ nhàng nhưng có điểm nhấn đậm (Midnight Sapphire & Electric Teal).
- **Typography-First**: Hiển thị con số thời gian cực lớn, loại bỏ các chi tiết đồ họa dư thừa (như đồng hồ tròn) để người dùng tập trung vào con số.
- **Micro-interactions**: Phản hồi vật lý khi chạm (active:scale-95), hiệu ứng chuyển trang mượt mà.

## 2. Công nghệ lõi
- **Backend**: Python Flask (Application Factory Pattern).
- **Database**: SQLAlchemy (SQLite mặc định).
- **Frontend**: Jinja2 Templates + Tailwind CSS (JIT).
- **PWA**: Hỗ trợ cài đặt lên màn hình chính, hoạt động Full-screen, có Service Worker để cache tài nguyên.

## 3. Đối tượng sử dụng
Dành cho những người cần một "cuốn sổ cái" để ghi chép chính xác từng phút làm việc, đặc biệt là những người thực hành Deep Work và cần quản lý nhiều danh mục công việc phân tầng.
