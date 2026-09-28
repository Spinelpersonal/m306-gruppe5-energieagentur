import { describe, expect, it } from "vitest";
import { parseSdat } from "./sdatParser";

describe("parseSdat", () => {
    it("liest ein Monatsaggregat ohne optionale Resolution", () => {
        const xml = `
            <rsm:ValidatedMeteredData_15 xmlns:rsm="http://www.strom.ch">
                <rsm:MeteringData>
                    <rsm:DocumentID>D1</rsm:DocumentID>
                    <rsm:Interval>
                        <rsm:StartDateTime>2022-12-31T23:00:00Z</rsm:StartDateTime>
                        <rsm:EndDateTime>2023-01-31T23:00:00Z</rsm:EndDateTime>
                    </rsm:Interval>
                    <rsm:Observation>
                        <rsm:Position><rsm:Sequence>1</rsm:Sequence></rsm:Position>
                        <rsm:Volume>98.000</rsm:Volume>
                    </rsm:Observation>
                </rsm:MeteringData>
            </rsm:ValidatedMeteredData_15>`;

        const result = parseSdat(xml);

        expect(result.resolution).toBeNull();
        expect(result.measurements).toEqual([
            {
                sequence: 1,
                timestamp: Date.parse("2022-12-31T23:00:00Z"),
                endTimestamp: Date.parse("2023-01-31T23:00:00Z"),
                relativeValue: 98
            }
        ]);
    });
});
