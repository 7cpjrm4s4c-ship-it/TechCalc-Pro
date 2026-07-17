# Phase 47C.9C – Behördenfähige PDF-Dokumentstruktur

## Ziel

Das in Phase 47C.9B eingeführte, typisierte Flooding Report DTO wird innerhalb der zentralen PDF-Architektur in eine fachlich definierte, behördenfähige Dokumentstruktur überführt.

Die Phase verändert weder die Berechnungslogik noch das DTO. Sie definiert ausschließlich die Reihenfolge und inhaltliche Zuordnung der PDF-Abschnitte.

## Architektur

```text
Flooding State
  -> Calculation Model
  -> Result Model
  -> Flooding Report DTO
  -> buildFloodingReportSections()
  -> pdfDataMapping.reportSections()
  -> GlobalPdfReport
```

Der Typed-DTO-Pfad wird bevorzugt. Für Module ohne Report-Adapter bleibt die bestehende DOM-basierte Legacy-Abbildung erhalten.

## Verbindliche Kapitelreihenfolge

1. Ergebniszusammenfassung
2. Planerische Interpretation
3. Projekt- und Behördenreferenz
4. Flächenübersicht
5. Regendaten und Berechnungsgrundlagen
6. Leitungs- und Abflussnachweis
7. DIN 1986-100 – Gleichung (20)
8. DIN 1986-100 – Gleichung (21), Dauerstufenvergleich
9. DWA-A 117 – Anwendungs- und Parameterprüfung
10. DWA-A 117 – Dauerstufenvergleich
11. Diagnosen, Warnungen und Empfehlungen
12. Quellen, Versionen und Nachweisidentität

## Zentrale Verantwortlichkeiten

- `floodingReportSections.js` bildet ausschließlich DTO-Felder auf PDF-Zeilen ab.
- Die Zahlenformatierung erfolgt über den zentralen `numberService`.
- `pdfDataMapping.js` entscheidet zwischen Typed DTO und Legacy-DOM-Fallback.
- `pdfLayout.js` bleibt allein verantwortlich für A4-Seiten, Kopfbereich, Firmenlogo, Tabellenlayout, Umbrüche, Fortsetzungsüberschriften, Corporate Block und Seitenzahlen.

## Mehrseitige Dokumente

Die vorhandene zentrale Layout-Engine segmentiert lange Abschnitte automatisch. Fortsetzungsseiten erhalten die Abschnittsbezeichnung mit dem Zusatz `Fortsetzung`. Dies gilt auch für große Flächenlisten und umfangreiche Dauerstufenvergleiche.

## Skalierungsprüfung

Das Regression Gate erzeugt eine Dokumentstruktur mit:

- 205 Flächen,
- 101 DWA-Dauerstufen,
- vollständigen DIN- und DWA-Nachweisen,
- Diagnosen und Quellen.

Der Mapper darf keine Datensätze abschneiden und muss JSON-serialisierbare Abschnitte erzeugen.

## Abgrenzung

Phase 47C.9C enthält noch keine gesonderte visuelle PDF-Snapshot-Abnahme. Die fachliche Konsistenz zwischen UI, DTO und PDF sowie zusätzliche PDF-/Print-Regressionen werden in den nachfolgenden Teilphasen von 47C.9 abgesichert.

## Gate

```bash
node tests/flooding-verification-phase47c9c-authority-pdf-sections.test.mjs
node scripts/test-flooding-verification-phase47c.mjs
```

Das Flooding Regression Gate umfasst nach Integration von 47C.9C insgesamt 37 Testdateien.
