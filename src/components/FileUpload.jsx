import { parseSdat } from "../parsers/sdatParser";

export default function FileUpload() {
    async function handleFileChange(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const text = await file.text();
        
        try {
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