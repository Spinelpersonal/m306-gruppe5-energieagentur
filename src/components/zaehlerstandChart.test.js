import { describe, expect, it } from "vitest";
import { sdatFilesToReadings } from "./zaehlerstandChart";

describe("sdatFilesToReadings", () => {
    it("zählt SDAT-Verbrauch auf den letzten ESL-Stand davor", () => {
        const eslReadings = [
            { timestamp: "2019-01-01T00:00:00.000Z", value: 100, kind: "einspeisung" },
            { timestamp: "2019-01-01T00:00:00.000Z", value: 50, kind: "bezug" },
        ];
        const start = Date.parse("2019-03-01T00:00:00Z");
        const step = 15 * 60 * 1000;

        const result = sdatFilesToReadings([
            {
                format: "sdat",
                data: {
                    sensorId: 735,
                    measurements: [
                        { timestamp: start, endTimestamp: start + step, relativeValue: 1.5 },
                        { timestamp: start + step, endTimestamp: start + 2 * step, relativeValue: 0.5 },
                    ],
                },
            },
            {
                format: "sdat",
                data: {
                    sensorId: 735,
                    measurements: [
                        { timestamp: start, endTimestamp: start + step, relativeValue: 2 },
                    ],
                },
            },
        ], eslReadings);

        expect(result).toEqual([
            { timestamp: "2019-03-01T00:00:00.000Z", value: 100, total: 100, kind: "einspeisung" },
            { timestamp: "2019-03-01T00:15:00.000Z", value: 102, total: 102, kind: "einspeisung" },
            { timestamp: "2019-03-01T00:30:00.000Z", value: 102.5, total: 102.5, kind: "einspeisung" },
        ]);
    });
});
