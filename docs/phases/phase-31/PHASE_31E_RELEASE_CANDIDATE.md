# Phase 31E - Release Candidate

## Ziel

Markierung des stabilisierten 1.3.x-Standes als Release Candidate `1.3.0-rc.1` nach Abschluss von Runtime Review, lokalem Build-/Testlauf, modulweisem Smoke Audit und Release-Dokumentation.

## Umsetzung

- `package.json` auf `1.3.0-rc.1` gesetzt.
- `package-lock.json` auf `1.3.0-rc.1` synchronisiert.
- sichtbare App-Version in `index.html` auf `1.3.0-rc.1` gesetzt.
- `APP_VERSION` in `js/core/app.js` auf `1.3.0-rc.1` gesetzt.
- Service-Worker Cache-Key auf `techcalc-pro-1.3.0-rc.1` gesetzt.
- RC-Dokument unter `docs/release/RELEASE_CANDIDATE_1.3.0_RC1.md` ergänzt.

## Quality Gate

- `npm run build`: bestanden.
- `npm run audit:imports`: bestanden.
- `npm test`: bestanden.

## Entscheidung

Phase 31E ist abgeschlossen. Der Stand ist als `1.3.0-rc.1` markiert und darf bis zur finalen Freigabe nur noch Bugfixes, Regression-Fixes, Dokumentationskorrekturen und notwendige Test-/Audit-Korrekturen erhalten.
