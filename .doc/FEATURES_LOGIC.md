# Core Features & Logic

Tài liệu này giải thích logic xử lý của các tính năng phức tạp nhất.

## 1. Hệ thống Bấm giờ (Timer Logic)
- **Cơ chế**: Không chỉ dùng `setInterval`. Khi bấm Start, thời gian bắt đầu tuyệt đối được lưu vào Database và Client.
- **Background Sync**: Sử dụng API `visibilitychange`. Khi người dùng quay lại app sau khi tắt màn hình, JS lấy `(Giờ hiện tại - Giờ bắt đầu)` để cập nhật UI ngay lập tức, đảm bảo độ chính xác 100% bất kể trình duyệt đóng băng JS.
- **Phân luồng**: Có 2 chế độ "Theo Todo" (ẩn ô Category) và "Việc tự do" (hiện ô Category + Note).

## 2. Hệ thống Smart Tag
- **Context-aware**: Danh sách Tag gợi ý thay đổi động dựa trên `category_id` đang chọn.
- **UX**: Chế độ chọn nhanh dạng Chip (Multi-select) tích hợp trong cả trang Track và Modal sửa History.

## 3. Nhật ký thời gian (Time Ledger Style)
- **Group by Date**: Dữ liệu được nhóm theo ngày địa phương. Header mỗi ngày hiển thị tổng số giờ làm việc.
- **Gap Detection**: Hệ thống tự động tính toán các khoảng thời gian trống giữa 2 bản ghi liên tiếp. Hiển thị dưới dạng ô "Khoảng trống" (Dashed box). Nhấn vào để điền nhanh dữ liệu mà không bị trùng lịch (Overlap).
- **Edit/Add Logic**: Modal thống nhất cho cả sửa bản ghi cũ và điền khoảng trống. Hỗ trợ chọn Ngày/Giờ bắt đầu và Ngày/Giờ kết thúc (Xử lý xuyên đêm).

## 4. Quản lý Danh mục (Hierarchical Settings)
- **Tree View**: Hiển thị danh mục theo cấp bậc Cha - Con bằng thụt lề và đường kẻ nối (Tree-line).
- **Phân loại Tag**: Giao diện trong Settings cho phép định nghĩa một Tag sẽ xuất hiện ở những danh mục nào.

## 5. Thống kê & Xuất dữ liệu
- **Heatmap**: Biểu đồ nhiệt 365 ngày (giống GitHub) để theo dõi Streak làm việc.
- **Export**: Xuất toàn bộ dữ liệu ra file CSV theo chuẩn báo cáo.
