
const charts = {};
const COLORS = {
    KHV: "#509edf",
    KHV2: "#0c4d83",
    GN: "#e07272",
    GN2: "#860f0f",
    green: "#16A34A",
    yellow: "#EAB308",
    orange1: "#f5af7e",
    orange2: "#F97316",
    red: "#DC2626",
    lightGray: "#cdd4df",
    darkGray: "#313335",
};

function destroyIfExists(id) {
    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }
}

function create(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === "undefined") return null;

    destroyIfExists(id);

    charts[id] = new Chart(canvas, config);
    return charts[id];
}

function formatTy(value, maximumFractionDigits = 2) {
    return `${(Number(value || 0) / 1000).toLocaleString("vi-VN", {
        maximumFractionDigits
    })} tỷ`;
}

function statusColor(rate) {
    const value = Number(rate) || 0;
    if (value >= 70) return COLORS.green;
    if (value >= 40) return COLORS.yellow;
    if (value > 0) return COLORS.red;
    return COLORS.gray;
}

/* biểu đồ tròn */
export function createProgressChart(id, rate) {
    const safeRate = Math.min(100, Math.max(0, Number(rate) || 0));
    const remaining = 100 - safeRate;

    return create(id, {
        type: "doughnut",
        data: {
            labels: ["Đã giải ngân", "Còn lại"],
            datasets: [{
                data: [safeRate, remaining],
                
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            animation: {
                duration: 900
            },
            plugins: {
                legend: { 
                    position: "bottom",
                    labels: {                        
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 18
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${ctx.raw.toFixed(2)}%`
                    }
                }
            }
        }
    });
}
/* biểu đồ cột đôi */
export function createCategoryChart(id, categoryData) {
    return create(id, {
        type: "bar",
        data: {
            labels: categoryData.map(x => x.category),
            datasets: [
                {
                    label: "KHV",
                    data: categoryData.map(x => x.khv),
                    backgroundColor: COLORS.KHV,
                    borderColor: COLORS.KHV,
                    hoverBackgroundColor: COLORS.KHV2,
                    borderWidth: 1,
                    borderRadius: 4,
                    maxBarThickness: 34
                },
                {
                    label: "Giải ngân",
                    data: categoryData.map(x => x.paid),
                    backgroundColor: COLORS.GN,
                    borderColor: COLORS.GN,
                    hoverBackgroundColor: COLORS.GN2,
                    borderWidth: 1,
                    borderRadius: 4,
                    maxBarThickness: 34
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 30,
                        autoSkip: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(100, 116, 139, 0.12)"
                    },
                    ticks: {
                        /*callback: value => `${(value / 1000).toLocaleString("vi-VN")} tỷ`*/
                        callback: value => formatTy(value, 0)
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {                        
                        usePointStyle: true,
                        pointStyle: "rectRounded",
                        padding: 18
                    }
                },
                tooltip: {
                    callbacks: {
                        /*label: ctx => `${ctx.dataset.label}: ${(ctx.raw / 1000).toLocaleString("vi-VN", {maximumFractionDigits: 2})} tỷ`*/
                        label: ctx => `${ctx.dataset.label}: ${formatTy(ctx.raw)}`
                    }
                }
            }
        }
    });
}
/* biểu đồ cột ngang */
export function createTopRemainingChart(id, projects) {
    return create(id, {
        type: "bar",
        data: {
            labels: projects.map(x => x.name),
            datasets: [{
                label: "Còn phải giải ngân",
                data: projects.map(x => x.remaining),
                backgroundColor: COLORS.orange1,
                borderColor: COLORS.orange1,
                borderWidth: 1,
                borderRadius: 4,
                hoverBackgroundColor: COLORS.orange2, /* hover */
                maxBarThickness: 28
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(100, 116, 139, 0.12)"
                    },
                    ticks: {
                        /*callback: value => `${(value / 1000).toLocaleString("vi-VN")} tỷ`*/
                        callback: value => formatTy(value, 0)
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: COLORS.darkGray
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        /*label: ctx => `${(ctx.raw / 1000).toLocaleString("vi-VN", {maximumFractionDigits: 2})} tỷ`*/
                        label: ctx => formatTy(ctx.raw)
                    }
                }
            }
        }
    });
}
/* biểu đồ tiến độ */
export function createRateByProjectChart(id, projects) {
    const rates = projects.map(x => Number(x.rateKHV ?? 0));
    const colors = rates.map(statusColor);

    return create(id, {
        type: "bar",
        data: {
            labels: projects.map(x => x.name),
            datasets: [{
                label: "Tỷ lệ giải ngân",
                data: rates,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1,
                borderRadius: 4,
                maxBarThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: COLORS.darkGray,
                        autoSkip: true,
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: "rgba(100, 116, 139, 0.12)"
                    },
                    ticks: {
                        callback: value => `${value}%`
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        /*label: ctx => `${ctx.raw.toFixed(2)}%`*/
                        label: ctx => `${Number(ctx.raw).toFixed(2)}%`
                    }
                }
            }
        }
    });
}
