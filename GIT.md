## chỉ cần setup 1 lần duy nhất cho lần đầu tiên push code lên github
git config --global user.email "email_cua_ban@example.com"
git config --global user.name "Ten Cua Ban"

## create a new repository
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/UonlyLiv3own/**repositoryName**.git
git push -u origin main

## UPDATE BC GIẢI NGÂN

**SỬA MỚI:**
const EXCEL_PATH = "../report/bao-cao01.xlsx";

const targetSheetName = "BAO CAO 25-09-2026";

*Cập nhật chỉ số cột (Column Index) trong hàm normalizeRows*
- Tỷ lệ % KHV ở Cột Q (Index 16)
- Tỷ lệ Cam kết ở Cột R (Index 17)
- Mã dự án ở Cột C (Index 2)
- Tên dự án ở Cột B (Index 1)
- Cột J, K, L (Index 9, 10, 11) chứa các QĐ điều chỉnh mới
- Cột M - TỔNG KHV NĂM 2026 ĐÃ GIAO (Index 12)
- Cột N - Số giải ngân đến cuối kỳ trước (Index 13)
- Cột O - Số giải ngân trong tuần (Index 14)
- Cột P - TỔNG SỐ GIẢI NGÂN ĐẾN NGÀY BÁO CÁO (Index 15)
...
- Cột AG - Cán bộ Kỹ thuật (Index 32)
- Cột AH - Ghi chú (Index 33)

excel.js => **findReportDate** 25-09-2026
index.html => **baocao** 25-09-2026