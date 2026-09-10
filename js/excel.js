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
// tìm thời gian ước chi trên báo cáo
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

function normalizeRows(rows) {
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

        const rateKHV = typeof row[26] === "number"
            ? row[26] * 100
            : null;

        const rateCommitment = typeof row[27] === "number"
            ? row[27] * 100
            : null;

        data.push({
            id: row[2] || `project-${i}`, // lấy mã dự án làm id hệ thống
            stt: data.length + 1,   // auto render cột STT 
            name: String(row[1]).trim(),
            code: row[2] == null ? "" : String(row[2]).trim(),
            category,
            // Cột U - điều chỉnh/giảm vốn
            capitalAdjustment: numberOrZero(row[20]),
            khv: numberOrZero(row[22]),
            paidPrevious: numberOrZero(row[23]),
            paidPeriod: numberOrZero(row[24]),
            paidTotal: numberOrZero(row[25]),
            rateKHV,
            rateCommitment,
            estimateMonth: numberOrZero(row[28]),
            remainingMonth: numberOrZero(row[29]),
            remaining: numberOrZero(row[31]),
            estimateFuture1: numberOrZero(row[32]),
            estimateFuture2: numberOrZero(row[33]),
            estimateTo15Jan: numberOrZero(row[34]),
            estimateTo31May: numberOrZero(row[35]),
            remainingOldRule: numberOrZero(row[36]),
            rateOldRule: typeof row[37] === "number" ? row[37] * 100 : null,
            paidRemaining: numberOrZero(row[39]),
            officer: row[40] == null ? "" : String(row[40]).trim()
            /* note: row[40] == null ? "" : String(row[40]).trim() */
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

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new Error("Không tìm thấy sheet trong file Excel.");
    }

    const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        raw: true
    });

    const projects = normalizeRows(rows);
    const reportDate = findReportDate(rows);
    const estimateMonth = findEstimateMonth(rows);

    return {
        source: "excel",
        sheetName,
        reportDate,
        estimateMonth,
        unit: "triệu đồng",
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
