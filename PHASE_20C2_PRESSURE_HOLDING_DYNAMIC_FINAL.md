# Phase 20C.2 – Druckhaltung Dynamic Renderer Finalisierung

## Ziel

Saved-Record-Panel der Druckhaltung darf beim Tippen in `plantName` nicht mehr strukturell neu gerendert werden.

## Änderungen

- `plantName` aus den strukturellen Saved-Record-Triggern entfernt.
- `plantName` wird weiterhin über `syncFields()` per `setInputValue()` synchronisiert.
- Saved-Record-Panel rendert nur noch bei:
  - `savedPlants`
  - `activePlantId`
  - `expandedPlantId`
  - `saved:*`
  - `pressure:*`
- Regression erweitert: Änderung von `plantName` rendert nur Result, nicht Saved-Panel.

## Prüfung

- `node --check js/platform/dynamicRenderer/index.js`
- `node --check js/modules/pressure-holding/index.js`
- `pressure-holding-phase20b1-platform-mount.test.mjs`
- `pressure-holding-phase20b2-saved-record-controller.test.mjs`
- `pressure-holding-phase20b3-result-renderer.test.mjs`
- `pressure-holding-phase20c-dynamic-renderer.test.mjs`

Status: bestanden.
