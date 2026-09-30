import Chart from "chart.js/auto";

const KINDS = {
    bezug: "Bezug (ID 742)",
    einspeisung: "Einspeisung (ID 735)",
};

export function findAnchor(eslReadings, kind, timestampMs) {
    let best = null;
    let bestTime = -Infinity;
    for (const r of eslReadings) {
        if (r.kind !== kind) continue;
        const t = Date.parse(r.timestamp);
        if (t <= timestampMs && t > bestTime) {
            best = r;
            bestTime = t;
        }
    }
    return best?.value ?? 0;
};

export function sdatToReadings(parsed, kind, startValue = 0) {
    const sorted = [...parsed.measurements].sort((a, b) => a.timestamp - b.timestamp);

    let total = startValue;
    const points = [{ timestamp: parsed.startDateTime, value: total, total, kind }];

    for (const m of sorted) {
        const delta = Number(m.relativeValue);
        if (!Number.isFinite(delta)) continue;
        total += delta;
        points.push({
            timestamp: new Date(m.endTimestamp ?? m.timestamp).toISOString(),
            value: total,
            total,
            kind,
        });
    }
    return points;
}

const SENSOR_KIND = {
    742: "bezug",
    735: "einspeisung",
};

export function sdatFilesToReadings(parsedFiles, eslReadings) {
    const measurementsByKind = new Map();

    for (const file of parsedFiles) {
        if (file.format !== "sdat") continue;
        const kind = SENSOR_KIND[file.data.sensorId];
        if (!kind) continue;

        const byTimestamp = measurementsByKind.get(kind) ?? new Map();
        for (const measurement of file.data.measurements) {
            byTimestamp.set(measurement.timestamp, measurement);
        }
        measurementsByKind.set(kind, byTimestamp);
    }

    const points = [];
    for (const [kind, byTimestamp] of measurementsByKind) {
        const sorted = [...byTimestamp.values()].sort((a, b) => a.timestamp - b.timestamp);
        if (sorted.length === 0) continue;

        let total = findAnchor(eslReadings, kind, sorted[0].timestamp);
        points.push({
            timestamp: new Date(sorted[0].timestamp).toISOString(),
            value: total,
            total,
            kind,
        });

        for (const measurement of sorted) {
            const delta = Number(measurement.relativeValue);
            if (!Number.isFinite(delta)) continue;
            total += delta;
            points.push({
                timestamp: new Date(measurement.endTimestamp ?? measurement.timestamp).toISOString(),
                value: total,
                total,
                kind,
            });
        }
    }

    return points;
}

export function mergeReadings(...lists) {
    const map = new Map();
    for (const r of lists.flat()) {
        map.set(`${r.kind}-${Date.parse(r.timestamp)}`, r);
    }
    return [...map.values()].sort(
        (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
    );
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
                    title: { display: true, text: "Zeit" },
                    ticks: {
                        callback: (value) => new Date(value).toLocaleTimeString("de-CH", {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                    },
                },
                y: {title: {display: true, text: "Zählerstand [kWh]"}},
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            return new Date(items[0].parsed.x).toLocaleString("de-CH");
                        },
                    },
                },
            },
        },
    })};
