import { useState } from "react";
import { parseESL } from "../parsers/eslParser";
import { parseSdat } from "../parsers/sdatParser";
import { getConsumptionByTimestamp } from "../data/consumptionByTimestamp";
import ZaehlerstandChart from "./ZaehlerstandChart.jsx";
import { eslFilesToReadings } from "./zaehlerstandChart.js";
import VerbrauchChart from "./VerbrauchChart.jsx";
import { csvExport } from "../utils/csvExport";

function getXmlFormat(xmlText) {
    if (/<(?:[\w.-]+:)?ValidatedMeteredData(?:_\d+)?(?=[\s/>])/.test(xmlText)) {
        return "sdat";
    }
    if (/<(?:[\w.-]+:)?(?:ESLBillingData|ESL)(?=[\s/>])/.test(xmlText)) {
        return "esl";
    }
    throw new Error("Unbekanntes XML-Format. Erwartet wird ESL oder SDAT.");
}

function parseXml(xmlText) {
    const format = getXmlFormat(xmlText);

    if (format === "sdat") {
        return { format, data: parseSdat(xmlText) };
    }

    const data = parseESL(xmlText);
    if (data === null) {
        throw new Error("Das ESL-XML enthält kein unterstütztes Datenformat.");
    }
    return { format, data };
}

// Dies ist eine hilfsfunktion zur export als CSV
function consumptionMapsToRows(consumption) {
    // Struktur der Maps definieren, values einfügen wenn sie existieren
    const maps = [
        {
            sensorId: 735,
            values: consumption?.consumptionByTimestamp_ID735,
        },
        {
            sensorId: 742,
            values: consumption?.consumptionByTimestamp_ID742,
        },
    ];

    return maps
        // flatMap maps the array and returns a flat array, basically an array without any lists or arrays nested inside it
        .flatMap(({ sensorId, values }) => 
            [...(values ?? new Map())].map(([timestamp, value]) => ({
                timestamp: new Date(Number(timestamp)).toISOString(),
                sensorId,
                value,
            }))
        )
        // compare the first row with the second, 0 means the order doesn't matter, negative means the first row has to come first, positive means it comes later
        .sort(
            (firstRow, secondRow) =>
                Date.parse(firstRow.timestamp) - Date.parse(secondRow.timestamp)
        )
}

function countMeasurements(parsedFile) {
    return parsedFile.format === "sdat"
        ? parsedFile.data.measurements.length
        : parsedFile.data.length;
}

function getAbsoluteReadings(summary) {
    if (!summary) return [];

    return eslFilesToReadings(summary.parsedFiles);
}

// Diese Funktion gibt dem Browser Zeit, um Zwischenergebnisse beim Kalkulieren zu geben, anstatt lange zu warten
function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

