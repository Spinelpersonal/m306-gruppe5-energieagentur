import { useEffect, useMemo, useRef, useState } from "react";
import { renderZaehlerstandChart } from "./zaehlerstandChart.js";

const VIEWS = [
    { id: "beide", label: "Beide" },
    { id: "bezug", label: "Bezug" },
    { id: "einspeisung", label: "Einspeisung" },
];

export default function ZaehlerstandChart({ readings }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    const [view, setView] = useState("beide");
    const visibleReadings = useMemo(
        () => view === "beide"
            ? readings
            : readings.filter((reading) => reading.kind === view),
        [readings, view]
    );

    useEffect(() => {
        if (!canvasRef.current || visibleReadings.length === 0) return;

        const chart = renderZaehlerstandChart(canvasRef.current, visibleReadings);
        chartRef.current = chart;

        return () => {
            chart.destroy();
            chartRef.current = null;
        };
    }, [visibleReadings]);

    function saveScreenshot() {
        if (!chartRef.current) return;

        const link = document.createElement("a");
        link.download = "zaehlerstaende.png";
        link.href = chartRef.current.toBase64Image("image/png");
        link.click();
    }

    return (
        <section aria-label="Absolute Zählerstände">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <h2>{VIEWS.find((entry) => entry.id === view).label}</h2>
                <div style={{ display: "flex", gap: 8 }}>
                    {VIEWS.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            onClick={() => setView(entry.id)}
                            aria-pressed={view === entry.id}
                        >
                            {entry.label}
                        </button>
                    ))}
                    <button type="button" onClick={saveScreenshot} disabled={visibleReadings.length === 0}>
                        Screenshot speichern
                    </button>
                </div>
            </div>
            <div style={{ position: "relative", height: "min(62vh, 520px)", minHeight: 320 }}>
                <canvas ref={canvasRef} />
            </div>
        </section>
    );
}
