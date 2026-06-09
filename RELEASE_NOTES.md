# TechCalc Pro 1.3.0 – Phase 24D

## WRG / Mischluft Hardening

- `migrationStatus` auf `phase-24d-hardening` erweitert.
- Projekt-Restore für WRG/Mischluft normalisiert alte und neue RLT-Gerätepfade:
  - `rltDevices`
  - `state.savedRltDevices`
  - `state.rltDevices`
- Legacy-RLT-State wird beim Laden in `savedRltDevices` überführt.
- `projectStorage.js` schreibt keine alten RLT-Memory-Helper mehr an.
- Neuer Regressionstest: `heat-recovery-phase24d-hardening.test.mjs`.
- Neues NPM-Script: `test:heat-recovery-phase24d`.

## Validation

- `npm run test:imports`
- `npm run test:saved-records`
- `npm run test:heat-recovery-phase24b1`
- `npm run test:heat-recovery-phase24b2`
- `npm run test:heat-recovery-phase24b3`
- `npm run test:heat-recovery-phase24c`
- `npm run test:heat-recovery-phase24d`
- `npm run audit:platform`


## Phase 25B.2B.2C - Trinkwasser Speicherdialog Spacing

- Speicherdialog-Accordions auf globale Plattformabstände ausgerichtet.
- Record-Cards, Inline-Stats und Verbraucherlisten im Trinkwasser-Modul verwenden jetzt konsistente `var(--ui-gap)`-Abstände.
- Überschrift und Unterüberschrift der Speicherdialoge bleiben dauerhaft zweizeilig mit sauberem Zeilenversatz.
