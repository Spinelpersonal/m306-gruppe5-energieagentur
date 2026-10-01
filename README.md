# EnergyChart

EnergyChart ist eine lokale Webanwendung zur Auswertung von Schweizer Stromzählerdaten. Sie liest **SDAT-** und **ESL-Dateien** im XML-Format ein, ordnet die Messwerte den Zählrichtungen Bezug und Einspeisung zu und stellt sowohl Verbrauchswerte als auch absolute Zählerstände grafisch dar.

Die Anwendung basiert auf der Projektbeschreibung «Energieagentur Bünzli» und läuft vollständig im Browser: Ausgewählte Dateien werden nicht an einen Server übertragen.

## Funktionsumfang

- Einzelne, mehrere oder alle XML-Dateien eines Ordners einlesen
- ESL- und SDAT-Dateien automatisch anhand ihres Root-Elements erkennen
- XML-Namespaces unabhängig vom verwendeten Präfix verarbeiten
- Bezug (`ID 742`) und Einspeisung (`ID 735`) getrennt auswerten
- Doppelte SDAT-Messwerte anhand ihres Zeitstempels zusammenführen
- SDAT-Verbrauchswerte täglich, wöchentlich oder monatlich aggregieren
- Verbrauch und Einspeisung als Balkendiagramm anzeigen
- Absolute Zählerstände aus ESL-Dateien gemeinsam oder einzeln als Liniendiagramm anzeigen
- Beide Diagramme als PNG-Screenshot speichern
- Alle importierten SDAT-Verbrauchswerte als CSV-Datei exportieren
- Fortschritt und fehlerhafte Dateien bei grösseren Importen ausweisen

## Unterstützte Messwerte

| Richtung | Sensor-ID | Verwendete OBIS-Codes im ESL | Berechnung |
| --- | ---: | --- | --- |
| Bezug aus dem Netz | `742` | `1-1:1.8.1`, `1-1:1.8.2` | Hoch- und Niedertarif werden addiert |
| Einspeisung ins Netz | `735` | `1-1:2.8.1`, `1-1:2.8.2` | Hoch- und Niedertarif werden addiert |

### SDAT

Unterstützt werden Root-Elemente wie `ValidatedMeteredData` und `ValidatedMeteredData_15`. Die Sensor-ID wird aus einer `DocumentID` mit `ID735` oder `ID742` gelesen. Zeitstempel entstehen aus dem Startzeitpunkt, der Sequenznummer und der Auflösung des Messintervalls.

SDAT-Dateien ohne `Resolution` werden ebenfalls akzeptiert. In diesem Fall wird die Dauer des Gesamtintervalls gleichmässig auf die enthaltenen Beobachtungen verteilt.

### ESL

Unterstützt werden `ESLBillingData` und `ESL`. Pro `TimePeriod` werden die beiden benötigten Tarifwerte einer Zählrichtung addiert. Unvollständige Messgruppen, ungültige Zahlen und ungültige Zeitangaben werden übersprungen.

## Voraussetzungen

