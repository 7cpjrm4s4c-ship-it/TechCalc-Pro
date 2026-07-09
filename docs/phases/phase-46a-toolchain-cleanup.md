# Phase 46A – Toolchain Cleanup & Consolidation

## Ziel

Die Toolchain wird auf aktive, nachvollziehbare Pipeline-Skripte reduziert. Historische oder nicht verdrahtete Audit-Skripte werden aus dem aktiven Repository entfernt.

## Ausgangslage

Die externe Bewertung zu 1.3.3 stellte eine Tooling-Hygiene-Lücke fest: zahlreiche Skripte lagen im Verzeichnis `scripts/`, waren aber nicht Bestandteil von `package.json` oder `test:integration`.

## Analyse

- Ausgangsbestand: 82 `.mjs`-Skripte in `scripts/`
- Aktiv über `package.json` oder `scripts/test-integration.mjs`: 34 Skripte
- Nicht aktiv verdrahtet: 48 Skripte

## Design Review

Der aktive Tooling-Bestand soll nur aus Skripten bestehen, die durch einen Standardbefehl erreichbar sind:

- `npm run build`
- `npm run build:minified`
- `npm run lint`
- `npm test`
- `npm run test:integration`
- `npm run test:e2e`
- explizite Audit-Befehle in `package.json`

## Implementierung

- 48 nicht verdrahtete historische Audit-/Utility-Skripte entfernt
- neues Audit `scripts/audit-toolchain-cleanup-phase46a.mjs` ergänzt
- `audit:toolchain` in `package.json` ergänzt
- `audit:toolchain` in `npm run lint` eingebunden
- Release Notes für die App auf finale 1.3.3-Ansicht bereinigt
- Versionsstand der Entwicklungsbasis auf `1.3.4-dev.1` gesetzt

## Regression

Die Toolchain wird über folgende Gates abgesichert:

- `npm run lint`
- `npm test`
- `npm run test:integration`
- `npm run build`
- `npm run build:minified`

## Ergebnis

Der aktive Skriptbestand ist deutlich reduziert und prüfbar. Künftig schlägt `npm run lint` fehl, wenn unverdrahtete Skripte im aktiven `scripts/`-Verzeichnis liegen.

## Betroffene Bereiche

- Toolchain
- package.json
- Quality Manual / Teststrategie
- Release Notes
- Service Worker Versionsstand

## Referenzen

- QM-005 Test Strategy
- QM-004 Release Gates
- Architecture Baseline 1.3.3
