import { useState } from "react";
import { parseESL } from "../parsers/eslParser";
import { parseSdat } from "../parsers/sdatParser";
import ZaehlerstandChart from "./ZaehlerstandChart.jsx";
import { mergeReadings } from "./zaehlerstandChart.js";

function getXmlFormat(xmlText) {
    // SDAT kommt unter anderem als ValidatedMeteredData_11 und _12 vor.
    // Der Namespace-Präfix (z. B. rsm:) ist frei wählbar und daher optional.
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

function countMeasurements(parsedFile) {
    return parsedFile.format === "sdat"
        ? parsedFile.data.measurements.length
        : parsedFile.data.length;
}

function getAbsoluteReadings(summary) {
    if (!summary) return [];

    const eslReadings = summary.parsedFiles
        .filter((file) => file.format === "esl")
        .map((file) => file.data);

    return mergeReadings(...eslReadings);
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

        const nextSummary = {
            fileCount: parsedFiles.length,
            measurementCount,
            errorCount: errors.length,
            parsedFiles,
            errors
        };

        // Alle ausgelesenen Daten bleiben gemeinsam und nach Quelldatei zugeordnet.
        console.log("Verarbeitete XML-Daten", nextSummary);
        if (errors.length > 0) console.table(errors);

        setSummary(nextSummary);
        setIsProcessing(false);
    }

    return (
        <div>
            <p>Einzelne oder mehrere XML-Dateien auswählen:</p>
            <input
                type="file"
                accept=".xml,application/xml,text/xml"
                multiple
                disabled={isProcessing}
                onChange={handleFiles}
            />

            <p>Alternativ einen ganzen Ordner auswählen:</p>
            <input
                type="file"
                accept=".xml,application/xml,text/xml"
                webkitdirectory=""
                directory=""
                multiple
                disabled={isProcessing}
                onChange={handleFiles}
            />

            {progress && isProcessing && (
                <p>
                    Verarbeite Datei {progress.processed} von {progress.total} …
                </p>
            )}

            {summary && (
                <div>
                    <p>
                        Fertig: {summary.fileCount} XML-Dateien mit insgesamt{" "}
                        {summary.measurementCount} Messwerten verarbeitet.
                    </p>
                    {summary.errorCount > 0 && (
                        <p>
                            {summary.errorCount} Dateien konnten nicht verarbeitet
                            werden. Details stehen in der Browser-Konsole.
                        </p>
                    )}
                    {readings.length > 0 ? (
                        <ZaehlerstandChart readings={readings} />
                    ) : (
                        <p>
                            Für die Absolutwertgrafik werden ESL-Zählerstände benötigt.
                            SDAT-Dateien enthalten relative Werte ohne Messart-Zuordnung.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
