# Phase 21B.1 – Rohrdimensionierung Platform Mount

## Geändert
- `js/modules/pipe-sizing/index.js`
  - `mountModule` entfernt
  - `createPlatformModule(...)` eingebunden
  - `bindPipeSizingActions` als Plattform-`bind` gesetzt
- `js/modules/pipe-sizing/config.js`
  - `migrationStatus` um `phase-21b1-platform-mount` ergänzt

## Geprüft
- `node --check` für Rohrdimensionierungsdateien
- `npm run test:imports` bestanden
