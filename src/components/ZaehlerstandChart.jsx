import { useEffect, useRef } from "react";
import { renderZaehlerstandChart } from "./zaehlerstandChart.js";

export default function ZaehlerstandChart({ readings }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || readings.length === 0) return;

        const chart = renderZaehlerstandChart(canvasRef.current, readings);
        chartRef.current = chart;

        return () => {
            chart.destroy();
            chartRef.current = null;
        };
    }, [readings]);

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
                <h2>Bezug und Einspeisung</h2>
                <button type="button" onClick={saveScreenshot} disabled={readings.length === 0}>
                    Screenshot speichern
                </button>
            </div>
            <div style={{ position: "relative", height: "min(62vh, 520px)", minHeight: 320 }}>
                <canvas ref={canvasRef} />
            </div>
        </section>
    );
}
