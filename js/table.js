//import { getStatus, formatBillion, formatPercent } from "./calculations.js";
import { getStatus, formatMillion, formatPercent } from "./calculations.js";

export function renderProjectTable(container, projects, options = {}) {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 15;
    const onDetail = options.onDetail ?? (() => {});

    const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);

    const start = (currentPage - 1) * pageSize;
    const pageItems = projects.slice(start, start + pageSize);

    if (!pageItems.length) {
        container.innerHTML = `<div class="empty">Không có dự án phù hợp.</div>`;
        return { currentPage, totalPages };
    }

    container.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Tên dự án</th>
                        <th>Mã dự án</th>
                        <th>KHV (Triệu)</th>
                        <th>Giải ngân (Triệu)</th>
                        <th>Tỷ lệ</th>
                        <th>Còn lại (Triệu)</th>
                        <th>Cán bộ Kỹ thuật</th>
                        <th>Trạng thái</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${pageItems.map(p => {
                        const status = getStatus(p);
                        return `
                            <tr>
                                <td>${p.stt}</td>
                                <td ><div class="project-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div></td>
                                <td class="muted">${escapeHtml(p.code)}</td>
                                <td class="table-number">${formatMillion(p.khv)}</td>
                                <td class="table-number">${formatMillion(p.paidTotal)}</td>
                                <td class="table-percent">${formatPercent(p.rateKHV ?? 0)}</td>
                                <td class="table-number">${formatMillion(p.remaining)}</td>
                                <td class="muted">${escapeHtml(p.officer || "—")}</td>
                                <td><span class="status ${status.key}">${status.label}</span></td>
                                <td>
                                    <button class="btn detail-btn" data-id="${p.id}">Chi tiết</button>
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>

        <div class="pagination">
            <span>Hiển thị ${start + 1}–${Math.min(start + pageSize, projects.length)} / ${projects.length} dự án</span>
            <div class="pagination-actions">
                <button class="btn" id="prevPage" ${currentPage <= 1 ? "disabled" : ""}>← Trước</button>
                <span class="btn">${currentPage} / ${totalPages}</span>
                <button class="btn" id="nextPage" ${currentPage >= totalPages ? "disabled" : ""}>Sau →</button>
            </div>
        </div>
    `;

    container.querySelectorAll(".detail-btn").forEach(btn => {
        btn.addEventListener("click", () => onDetail(btn.dataset.id));
    });

    return { currentPage, totalPages };
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
