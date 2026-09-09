# Dashboard giải ngân 2026

## 1. Chạy project

Không cần npm/node ở phiên bản này.

1. Mở thư mục `dashboard-giai-ngan` bằng VS Code.
2. Cài extension **Live Server**.
3. Chuột phải `index.html` → **Open with Live Server**.
4. Mở `pages/tong-quan.html` hoặc bấm **Mở Dashboard**.

## 2. Cấu trúc

- `index.html`: trang chủ.
- `pages/`: 4 trang dashboard.
- `css/`: giao diện.
- `js/excel.js`: đọc Excel bằng SheetJS.
- `js/calculations.js`: các phép tính.
- `js/charts.js`: biểu đồ Chart.js.
- `js/table.js`: bảng, phân trang.
- `js/app.js`: điều phối các trang.
- `data/bao-cao.json`: dữ liệu dự phòng đã chuẩn hóa.
- `excel/BC giải ngân.xlsx`: file Excel nguồn.

## 3. Dữ liệu hiện tại

Sheet: `BAO CAO 31-07-2026`
Ngày báo cáo: `07/08/2026`
Số dự án đọc được: 57

Đơn vị gốc của Excel: triệu đồng.

## 4. Khi thay Excel

Thay file `excel/BC giải ngân.xlsx` bằng file mới và giữ đúng tên sheet
`BAO CAO 31-07-2026`. Sau đó refresh trang.

Nếu tên sheet hoặc cấu trúc cột thay đổi, sửa các vị trí cột trong `js/excel.js`.

## JavaScript tính tự động:

- tính tổng kế hoạch vốn
- tính tổng giải ngân
- tính % giải ngân
- tính số vốn còn lại
- xếp hạng dự án
- xác định dự án đạt / cần theo dõi / chậm
- tìm kiếm dự án
- lọc dự án
- biểu đồ theo dự án
- biểu đồ tỷ lệ giải ngân
- biểu đồ kế hoạch → giải ngân → còn lại
- hiển thị chi tiết khi click vào dự án.

**Trang 1 — Tổng quan**
Tổng KHV
Tổng giải ngân
% giải ngân
Còn phải giải ngân
Biểu đồ tiến độ

**Trang 2 — Phân tích dự án**
Top dự án giải ngân cao
Top dự án giải ngân thấp
Top dự án còn vốn lớn
Phân loại dự án theo mức độ

**Trang 3 — Chi tiết**
Tìm kiếm
Lọc
Sort
Click vào từng dự án để xem toàn bộ thông tin.

**Trang 4 — Theo dõi tiến độ**
KHV
Giải ngân kỳ trước
Giải ngân trong tuần
Lũy kế
Ước giải ngân
Khoảng cách cần hoàn thành.