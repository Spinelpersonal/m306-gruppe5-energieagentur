import { describe, expect, it } from "vitest";
import {
    eslFilesToReadings,
    mergeReadings,
} from "./zaehlerstandChart";

describe("eslFilesToReadings", () => {
    it("verwendet nur ESL-Zählerstände und ignoriert SDAT-Daten", () => {
        const parsedFiles = [
            {
                format: "esl",
                data: [
                    {
                        timestamp: "2024-02-01T00:00:00.000Z",
                        value: 120,
                        kind: "bezug",
                    },
                    {
                        timestamp: "2024-01-01T00:00:00.000Z",
                        value: 100,
                        kind: "bezug",
                    },
                ],
            },
            {
                format: "sdat",
                data: {
                    sensorId: 742,
                    measurements: [
                        {
                            timestamp: Date.parse("2024-01-15T00:00:00Z"),
                            relativeValue: 999,
                        },
                    ],
                },
            },
        ];

        expect(eslFilesToReadings(parsedFiles)).toEqual([
            {
                timestamp: "2024-01-01T00:00:00.000Z",
                value: 100,
                kind: "bezug",
            },
            {
                timestamp: "2024-02-01T00:00:00.000Z",
                value: 120,
                kind: "bezug",
            },
        ]);
    });

    it("gibt eine leere Liste zurück, wenn nur SDAT-Dateien vorhanden sind", () => {
        const parsedFiles = [
            {
                format: "sdat",
                data: {
                    sensorId: 742,
                    measurements: [
                        {
                            timestamp: Date.parse("2024-01-01T00:00:00Z"),
                            relativeValue: 10,
                        },
                    ],
                },
            },
        ];

        expect(eslFilesToReadings(parsedFiles)).toEqual([]);
    });
});

describe("mergeReadings", () => {
    it("entfernt doppelte ESL-Stände und sortiert sie chronologisch", () => {
        const readings = [
            {
                timestamp: "2024-02-01T00:00:00.000Z",
                value: 120,
                kind: "bezug",
            },
            {
                timestamp: "2024-01-01T00:00:00.000Z",
                value: 100,
                kind: "bezug",
            },
            {
                timestamp: "2024-01-01T00:00:00.000Z",
                value: 105,
                kind: "bezug",
            },
        ];

        expect(mergeReadings(readings)).toEqual([
            {
                timestamp: "2024-01-01T00:00:00.000Z",
                value: 105,
                kind: "bezug",
            },
            {
                timestamp: "2024-02-01T00:00:00.000Z",
                value: 120,
                kind: "bezug",
            },
        ]);
    });
});