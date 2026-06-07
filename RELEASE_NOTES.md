# TechCalc Pro 1.3.0 – Phase 22C.1

## Einheitenrechner – Result Cleanup

- separate Result-Card `Umrechnung` entfernt
- Ergebnisbereich auf die relevante Card `Alle Werte` reduziert
- Eingabecard `Kategorie wählen` bleibt inklusive direkter Ausgabe erhalten
- Result-Model vereinfacht: kein `primary`-Result mehr, nur noch Gruppenmodell
- Regression ergänzt: `unit-converter-phase22c1-result-cleanup.test.mjs`
- Quality Gate erweitert

## Prüfung

- `npm test` vollständig bestanden
