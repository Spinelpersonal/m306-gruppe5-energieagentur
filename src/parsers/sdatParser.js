import { XMLParser } from "fast-xml-parser";

export function parseSdat(xmlText) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        // XML-Präfixe sind keine festen Feldnamen. Dadurch funktionieren sowohl
        // <rsm:MeteringData> als auch andere bzw. Default-Namespaces.
        removeNSPrefix: true
    });

    const data = parser.parse(xmlText);

    const rootKey = Object.keys(data).find((key) =>
        /^ValidatedMeteredData(?:_\d+)?$/.test(key)
    );

    if (!rootKey) {
        throw new Error("Kein SDAT-Root-Element ValidatedMeteredData gefunden.");
    }

    const root = data[rootKey];

    const meteringData = root.MeteringData;

    if (!meteringData) {
        throw new Error("Das SDAT-XML enthält keine MeteringData.");
    }
    
    const documentId = meteringData.DocumentID;
    const interval = meteringData.Interval;
    const resolution = meteringData.Resolution;
    const rawObservations = meteringData.Observation;

    if (!interval || !rawObservations) {
        throw new Error("Das SDAT-XML enthält unvollständige Messdaten.");
    }
    const observations = Array.isArray(rawObservations)
        ? rawObservations
        : [rawObservations];

    const startDateTime = interval.StartDateTime;
    const endDateTime = interval.EndDateTime;

    // Resolution ist in SDAT optional. Monats- oder Jahresaggregate enthalten
    // häufig nur Interval + eine Observation, aber keine Resolution.
    const resolutionValue = resolution?.Resolution ?? null;
    const resolutionUnit = resolution?.Unit ?? null;

    const startTimestamp = new Date(startDateTime).getTime();
    const endTimestamp = new Date(endDateTime).getTime();

    if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
        throw new Error("Das SDAT-XML enthält einen ungültigen Zeitraum.");
    }

    const parsedResolution = Number(resolutionValue);
    const hasResolution = Number.isFinite(parsedResolution) && parsedResolution > 0;
    const durationPerObservation = hasResolution
        ? parsedResolution * 60 * 1000
        : (endTimestamp - startTimestamp) / observations.length;

    const measurements = observations.map((observation) => {
        const sequence = observation.Position.Sequence;

        const volume = observation.Volume;

        const timestamp = startTimestamp + (sequence - 1) * durationPerObservation;

        return {
            sequence,
            timestamp,
            endTimestamp: Math.min(timestamp + durationPerObservation, endTimestamp),
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
