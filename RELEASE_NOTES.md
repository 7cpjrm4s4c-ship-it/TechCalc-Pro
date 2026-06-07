# TechCalc Pro 1.3.0 — Phase 20B.1 Retrofit

## Druckhaltung: Platform Mount Migration

- `pressure-holding` nachträglich auf `createPlatformModule(...)` umgestellt.
- Legacy-Import `mountModule` aus dem Druckhaltungsmodul entfernt.
- 20B.2 Saved Records und 20B.3 Result Renderer bleiben unverändert erhalten.
- Reihenfolge der Phase 20 korrigiert: 20B.1 wurde als Retrofit auf dem Stand 20B.3 nachgezogen.

## Checks

- Syntax-/Import-Check für `js/modules/pressure-holding/index.js` bestanden.
- Suche bestätigt: kein `mountModule` mehr im Druckhaltungsmodul.
