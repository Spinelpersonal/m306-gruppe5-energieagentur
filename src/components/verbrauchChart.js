import Chart from "chart.js/auto";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const SERIES = [
    {
        key: "consumptionByTimestamp_ID742",
        label: "Bezug (ID 742)",
        borderColor: "#087e8b",
        backgroundColor: "rgba(8, 126, 139, 0.65)",
    },
    {
        key: "consumptionByTimestamp_ID735",
        label: "Einspeisung (ID 735)",
        borderColor: "#d45c35",
        backgroundColor: "rgba(212, 92, 53, 0.65)",
    },
];

const PERIOD_SETTINGS = {
    day: {
        xTitle: "Tag",
        yTitle: "Verbrauch pro Tag [kWh]",
    },
    week: {
        xTitle: "Kalenderwoche",
        yTitle: "Verbrauch pro Woche [kWh]",
    },
    month: {
        xTitle: "Monat",
        yTitle: "Verbrauch pro Monat [kWh]",
    },
};

function getBucketStart(timestamp, period) {
    const date = new Date(timestamp);

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    if (period === "month") {
        return Date.UTC(year, month, 1);
    }

    const start = new Date(Date.UTC(year, month, day));

    if (period === "week") {
        const daysSinceMonday = (start.getUTCDay() + 6) % 7;
        start.setUTCDate(start.getUTCDate() - daysSinceMonday);
    }

    return start.getTime();
}

function mapToPeriodPoints(values, period) {
    if (!(values instanceof Map)) return [];

    const totals = new Map();

    for (const [timestamp, value] of values) {
        const numericTimestamp = Number(timestamp);
        const numericValue = Number(value);

        if (
            !Number.isFinite(numericTimestamp) ||
            !Number.isFinite(numericValue)
        ) {
            continue;
        }

        const bucketStart = getBucketStart(numericTimestamp, period);

        totals.set(
            bucketStart,
            (totals.get(bucketStart) ?? 0) + numericValue
        );
    }

    return [...totals.entries()]
        .map(([timestamp, total]) => ({
            x: timestamp,
            y: total,
        }))
        .sort((a, b) => a.x - b.x);
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    });
}

function getIsoWeek(timestamp) {
    const date = new Date(timestamp);

    const thursday = new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
        )
    );

    const dayOfWeek = thursday.getUTCDay() || 7;
    thursday.setUTCDate(thursday.getUTCDate() + 4 - dayOfWeek);

    const isoYear = thursday.getUTCFullYear();
    const startOfYear = new Date(Date.UTC(isoYear, 0, 1));

    const week = Math.ceil(
        ((thursday.getTime() - startOfYear.getTime()) / DAY_IN_MS + 1) /
            7
    );

    return { week, year: isoYear };
}

function formatAxisLabel(timestamp, period) {
    const date = new Date(timestamp);

    if (period === "month") {
        return date.toLocaleDateString("de-CH", {
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        });
    }

    if (period === "week") {
        const { week, year } = getIsoWeek(timestamp);
        return `KW ${week}/${year}`;
    }

    return date.toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        timeZone: "UTC",
    });
}

function formatTooltipTitle(timestamp, period) {
    if (period === "month") {
        return new Date(timestamp).toLocaleDateString("de-CH", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        });
    }

    if (period === "week") {
        const endOfWeek = timestamp + 6 * DAY_IN_MS;
        const { week, year } = getIsoWeek(timestamp);

        return `KW ${week}/${year}: ${formatDate(timestamp)} – ${formatDate(
            endOfWeek
        )}`;
    }

    return formatDate(timestamp);
}

export function renderVerbrauchChart(
    canvas,
    consumptionByTimestamp,
    selectedPeriod = "week"
) {
    const period = PERIOD_SETTINGS[selectedPeriod]
        ? selectedPeriod
        : "week";

    const settings = PERIOD_SETTINGS[period];

    const datasets = SERIES.map((series) => ({
        label: series.label,
        data: mapToPeriodPoints(
            consumptionByTimestamp?.[series.key],
            period
        ),
        borderColor: series.borderColor,
        backgroundColor: series.backgroundColor,
        borderWidth: 1,
        maxBarThickness: 18,
        normalized: true,
    }));

    return new Chart(canvas, {
        type: "bar",
        data: { datasets },
        options: {
            devicePixelRatio: 1,
            parsing: false,
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "nearest",
                intersect: true,
                axis: "x",
            },
            scales: {
                x: {
                    type: "linear",
                    title: {
                        display: true,
                        text: settings.xTitle,
                    },
                    ticks: {
                        callback: (value) =>
                            formatAxisLabel(value, period),
                    },
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: settings.yTitle,
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (items) =>
                            formatTooltipTitle(
                                items[0].parsed.x,
                                period
                            ),
                        label: (item) => {
                            const value =
                                item.parsed.y.toLocaleString("de-CH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 3,
                                });

                            return `${item.dataset.label}: ${value} kWh`;
                        },
                    },
                },
            },
        },
    });
}