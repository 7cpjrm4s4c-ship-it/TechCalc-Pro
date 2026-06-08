# TechCalc Pro 1.3.0 - Phase 24B.3

## WRG / Mischluft Dynamic Controller Hardening

- WRG/Mischluft sign-toggle binding auf delegierten Controller umgestellt.
- Dynamic-Island-Replacement fuer Eingabebloecke bleibt damit nach Moduswechsel stabil.
- Plattformadapter `index.js` bleibt entkernt.
- RLT-Geraete bleiben auf `createLineSectionController`.
- Neuer Regressionstest `heat-recovery-phase24b3-dynamic-controller-hardening.test.mjs`.

## Checks

- `npm run test:imports`
- `npm run test:saved-records`
- `npm run test:heat-recovery-phase24b1`
- `npm run test:heat-recovery-phase24b2`
- `npm run test:heat-recovery-phase24b3`
- `npm run audit:platform`
