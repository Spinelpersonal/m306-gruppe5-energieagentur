import { parseESL } from "../parsers/eslParser";
import { parseSdat } from "../parsers/sdatParser";

function getXmlFormat(xmlText) {
    if (/<(?:[\w.-]+:)?ValidatedMeteredData_12(?=[\s/>])/.test(xmlText)) {
        return "sdat";
    }
    if (/<(?:[\w.-]+:)?(?:ESLBillingData|ESL)(?=[\s/>])/.test(xmlText)) {
        return "esl";
    }
    throw new Error("Unbekanntes XML-Format. Erwartet wird ESL oder SDAT.");
}

export default function FileUpload() {
    async function handleFileChange(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const format = getXmlFormat(text);

            if (format === "sdat") {
                const result = parseSdat(text);
                console.table(
                    result.measurements.map((measurement) => ({
                        sequence: measurement.sequence,
                        time: new Date(
                            measurement.timestamp
                        ).toISOString(),
                        value: measurement.relativeValue
                    }))
                );
                return;
            }

            const measurements = parseESL(text);
            if (measurements === null) {
                throw new Error("Das ESL-XML enthält kein unterstütztes Datenformat.");
            }
            console.table(
                measurements.map((measurement) => ({
                    id: measurement.id,
                    kind: measurement.kind,
                    time: measurement.timestamp,
                    value: measurement.value,
                    obis: measurement.obis.join(" + ")
                }))
            );
        } catch (error) {
            console.error(error.message);
        }
    }

    return (
        <div>
            <input
            type="file"
            accept=".xml"
            onChange={handleFileChange}
        />
        </div>
    );
}