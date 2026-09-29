import { describe, expect, it } from "vitest";
import { parseESL } from "./eslParser";

describe("parseESL", () => {
    it("liest Bezug und Einspeisung und summiert doppelte OBIS-Werte", () => {
        const xml = `
            <esl:ESLBillingData xmlns:esl="http://www.strom.ch">
                <esl:Meter>
                    <esl:TimePeriod end="2024-03-01T00:00:00Z">
                        <esl:ValueRow obis="1-1:1.8.1" value="12.5" />
                        <esl:ValueRow obis="1-1:1.8.1" value="0.5" />
                        <esl:ValueRow obis="1-1:1.8.2" value="3" />
                        <esl:ValueRow obis="1-1:2.8.1" value="4" />
                        <esl:ValueRow obis="1-1:2.8.2" value="2" />
                    </esl:TimePeriod>
                </esl:Meter>
            </esl:ESLBillingData>`;

        expect(parseESL(xml)).toEqual([
            {
                timestamp: "2024-03-01T00:00:00.000Z",
                value: 16,
                id: 742,
                kind: "bezug",
                obis: ["1-1:1.8.1", "1-1:1.8.2"],
            },
            {
                timestamp: "2024-03-01T00:00:00.000Z",
                value: 6,
                id: 735,
                kind: "einspeisung",
                obis: ["1-1:2.8.1", "1-1:2.8.2"],
            },
        ]);
    });

    it("überspringt unvollständige oder ungültige Zeitperioden", () => {
        const xml = `
            <ESL>
                <Meter>
                    <TimePeriod end="2024-03-01T00:00:00Z">
                        <ValueRow obis="1-1:1.8.1" value="12" />
                        <ValueRow obis="1-1:1.8.2" value="not-a-number" />
                        <ValueRow obis="1-1:2.8.1" value="4" />
                    </TimePeriod>
                    <TimePeriod end="not-a-date">
                        <ValueRow obis="1-1:1.8.1" value="1" />
                        <ValueRow obis="1-1:1.8.2" value="2" />
                    </TimePeriod>
                </Meter>
            </ESL>`;

        expect(parseESL(xml)).toEqual([]);
    });

    it("gibt null zurück, wenn kein ESL-Root vorhanden ist", () => {
        expect(parseESL("<Other />")).toBeNull();
    });
});
