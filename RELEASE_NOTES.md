# TechCalc Pro 1.3.0 – Phase 20D

Druckhaltung wurde auf den finalen Plattformvertrag entkernt.

## Änderungen
- `js/modules/pressure-holding/controller.js` ergänzt
- `js/modules/pressure-holding/viewModel.js` ergänzt
- `js/modules/pressure-holding/view.js` ergänzt
- `js/modules/pressure-holding/index.js` auf reinen Plattformadapter reduziert
- `migrationStatus` um `phase-20d-platform-contract` erweitert
- Regression `pressure-holding-phase20d-platform-contract.test.mjs` ergänzt
- bestehende Phase-20B/20C-Regressionen an die neue Dateistruktur angepasst

## Prüfung
- Syntax-/Import-Check bestanden
- vollständiges `npm test` / Quality Gate bestanden
