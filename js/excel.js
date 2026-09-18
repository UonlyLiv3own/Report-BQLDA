const EXCEL_PATH = "../report/bao-cao.xlsx";
const JSON_PATH = "../data/bao-cao.json";

function numberOrZero(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function findHeaderRow(rows) {
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
        const text = rows[i].map(v => String(v ?? "").toUpperCase()).join(" | ");
        if (text.includes("TÊN DA TRONG") && text.includes("TỔNG") && text.includes("TỶ LỆ")) {
            return i;
        }
    }
    return 9; // dòng Excel 10 nếu index tính từ 0
}
// tìm ngày trên báo cáo
function findReportDate(rows) {
    for (const row of rows) {
        for (const cell of row) {
            if (cell == null) continue;

            const text = String(cell);

            const match = text.match(
                /Tính đến ngày\s+(\d{1,2}\/\d{1,2}\/\d{4})/i
            );

            if (match) {
                return match[1];
            }
        }
    }

    return "Không xác định";
}
// Tìm nhãn ước chi tháng trong phần tiêu đề Excel
function findEstimateMonth(rows) {
    for (const row of rows) {
        for (const cell of row) {
            if (cell == null) continue;

            const text = String(cell);

            const match = text.match(
                /Ước chi.*?tháng\s+(\d{1,2}\/\d{4})/i
            );

            if (match) return match[1];
        }
    }

    return "Không xác định";
}

// Các tiêu đề QĐ hiện nằm ở dòng ngay dưới nhóm tiêu đề chính.
function findCapitalDecisionColumns(rows, headerIndex) {
    // Không khóa cứng cột O-V: tự tìm mọi cột có tiêu đề bắt đầu bằng "QĐ".
    const columns = [];
    // Quét rộng từ dòng headerIndex - 2 đến headerIndex + 4
    const startRow = Math.max(0, headerIndex - 2);
    const endRow = Math.min(rows.length, headerIndex + 5);

    for (let r = startRow; r < endRow; r++) {
        const row = rows[r] || [];

        // Quét từ cột M (index 12) trở đi (thay vì cố định cột O index 14)
        for (let col = 12; col < row.length; col++) {
            const header = String(row[col] ?? "").replace(/\s+/g, " ").trim();

            // Nhận diện linh hoạt: "QĐ, QD, Quyết định, Qđ,..." ko phân biệt hoa thường
            if (/^(QĐ|QD|Quyết định|ĐC|Điều chỉnh)\b/i.test(header)) {
                // Tránh thêm trùng cột nếu đã quét trúng ở dòng trên
                if (!columns.some(c => c.index === col)) {
                    columns.push({ index: col, label: header });
                }
            }
        }

        if (columns.length) break;
    }

    return columns;
}
function getCapitalPlanHistory(row, decisionColumns) {
    return decisionColumns
        .map(item => ({
            label: item.label,
            value: numberOrZero(row[item.index])
        }))
        .filter(item => item.value !== 0);
}

function findSection(row, current) {
    const a = row[0];
    const b = row[1];

    if (typeof a === "string" && b && !row[2]) {
        const text = String(b).trim();
        if (
            text.toUpperCase().includes("DỰ ÁN") ||
            text.toUpperCase().includes("CÔNG TRÌNH") ||
            text.toUpperCase().includes("DA")
        ) {
            return text;
        }
    }
    return current;
}

