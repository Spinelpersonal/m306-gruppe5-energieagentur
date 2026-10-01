import { useEffect, useRef, useState } from "react";
import { renderVerbrauchChart } from "./verbrauchChart.js";

const PERIOD_NAMES = {
    day: "Tagesübersicht",
    week: "Wochenübersicht",
    month: "Monatsübersicht",
};

function containsConsumption(consumptionByTimestamp) {
    return (
        (consumptionByTimestamp?.consumptionByTimestamp_ID742?.size ?? 0) >
            0 ||
        (consumptionByTimestamp?.consumptionByTimestamp_ID735?.size ?? 0) >
            0
    );
}

export default function VerbrauchChart({ consumptionByTimestamp }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    const [selectedPeriod, setSelectedPeriod] = useState("week");

    const hasConsumption = containsConsumption(consumptionByTimestamp);

    useEffect(() => {
        if (!canvasRef.current || !hasConsumption) return;

        const chart = renderVerbrauchChart(
            canvasRef.current,
            consumptionByTimestamp,
            selectedPeriod
        );

        chartRef.current = chart;

        return () => {
            chart.destroy();
            chartRef.current = null;
        };
    }, [consumptionByTimestamp, hasConsumption, selectedPeriod]);

    function saveScreenshot() {
        if (!chartRef.current) return;

        const link = document.createElement("a");
        link.download = `verbrauch-${selectedPeriod}.png`;
        link.href = chartRef.current.toBase64Image("image/png");
        link.click();
    }

    return (
        <section className="card" aria-label="Verbrauchsanalyse">
            <div className="card__header">
                <div>
                    <h2 className="card__title">Verbrauch und Einspeisung</h2>
                    <p className="card__subtitle">{PERIOD_NAMES[selectedPeriod]}</p>
                </div>

                <div className="card__actions">
                    <div className="button-group" aria-label="Zeitraum auswählen">
                        {[["day", "Tag"], ["week", "Woche"], ["month", "Monat"]].map(([period, label]) => (
                            <button
                                className={`button-group__item${selectedPeriod === period ? " button-group__item--active" : ""}`}
                                type="button"
                                key={period}
                                aria-pressed={selectedPeriod === period}
                                onClick={() => setSelectedPeriod(period)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <button
                        className="button button--secondary"
                        type="button"
                        onClick={saveScreenshot}
                        disabled={!hasConsumption}
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
