# TechCalc Pro UI Refactor – Phase 11

Phase 11 härtet den lauffähigen Phase-10-Stand weiter.

## Änderungen
- Neue Kaskadenschicht `tc-ui-v11`.
- Zentrale Variablen für App-Breite, Grid-Abstände, Panel-Padding, Feldhöhe und Result-Zeilenhöhe.
- Einheitliche Result-Zeilenlogik mit stabiler Label-/Wert-Aufteilung.
- Modul-Akzente zentralisiert.
- Desktop-Zwei- und Drei-Spaltenraster abgesichert.
- Mobile Layouts bleiben einspaltig; Bottom-Navigation bleibt fixiert.
- Print/PDF-Schutz bleibt erhalten.

## Nicht geändert
- Keine Berechnungslogik.
- Keine PDF-Engine.
- Keine Service-Worker-Logik.