function normalizeRows(rows, decisionColumns) {
    const headerIndex = findHeaderRow(rows);
    const data = [];
    let category = "Khác";

    for (let i = headerIndex + 2; i < rows.length; i++) {
        const row = rows[i] || [];
        category = findSection(row, category);

        // điều kiện dữ liệu hiển thị: STT phải là số thực sự tồn tại, tên dự án phải là chuỗi
        if (
            row[0] == null ||
            row[0] === "" ||
            !Number.isFinite(Number(row[0])) || !row[1] || typeof row[1] !== "string") { continue;
        }

        // Tính lại tỷ lệ % KHV ở Cột AC (Index 28)
        const rateKHV = typeof row[27] === "number"
            ? row[27] * 100
            : null;

        const rateCommitment = typeof row[28] === "number"
            ? row[28] * 100
            : null;

        data.push({
            id: row[2] || `project-${i}`, // lấy mã dự án làm id hệ thống
            stt: data.length + 1,   // auto render cột STT
            capitalPlan: getCapitalPlanHistory(row, decisionColumns),
            name: String(row[1]).trim(),
            code: row[2] == null ? "" : String(row[2]).trim(),
            category,
            // Cột U - Điều chỉnh vốn (Index 20)
            capitalAdjustment: numberOrZero(row[20]),
            // Cột W - KHV đã giao (Index 22)
            khv: numberOrZero(row[22]),
            // Cột X - Giải ngân kỳ trước (Index 23)
            paidPrevious: numberOrZero(row[23]),
            // Cột Y + Z - Giải ngân trong tuần (Index 24 + 25)
            paidPeriod: numberOrZero(row[24]) + numberOrZero(row[25]),
            // Cột AA - Tổng giải ngân đến ngày BC (Index 26)
            paidTotal: numberOrZero(row[26]),
            rateKHV,
            rateCommitment,
            // Cột AD - Ước chi tháng (Index 29)
            estimateMonth: numberOrZero(row[29]),
            // Cột AE - Số đã chi trong tháng (Index 30)
            remainingMonth: numberOrZero(row[30]),
            // Cột AI - Số còn phải giải ngân so với ngày BC (Index 34)
            remaining: numberOrZero(row[34]),
            // Cột AJ, AK (Index 35, 36)
            estimateFuture1: numberOrZero(row[35]),
            estimateFuture2: numberOrZero(row[36]),
            // Cột AL, AM (Index 37, 38)
            estimateTo15Jan: numberOrZero(row[37]),
            estimateTo31May: numberOrZero(row[38]),
            // Cột AN, AO (Index 39, 40)
            remainingOldRule: numberOrZero(row[39]),
            rateOldRule: typeof row[40] === "number" ? row[40] * 100 : null,
            // Cột AQ - Số tiền còn phải giải ngân (Index 42)
            paidRemaining: numberOrZero(row[42]),
            // Cột AR - Cán bộ kỹ thuật (Index 43)
            officer: row[43] == null ? "" : String(row[43]).trim(),
            // Cột AS - Ghi chú (Index 44)
            note: row[44] == null ? "" : String(row[44]).trim()
        });
    }

    return data;
}

export async function loadReportFromExcel() {
    if (typeof XLSX === "undefined") {
        throw new Error("SheetJS chưa được tải.");
    }

    const response = await fetch(encodeURI(EXCEL_PATH), { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Không đọc được Excel: HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    //const sheetName = workbook.SheetNames[0];
    //const sheet = workbook.Sheets[sheetName];

    // Chọn sheet "BAO CAO 18-09-2026" nếu có, hoặc lấy sheet cuối cùng thay vì sheet đầu tiên
    const targetSheetName = "BAO CAO 18-09-2026";
    const sheetName = workbook.SheetNames.includes(targetSheetName)
        ? targetSheetName
        : workbook.SheetNames[workbook.SheetNames.length - 1]; // Lấy sheet mới nhất ở cuối

    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new Error("Không tìm thấy sheet trong file Excel.");
    }

    const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        raw: true
    });

    const headerIndex = findHeaderRow(rows);
    const decisionColumns = findCapitalDecisionColumns(rows, headerIndex);
    const reportDate = findReportDate(rows);
    const estimateMonth = findEstimateMonth(rows);
    const projects = normalizeRows(rows, decisionColumns);

    return {
        source: "excel",
        sheetName,
        reportDate,
        estimateMonth,
        unit: "triệu đồng",
        capitalDecision: decisionColumns,
        projects
    };
}

export async function loadReportFromJson() {
    const response = await fetch(JSON_PATH, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Không đọc được JSON: HTTP ${response.status}`);
    }

    const json = await response.json();

    return {
        source: "json",
        sheetName: json.meta?.sourceSheet || json.meta?.sheetName || "Không xác định",
        reportDate: json.meta?.reportDate || "Không xác định",
        estimateMonthLabel: "Không xác định",
        capitalDecisionColumns: [],
        unit: json.meta?.unit || "triệu đồng",
        projects: json.projects || []
    };
}

export async function loadReport() {
    try {
        return await loadReportFromExcel();
    } catch (excelError) {
        console.warn("Excel không đọc được, chuyển sang JSON:", excelError);
        return await loadReportFromJson();
    }
}
