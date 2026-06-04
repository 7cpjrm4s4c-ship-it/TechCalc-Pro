# Phase 18B.1 - Heizung/Kälte Result-Model

Basis: Phase 17C.17.

Ziel dieser Phase ist die erste Entkopplung des Moduls Heizung/Kälte von eigener Ergebnisdarstellung, ohne den stabilen Modul-Mount bereits zu ersetzen.

## Umsetzung

- Neues Modul-Result-Model: `js/modules/heating-cooling/results.js`
- Ergebnisdaten werden als strukturierte Result-Modelle bereitgestellt:
  - `buildHeatingCoolingResultModel()`
  - `buildPipeRecommendationModel()`
  - `mediumRows()`
  - `pipeRows()`
- `js/platform/resultRenderer/index.js` wurde erweitert:
  - `renderStatsGroup()`
  - `renderRecommendationCard()`
- `js/modules/heating-cooling/index.js` rendert Ergebnis, Medium-Stats und Rohrdimensionsempfehlung über den Plattform-Renderer.

## Bewusst beibehalten

- `mountHeatingCooling()` bleibt erhalten.
- `updateHeatingCoolingDynamic()` bleibt erhalten.
- Leitungsabschnitte bleiben vorerst im Modul.

Diese Bereiche werden in folgenden 18B-Phasen migriert, damit das stabile Verhalten aus Heizung/Kälte nicht durch einen zu großen Umbau gefährdet wird.

## Ergebnis

Heizung/Kälte liefert erste Ergebnisdaten nach Plattformvertrag, während die vorhandene dynamische Modulsteuerung stabil bleibt.

## Regression

- Neuer Test: `tests/heating-cooling-phase18b1-result-model.test.mjs`
- `npm test` erfolgreich.
