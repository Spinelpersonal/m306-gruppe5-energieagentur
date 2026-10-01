import Chart from "chart.js/auto";

const KINDS = {
    bezug: "Bezug (ID 742)",
    einspeisung: "Einspeisung (ID 735)",
};

export function mergeReadings(...lists) {
    const map = new Map();
    for (const r of lists.flat()) {
        map.set(`${r.kind}-${Date.parse(r.timestamp)}`, r);
    }
    return [...map.values()].sort(
        (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
    );
}

export function eslFilesToReadings(parsedFiles) {
    const eslReadings = parsedFiles
        .filter((file) => file.format === "esl")
        .flatMap((file) => file.data);

    return mergeReadings(eslReadings);
}

export function renderZaehlerstandChart(canvas, readings) {
    const datasets = Object.entries(KINDS).flatMap(([kind, label]) => {
        const data = readings
            .filter((r) => r.kind === kind)
            .map((r) => ({ x: Date.parse(r.timestamp), y: r.value }));
        if (data.length === 0) return [];
        return [{
            label,
            data,
            borderColor: kind === "bezug" ? "#087e8b" : "#d45c35",
            pointRadius: 0,
            borderWidth: 2,
            tension: 0,
        }];
    });

    return new Chart(canvas, {
        type: "line",
        data: {datasets},
        options: {
            parsing: false,
            animations: false,
            responsive: true,
            maintainAspectRatio: false,
            interaction: {mode: "nearest", intersect: false, axis: "x"},
            scales: {
                x: {
                    type: "linear",
                    offset: false,
                    bounds: "data",
                    title: { display: true, text: "Monat" },
                    ticks: {
                        callback: (value) =>
                            new Date(value).toLocaleDateString("de-CH", {
                                month: "short",
                                year: "numeric",
                                timeZone: "UTC",
                            }),
                    },
                },
                y: {title: {display: true, text: "Zählerstand [kWh]"}},
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            return new Date(items[0].parsed.x).toLocaleString("de-CH", {
                                month: "long",
                                year: "numeric",
                                timeZone: "UTC",
                            });
                        },
                    },
                },
            },
        },
    })};
