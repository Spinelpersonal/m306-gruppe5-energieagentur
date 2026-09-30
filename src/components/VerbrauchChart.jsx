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
        <section aria-label="Verbrauchsanalyse">
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <h2>
                    Verbrauch und Einspeisung -{" "}
                    {PERIOD_NAMES[selectedPeriod]}
                </h2>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <label htmlFor="verbrauch-period">
                        Übersicht:
                    </label>

                    <select
                        id="verbrauch-period"
                        value={selectedPeriod}
                        onChange={(event) =>
                            setSelectedPeriod(event.target.value)
                        }
                    >
                        <option value="day">Täglich</option>
                        <option value="week">Wöchentlich</option>
                        <option value="month">Monatlich</option>
                    </select>

                    <button
                        type="button"
                        onClick={saveScreenshot}
                        disabled={!hasConsumption}
                    >
                        Screenshot speichern
                    </button>
                </div>
            </div>

            <div
                style={{
                    position: "relative",
                    height: "min(62vh, 520px)",
                    minHeight: 320,
                }}
            >
                <canvas ref={canvasRef} />
            </div>
        </section>
    );
}