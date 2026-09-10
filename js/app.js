
import { loadReport } from "./excel.js";
import {
    calculateRate,
    getStatus,
    formatBillion,
    formatMillion,
    formatPercent
} from "./calculations.js";
import {
    createProgressChart,
    createCategoryChart,
    createTopRemainingChart,
    createRateByProjectChart
} from "./charts.js";
import { renderProjectTable } from "./table.js";

let report = null;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadVersion();
        /* Đoạn debug để biết chính xác lỗi nằm ở đâu */
        report = await loadReport();

        console.log("========== REPORT ==========");
        console.log(report);
        console.log("source:", report?.source);
        console.log("sheetName:", report?.sheetName);
        console.log("reportDate:", report?.reportDate);
        console.log("projects:", report?.projects);
        console.log("project count:", report?.projects?.length);
        console.log("============================");

        document.body.classList.add("data-loaded");
        /* run web sau đó F12 → Console */

        const page = document.body.dataset.page;

        if (page === "overview") initOverview();
        if (page === "projects") initProjects();
        if (page === "progress") initProgress();
        if (page === "detail") initDetail();

    } catch (error) {
        console.error(error);
        showGlobalError(error.message);
    }
});

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function showGlobalError(message) {
    const box = document.getElementById("appError");
    if (!box) return;

    box.hidden = false;
    box.textContent =
        "Không tải được dữ liệu. Hãy kiểm tra bạn đang chạy bằng Live Server và file Excel nằm trong thư mục excel/. Chi tiết: " +
        message;
}

function renderCommonInfo() {
    setText("reportDate", report.reportDate);
    setText("sourceSheet", report.sheetName);
    setText("projectCount", report.projects.length);

    setText("reUpdated", report.reportDate);
}

async function loadVersion() {
    try {
        const response = await fetch("../data/version.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const version = await response.json();

        if (!version.updatedAt) {
            return;
        }

        const date = new Date(version.updatedAt);

        const formatted = date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            /*hour: "2-digit",
            minute: "2-digit"       -- hiển thị thêm giờ đổi thành date.toLocaleString(...)*/
        });

        setText("lastUpdated", formatted);

    } catch (error) {
        console.warn("Không đọc được version.json:", error);
    }
}

function initOverview() {
    renderCommonInfo();

    const projects = report.projects;
    const total = projects.reduce((a, p) => {
        a.khv += p.khv || 0;
        a.paid += p.paidTotal || 0;
        a.remaining += p.remaining || 0;
        a.period += p.paidPeriod || 0;
        return a;
    }, { khv: 0, paid: 0, remaining: 0, period: 0 });

    const rate = calculateRate(total.paid, total.khv);

    setText("totalKHV", `${formatBillion(total.khv)} tỷ`);
    setText("totalPaid", `${formatBillion(total.paid)} tỷ`);
    setText("totalRemaining", `${formatBillion(total.remaining)} tỷ`);
    setText("totalRate", formatPercent(rate));
    setText("periodPaid", `${formatMillion(total.period)} triệu`);

    const progress = document.getElementById("progressBar");
    if (progress) progress.style.width = `${Math.min(rate, 100)}%`;

    createProgressChart("progressChart", rate);

    const categories = {};
    projects.forEach(p => {
        if (!categories[p.category]) {
            categories[p.category] = { category: p.category, khv: 0, paid: 0 };
        }
        categories[p.category].khv += p.khv || 0;
        categories[p.category].paid += p.paidTotal || 0;
    });

    const categoryData = Object.values(categories)
        .sort((a, b) => b.khv - a.khv);

    createCategoryChart("categoryChart", categoryData);

    const topRemaining = [...projects]
        .sort((a, b) => (b.remaining || 0) - (a.remaining || 0))
        .slice(0, 8);

    createTopRemainingChart("remainingChart", topRemaining);

    renderRankList("topPaidList",
        [...projects].sort((a,b) => (b.rateKHV ?? 0) - (a.rateKHV ?? 0)).slice(0, 5),
        p => formatPercent(p.rateKHV ?? 0)
    );

    renderRankList("topRemainingList",
        topRemaining.slice(0, 5),
        p => `${formatBillion(p.remaining)} tỷ`
    );
}

