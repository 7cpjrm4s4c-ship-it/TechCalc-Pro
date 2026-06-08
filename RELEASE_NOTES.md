# TechCalc Pro 1.3.0 – Phase 23E Pufferspeicher Hardening

## Pufferspeicher

- Phase 23E Hardening abgeschlossen.
- `migrationStatus` um `phase-23e-hardening` erweitert.
- Saved-Record-Restore für alte `savedCalculations`-Projektstände gehärtet.
- Saved-Record-Dynamic-Island-Attribut auf `data-buffer-dynamic` vereinheitlicht.
- Plattform-Audit erkennt `createLineSectionController` jetzt als zentralen Saved-Record-Pfad.
- Neuer Regressionstest: `tests/buffer-storage-phase23e-hardening.test.mjs`.
- Neuer npm-Script: `npm run test:buffer-storage-phase23e`.

## Validierung

- `npm run test:imports`
- `npm run test:saved-records`
- `node tests/buffer-storage-phase23c1-platform-contract.test.mjs`
- `node tests/buffer-storage-phase23d-platform-contract.test.mjs`
- `npm run test:buffer-storage-phase23e`
- `npm run audit:platform`
