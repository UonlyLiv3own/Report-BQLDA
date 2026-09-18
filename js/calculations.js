// formatMillion
export function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

// formatBillion
export function toBillion(value) {
    return safeNumber(value); // safeNumber(value) / 1000
}

export function calculateRate(paid, khv) {
    khv = safeNumber(khv);
    paid = safeNumber(paid);
    return khv > 0 ? (paid / khv) * 100 : 0;
}

export function calculateRemaining(khv, paid) {
    return Math.max(0, safeNumber(khv) - safeNumber(paid));
}

export function getStatus(project) {
    if (!project) return { key: "none", label: "Chưa giải ngân" };

    const khv = safeNumber(project.khv);
    const paidTotal = safeNumber(project.paidTotal);
    const capitalAdjustment = safeNumber(project.capitalAdjustment);

    // 1. Ưu tiên trạng thái Giảm vốn
    if (capitalAdjustment < 0) {
        return { label: "Giảm vốn", key: "reduction" };
    }

    // 2. Tự tính lại Tỷ lệ % nếu trong Excel bị trống hoặc = 0
    let rate = safeNumber(project.rateKHV ?? project.rate);
    if (rate === 0 && khv > 0 && paidTotal > 0) {
        rate = (paidTotal / khv) * 100;
    }

    // 3. Xét tiến độ theo Tỷ lệ đã được tính lại
    if (rate >= 70) {
        return { key: "good", label: "Đạt tiến độ" };
    }

    if (rate >= 40) {
        return { key: "warning", label: "Cần theo dõi" };
    }

    // Nếu đã có giải ngân tiền (> 0) nhưng tỷ lệ thấp
    if (rate > 0 || paidTotal > 0) {
        return { key: "bad", label: "Chậm tiến độ" };
    }

    // Chỉ khi thực sự chưa giải ngân đồng nào
    return { key: "none", label: "Chưa giải ngân" };
}

export function summarize(projects) {
    const total = projects.reduce((acc, p) => {
        acc.khv += safeNumber(p.khv);
        acc.paidPrevious += safeNumber(p.paidPrevious);
        acc.paidPeriod += safeNumber(p.paidPeriod);
        acc.paidTotal += safeNumber(p.paidTotal);
        acc.estimateMonth += safeNumber(p.estimateMonth);
        acc.remaining += safeNumber(p.remaining);
        return acc;
    }, {
        khv: 0,
        paidPrevious: 0,
        paidPeriod: 0,
        paidTotal: 0,
        estimateMonth: 0,
        remaining: 0
    });

    total.rateKHV = calculateRate(total.paidTotal, total.khv);
    return total;
}

export function filterProjects(projects, { search = "", category = "all", status = "all" } = {}) {
    const q = search.trim().toLowerCase();

    return projects.filter(p => {
        const matchSearch =
            !q ||
            p.name.toLowerCase().includes(q) ||
            String(p.code).toLowerCase().includes(q);

        const matchCategory =
            category === "all" || p.category === category;

        const matchStatus =
            status === "all" || getStatus(p.rateKHV, p.capitalAdjustment).key === status;

        return matchSearch && matchCategory && matchStatus;
    });
}


export function formatMillion(value) {
    return `${safeNumber(value).toLocaleString("vi-VN", {
        //minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })}`;
}


export function formatBillion(value) {
    return `${toBillion(value).toLocaleString("vi-VN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
    })}`;
    /*return new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 2
    }).format(safeNumber(value) / 1000);*/
}

export function formatPercent(value) {
    return `${safeNumber(value).toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}%`;
}

// Thêm hàm giới hạn chính xác số ký tự hiển thị ở trang chi tiết
export function truncateString(str, maxLength = 100) {
    if (!str) return "";
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
}