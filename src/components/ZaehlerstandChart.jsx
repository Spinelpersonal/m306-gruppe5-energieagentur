import { useEffect, useMemo, useRef, useState } from "react";
import { renderZaehlerstandChart } from "./zaehlerstandChart.js";

const VIEWS = [
    { id: "beide", label: "Zählerstand - Beide" },
    { id: "bezug", label: "Zählerstand - Bezug" },
    { id: "einspeisung", label: "Zählerstand - Einspeisung" },
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
        <section className="card" aria-label="Absolute Zählerstände">
            <div className="card__header">
                <div>
                    <h2 className="card__title">Zählerstände</h2>
                    <p className="card__subtitle">{VIEWS.find((entry) => entry.id === view).label}</p>
                </div>
                <div className="card__actions">
                    <label className="visually-hidden" htmlFor="chart-view">Ansicht:</label>

                    <select
                        className="select"
                        id="chart-view"
                        value={view}
                        onChange={(event) => setView(event.target.value)}
                    >
                        {VIEWS.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                                {entry.label}
                            </option>
                        ))}
                    </select>

                    <button
                        className="button button--secondary"
                        type="button"
                        onClick={saveScreenshot}
                        disabled={visibleReadings.length === 0}
                    >
                        Screenshot speichern
                    </button>
                </div>
            </div>
            <div className="chart">
                <canvas ref={canvasRef} />
            </div>
        </section>
    );
}
