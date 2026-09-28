import { XMLParser } from "fast-xml-parser";

export function parseSdat(xmlText) {
    const parser = new XMLParser({
        ignoreAttributes: false
    });

    const data = parser.parse(xmlText);

    const rootKey = Object.keys(data).find((key) =>
        key.startsWith("rsm:ValidatedMeteredData_")
    );

    const root = data[rootKey];

    const meteringData = root["rsm:MeteringData"];
    
    const documentId = meteringData["rsm:DocumentID"];
    const interval = meteringData["rsm:Interval"];
    const resolution = meteringData["rsm:Resolution"];
    const observations = meteringData["rsm:Observation"];

    const startDateTime = interval["rsm:StartDateTime"];
    const endDateTime = interval["rsm:EndDateTime"];

    const resolutionValue = resolution["rsm:Resolution"];
    const resolutionUnit = resolution["rsm:Unit"];

    const startTimestamp = new Date(startDateTime).getTime()

    const measurements = observations.map((observation) => {
        const sequence = observation["rsm:Position"]["rsm:Sequence"];

        const volume = observation["rsm:Volume"];

        const timestamp = startTimestamp + (sequence-1) * resolutionValue * 60 * 1000;

        return {
            sequence,
            timestamp,
            relativeValue: volume   
        };
    });

    return {
        documentId,
        startDateTime,
        endDateTime,
        resolution: resolutionValue,
        resolutionUnit,
        measurements
    };
}