- [Node.js](https://nodejs.org/) **22.12+** aus einer unterstützten Release-Linie (`22.x`, `24.x` oder `>=26`)
- npm

Damit sind die Anforderungen der aktuell eingesetzten Versionen von Vite und Vitest erfüllt.

## Installation und Start

```bash
git clone https://github.com/Spinelpersonal/m306-gruppe5-energieagentur.git
cd energieagentur
npm install
npm run dev
```

Vite zeigt anschliessend die lokale Adresse an, standardmässig `http://localhost:5173`.

## Bedienung

1. Die Anwendung im Browser öffnen.
2. Einzelne XML-Dateien auswählen oder einen ganzen Ordner importieren.
3. Warten, bis alle Dateien verarbeitet wurden.
4. Im Verbrauchsdiagramm zwischen Tages-, Wochen- und Monatsübersicht wechseln.
5. Im Zählerstandsdiagramm beide Richtungen gemeinsam oder nur Bezug beziehungsweise Einspeisung anzeigen.
6. Bei Bedarf das jeweilige Diagramm über **Screenshot speichern** als PNG herunterladen.
7. Die SDAT-Verbrauchswerte über **CSV exportieren** als `verbrauch.csv` speichern.

Fehler einzelner Dateien verhindern nicht die Verarbeitung der übrigen Dateien. Eine Zusammenfassung erscheint in der Oberfläche; Details zu nicht lesbaren Dateien stehen in der Browser-Konsole.

Die CSV-Datei enthält die Spalten `timestamp`, `sensorId` und `value`. Zeitstempel werden im ISO-8601-Format ausgegeben; die Zeilen sind chronologisch sortiert. Der Export wird nur angezeigt, wenn mindestens ein SDAT-Verbrauchswert vorhanden ist.

## Datenverarbeitung

1. Der Import erkennt jede Datei als ESL oder SDAT.
2. Die Parser normalisieren Zeitpunkte, Sensor-IDs und Messwerte.
3. SDAT-Duplikate mit derselben Zählrichtung und demselben Zeitstempel werden überschrieben, sodass pro Zeitpunkt ein Wert verbleibt.
4. Die Verbrauchsanalyse summiert die relativen SDAT-Werte in UTC-basierte Tages-, ISO-Wochen- oder Monatsgruppen.
5. Doppelte ESL-Zählerstände derselben Zählrichtung und desselben Zeitpunkts werden zusammengeführt und chronologisch sortiert.
6. Die Zählerstandsanalyse stellt die absoluten Werte aus den ESL-Dateien dar; SDAT-Werte werden dafür nicht hochgerechnet.
7. Chart.js rendert die aufbereiteten Reihen im Browser.

## Verfügbare Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver mit Hot Reload starten |
| `npm run build` | Optimierten Produktions-Build in `dist/` erstellen |
| `npm run preview` | Den Produktions-Build lokal prüfen |
| `npm run lint` | JavaScript- und JSX-Dateien mit ESLint prüfen |
| `npm exec vitest -- run` | Alle Tests einmalig ausführen |

## Projektstruktur

```text
energieagentur/
├── public/                         # Statische Dateien und Favicon
├── src/
│   ├── components/
│   │   ├── FileUpload.jsx          # Dateiimport und Ablaufsteuerung
│   │   ├── VerbrauchChart.jsx      # Bedienoberfläche Verbrauchsdiagramm
│   │   ├── verbrauchChart.js       # Aggregation und Balkendiagramm
│   │   ├── ZaehlerstandChart.jsx   # Bedienoberfläche Zählerstandsdiagramm
│   │   └── zaehlerstandChart.js    # Berechnung und Liniendiagramm
│   ├── data/
│   │   └── consumptionByTimestamp.js
│   ├── parsers/
│   │   ├── eslParser.js
│   │   └── sdatParser.js
│   ├── utils/
│   │   └── csvExport.js          # CSV-Datei im Browser erzeugen
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

Die Tests liegen jeweils neben den getesteten Parser- und Berechnungsmodulen in `src/`.

## Technische Basis

- [React 19](https://react.dev/) für die Benutzeroberfläche
- [Vite 8](https://vite.dev/) als Entwicklungs- und Build-Werkzeug
- [Chart.js 4](https://www.chartjs.org/) für die Diagramme
- [fast-xml-parser 5](https://github.com/NaturalIntelligence/fast-xml-parser) für ESL und SDAT
- [Vitest 5](https://vitest.dev/) für automatisierte Tests
- [ESLint 10](https://eslint.org/) für die statische Codeprüfung

## Produktions-Build

```bash
npm run build
npm run preview
```

Der Inhalt von `dist/` kann auf einem statischen Webserver bereitgestellt werden. Die Anwendung benötigt zur Laufzeit kein Backend.

## nicht umgesetzt

Folgende Punkte gehören zur Kategorie "Nice to have" und wir haben uns dagegenn entschieden, diese umzusetzen und und lieber mehr Zeit geben für die Anderen Aufgaben.

- Export der Daten als JSON-Datei
- Übertragung der JSON-Daten per HTTP `POST`
