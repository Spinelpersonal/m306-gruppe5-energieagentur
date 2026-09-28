import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    removeNSPrefix: true,
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) =>
        ["Meter", "TimePeriod", "ValueRow"].includes(name),
});

const measurementGroups = [
    { id: 742, kind: 'bezug', obis: ['1-1:1.8.1', '1-1:1.8.2'] },
    { id: 735, kind: 'einspeisung', obis: ['1-1:2.8.1', '1-1:2.8.2'] },
];

export function parseESL(xmlString) {
    const json = parser.parse(xmlString);
    const root = json.ESLBillingData ?? json.ESL;
    if (!root) return null;

    const out = [];
    for (const meter of root.Meter ?? []) {
        for (const period of meter.TimePeriod ?? []) {
            const end = period['@_end'];
            const timestamp = new Date(end);
            if (!end || Number.isNaN(timestamp.getTime())) continue;

            const values = new Map();
            for (const row of period.ValueRow ?? []) {
                const rawValue = row['@_value'];
                if (rawValue == null || String(rawValue).trim() === '') continue;
                const value = Number(rawValue);
                if (!Number.isFinite(value)) continue;

                const obis = String(row['@_obis'] ?? '');
                values.set(obis, (values.get(obis) ?? 0) + value);
            }

            for (const group of measurementGroups) {
                if (!group.obis.every((obis) => values.has(obis))) continue;
                out.push({
                    timestamp: timestamp.toISOString(),
                    value: group.obis.reduce((sum, obis) => sum + values.get(obis), 0),
                    id: group.id,
                    kind: group.kind,
                    obis: group.obis,
                });
            }
        }
    }
    return out;
}