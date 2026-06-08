# TechCalc Pro 1.3.0 - Phase 24C

## WRG / Mischluft Plattformvertrag

- Dynamic-Renderer aus `view.js` in `dynamicRenderer.js` ausgelagert.
- `view.js` rendert nur noch View/View-Islands und enthält keine Berechnung oder DOM-Patch-Logik mehr.
- `index.js` bleibt dünner Plattformadapter auf `createPlatformModule`.
- Plattformvertrag durch neuen Regressionstest `heat-recovery-phase24c-platform-contract.test.mjs` abgesichert.
- Bestehende 24B.1-24B.3 Regressionen an die finale Schichttrennung angepasst.

## Validierung

- `npm run test:imports`
- `npm run test:saved-records`
- `npm run test:heat-recovery-phase24b1`
- `npm run test:heat-recovery-phase24b2`
- `npm run test:heat-recovery-phase24b3`
- `npm run test:heat-recovery-phase24c`
- `npm run audit:platform`