export default function FileUpload() {
    const [progress, setProgress] = useState(null);
    const [summary, setSummary] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const readings = getAbsoluteReadings(summary);

    const consumption = summary?.consumptionByTimestamp;
    const exportRows = consumptionMapsToRows(consumption);

    const hasConsumption =
        (consumption?.consumptionByTimestamp_ID742?.size ?? 0) > 0 ||
        (consumption?.consumptionByTimestamp_ID735?.size ?? 0) > 0;

    async function handleFiles(event) {
        const files = Array.from(event.target.files ?? [])
            .filter((file) => file.name.toLowerCase().endsWith(".xml"))
            .sort((a, b) =>
                (a.webkitRelativePath || a.name).localeCompare(
                    b.webkitRelativePath || b.name
                )
            );

        // Erlaubt, dass derselbe Ordner erneut ausgewählt werden kann.
        event.target.value = "";
        if (files.length === 0) return;

        setIsProcessing(true);
        setSummary(null);
        setProgress({ processed: 0, total: files.length });

        const parsedFiles = [];
        const errors = [];
        let measurementCount = 0;

        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];
            const path = file.webkitRelativePath || file.name;

            try {
                const parsed = parseXml(await file.text());
                const result = { path, ...parsed };
                parsedFiles.push(result);
                measurementCount += countMeasurements(result);
            } catch (error) {
                errors.push({ path, message: error.message });
            }

            const processed = index + 1;
            if (processed % 25 === 0 || processed === files.length) {
                setProgress({ processed, total: files.length });
                await yieldToBrowser();
            }
        }

        const consumptionByTimestamp = getConsumptionByTimestamp(parsedFiles);

        const nextSummary = {
            fileCount: parsedFiles.length,
            measurementCount,
            errorCount: errors.length,
            parsedFiles,
            errors,
            consumptionByTimestamp
        };

        // Alle ausgelesenen Daten bleiben gemeinsam und nach Quelldatei zugeordnet.
        console.log("Verarbeitete XML-Daten", nextSummary);
        if (errors.length > 0) console.table(errors);

        setSummary(nextSummary);
        setIsProcessing(false);
    }

    return (
        <>
            <section className="card upload-card" aria-labelledby="upload-title">
                <div className="card__header card__header--centered">
                    <div>
                        <h2 className="card__title" id="upload-title">XML-Dateien hochladen</h2>
                        <p className="card__subtitle">Unterstützt werden SDAT- und ESL-Dateien.</p>
                    </div>
                </div>

                <label className={`dropzone${isProcessing ? " dropzone--disabled" : ""}`}>
                    <input
                        className="dropzone__input"
                        type="file"
                        accept=".xml,application/xml,text/xml"
                        multiple
                        disabled={isProcessing}
                        onChange={handleFiles}
                    />
                    <svg className="dropzone__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="dropzone__text">XML-Dateien hierher ziehen oder klicken</span>
                    <span className="dropzone__hint">Du kannst mehrere Dateien gleichzeitig auswählen.</span>
                </label>

                <p className="folder-upload">
                    Oder einen <label className="folder-upload__label" htmlFor="folder-upload">ganzen Ordner auswählen</label>
                </p>
                <input
                    id="folder-upload"
                    className="visually-hidden"
                    type="file"
                    accept=".xml,application/xml,text/xml"
                    webkitdirectory=""
                    directory=""
                    multiple
                    disabled={isProcessing}
                    onChange={handleFiles}
                />

                {progress && isProcessing && (
                    <div className="upload-status" aria-live="polite">
                        <p>Verarbeite Datei {progress.processed} von {progress.total} …</p>
                        <progress className="progress" value={progress.processed} max={progress.total} />
                    </div>
                )}
            </section>

            {summary && (
                <>
                    <section className="card" aria-labelledby="summary-title">
                        <div className="card__header">
                            <div>
                                <h2 className="card__title" id="summary-title">Import abgeschlossen</h2>
                                <p className="card__subtitle">Deine Dateien wurden erfolgreich ausgewertet.</p>
                            </div>
                            <span className="status-badge">Bereit</span>
                        </div>
                        <div className="summary">
                            <div className="summary__item">
                                <p className="summary__value">{summary.fileCount}</p>
                                <p className="summary__label">XML-Dateien</p>
                            </div>
                            <div className="summary__item">
                                <p className="summary__value">{summary.measurementCount.toLocaleString("de-CH")}</p>
                                <p className="summary__label">Messwerte</p>
                            </div>
                        </div>
                    {summary.errorCount > 0 && (
                        <p className="message message--error">
                            {summary.errorCount} Dateien konnten nicht verarbeitet
                            werden. Details stehen in der Browser-Konsole.
                        </p>
                    )}
                    </section>
                    {hasConsumption ? (
                        <VerbrauchChart consumptionByTimestamp={consumption} />
                    ) : (
                        <p className="card message empty-state">
                            Für das Verbrauchsdiagramm werden SDAT-Verbrauchswerte
                            der ID 735 oder ID 742 benötigt.
                        </p>
                    )}
                    {readings.length > 0 ? (
                        <ZaehlerstandChart readings={readings} />
                    ) : (
                        <p className="card message empty-state">
                            Keine ESL-Zählerstände zum Anzeigen.
                        </p>
                    )}
                    {exportRows.length > 0 && (
                        <section className="card export">
                            <div>
                                <h2 className="card__title">Daten exportieren</h2>
                                <p className="card__subtitle">Alle Verbrauchswerte als CSV-Datei speichern.</p>
                            </div>
                            <button className="button button--primary" type="button" onClick={() => csvExport(exportRows, "verbrauch.csv")}>
                                CSV exportieren
                            </button>
                        </section>
                    )}
                </>
            )}
        </>
    );
}
