export function getConsumptionByTimestamp(parsedFiles) {
    const consumptionByTimestamp_ID735 = new Map();
    const consumptionByTimestamp_ID742 = new Map();
    const meterReadings_ID735 = new Map();
    const meterReadings_ID742 = new Map();

    for (const file of parsedFiles) {
        if (file.format === "sdat") {
            for (const measurement of file.data.measurements) {
                if (file.data.sensorId === 735) {
                    consumptionByTimestamp_ID735.set(
                        measurement.timestamp,
                        measurement.relativeValue
                    );
                }

                if (file.data.sensorId === 742) {
                    consumptionByTimestamp_ID742.set(
                        measurement.timestamp,
                        measurement.relativeValue
                    );
                }
            }
        }
        if (file.format === "esl") {
            for (const row of file.data) {
                const timestamp = new Date(row.timestamp).getTime();
        
                if (row.id === 735) {
                    meterReadings_ID735.set(timestamp, row.value);
                }
        
                if (row.id === 742) {
                    meterReadings_ID742.set(timestamp, row.value);
                }
            }
        }
    }


    return {
        consumptionByTimestamp_ID735,
        consumptionByTimestamp_ID742,
        meterReadings_ID735,
        meterReadings_ID742
    };
}
