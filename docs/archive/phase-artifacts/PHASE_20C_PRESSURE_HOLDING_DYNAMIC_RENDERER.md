# Phase 20C – Druckhaltung Dynamic Renderer

## Ziel
Druckhaltung delegiert dynamische UI-Aktualisierungen an den zentralen `platform/dynamicRenderer`.

## Änderungen
- `createPressureHoldingDynamicRenderer()` in `js/platform/dynamicRenderer/index.js` ergänzt.
- Druckhaltung an `dynamicUpdate` / `isDynamicAction` des `createPlatformModule` angebunden.
- Dynamische Inseln in `js/modules/pressure-holding/index.js` eingeführt:
  - `basis`
  - `volume-fields`
  - `temperature-fields`
  - `pressure-fields`
  - `saved-records`
  - `holding-options`
  - `result`
- Strukturwechsel werden gezielt gerendert:
  - `waterContentMode`
  - `connectionType`
  - `holdingType`
  - Saved-Record-Aktionen
- Normale Zahlen-/Select-Eingaben aktualisieren Ergebnis und Feldwerte ohne kompletten Modul-Remount.
- `migrationStatus` um `phase-20c-dynamic-renderer` ergänzt.

## Regression
- `tests/pressure-holding-phase20c-dynamic-renderer.test.mjs`

## Prüfung
- Syntax-Check für geänderte Dateien bestanden.
- Import-Smoke-Test für Druckhaltung bestanden.
- Phase 20B.1 / 20B.2 / 20B.3 / 20C Regressionen bestanden.
