# TechCalc Pro 1.3.0 – Phase 24B.2

## WRG / Mischluft – Result Renderer + Dynamic Islands

- Ergebnisdarstellung auf `buildHeatRecoveryResultModel` und `renderResultModel` konsolidiert.
- Legacy-Renderer `mainResult`, `resultCard`, `resultRows` im Modul entfernt.
- WRG- und Mischluft-Ergebnisse in Primary/Groups/Notices-Struktur überführt.
- ViewModel erzeugt jetzt das zentrale `resultModel`.
- Dynamic-Island `outputs` rendert über Plattform-ResultRenderer.
- Regressionstest `heat-recovery-phase24b2-result-renderer-dynamic-islands.test.mjs` ergänzt.

## Geprüft

- `npm run test:imports`
- `npm run test:saved-records`
- `npm run test:heat-recovery-phase24b1`
- `npm run test:heat-recovery-phase24b2`
- `npm run audit:platform`