function renderRankList(id, items, valueFn) {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerHTML = items.map((p, index) => `
        <li>
            <div class="rank">${index + 1}</div>
            <div class="rank-name">${escapeHtml(p.name)}</div>
            <div class="rank-value">${valueFn(p)}</div>
        </li>
    `).join("");
}

function initProjects() {
    renderCommonInfo();

    const search = document.getElementById("searchInput");
    const category = document.getElementById("categoryFilter");
    const status = document.getElementById("statusFilter");
    const table = document.getElementById("projectTable");
    let page = 1;

    const categories = [...new Set(report.projects.map(p => p.category))]
        .filter(Boolean)
        .sort();

    category.innerHTML =
        `<option value="all">Tất cả nhóm</option>` +
        categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

    function refresh() {
        const filtered = report.projects.filter(p => {
            const q = search.value.trim().toLowerCase();
            const matchQ =
                !q ||
                p.name.toLowerCase().includes(q) ||
                String(p.code).toLowerCase().includes(q);

            const matchCat =
                category.value === "all" || p.category === category.value;

            const matchStatus =
                status.value === "all" || getStatus(
                    p.rateKHV ?? 0,
                    p.capitalAdjustment ?? 0
                ).key === status.value;

            return matchQ && matchCat && matchStatus;
        });

        const result = renderProjectTable(table, filtered, {
            page,
            pageSize: 15,
            onDetail: id => {
                window.location.href = `chi-tiet.html?id=${encodeURIComponent(id)}`;
            }
        });

        page = result.currentPage;

        const prev = document.getElementById("prevPage");
        const next = document.getElementById("nextPage");

        prev?.addEventListener("click", () => {
            page--;
            refresh();
        });

        next?.addEventListener("click", () => {
            page++;
            refresh();
        });
    }

    search.addEventListener("input", () => { page = 1; refresh(); });
    category.addEventListener("change", () => { page = 1; refresh(); });
    status.addEventListener("change", () => { page = 1; refresh(); });

    refresh();
}

function initProgress() {
    renderCommonInfo();

    const projects = [...report.projects];

    createRateByProjectChart("rateChart", projects);

    const low = projects
        .filter(p => (p.khv || 0) > 0)
        .sort((a, b) => (a.rateKHV ?? 0) - (b.rateKHV ?? 0))
        .slice(0, 10);

    renderRankList(
        "slowProjects",
        low,
        p => formatPercent(p.rateKHV ?? 0)
    );

    const noDisbursement = projects.filter(p => (p.paidTotal || 0) === 0).length;
    const good = projects.filter(p => (p.rateKHV ?? 0) >= 70).length;
    const warning = projects.filter(p => (p.rateKHV ?? 0) >= 40 && (p.rateKHV ?? 0) < 70).length;
    const bad = projects.filter(p => (p.rateKHV ?? 0) > 0 && (p.rateKHV ?? 0) < 40).length;

    setText("countGood", good);
    setText("countWarning", warning);
    setText("countBad", bad);
    setText("countZero", noDisbursement);
}

function initDetail() {
    renderCommonInfo();

    const id = new URLSearchParams(window.location.search).get("id");
    const project = report.projects.find(p => String(p.id) === String(id));

    if (!project) {
        document.getElementById("detailContent").innerHTML =
            `<div class="empty">Không tìm thấy dự án. Hãy quay lại trang danh sách.</div>`;
        return;
    }

    const status = getStatus(project.rateKHV ?? 0);

    setText("detailTitle", project.name);
    setText("detailCode", project.code || "—");
    setText("detailCategory", project.category || "—");

    setText("detailKHV", `${formatBillion(project.khv)} tỷ`);
    setText("detailPaid", `${formatBillion(project.paidTotal)} tỷ`);
    setText("detailRate", formatPercent(project.rateKHV ?? 0));
    setText("detailRemaining", `${formatBillion(project.remaining)} tỷ`);
    setText("detailPrevious", `${formatBillion(project.paidPrevious)} tỷ`);
    setText("detailPeriod", `${formatBillion(project.paidPeriod)} tỷ`);
    setText("detailCommitRate", formatPercent(project.rateCommitment ?? 0));
    setText("detailEstimate", `${formatBillion(project.estimateMonth)} tỷ`);
    setText("detailOfficer", project.officer || "—");
    setText("detailStatus", status.label);

    const statusEl = document.getElementById("detailStatus");
    statusEl.className = `status ${status.key}`;

    setText("detailNote", project.note || "Không có ghi chú.");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
