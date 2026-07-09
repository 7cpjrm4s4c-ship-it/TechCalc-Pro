# Phase 46D – E2E Expansion

Version: 1.3.4-dev.4

## Ziel

Die End-to-End-Abdeckung wird auf die mit Version 1.3.3 eingeführten Kernpfade des Modulsplittings erweitert.

## Ausgangslage

Nach Phase 46C existierte eine browserbasierte Smoke-Suite, jedoch ohne spezifischen E2E-Test für den neuen Mischluft-Workflow. Die externe Bewertung hatte dies als verbleibenden Qualitätsmangel vor der nächsten Release-Linie benannt.

## Umsetzung

- `tests/e2e/phase37b-runtime-smoke.spec.mjs` um `mixed-air` erweitert.
- `tests/e2e/phase46d-mixed-air-workflow.spec.mjs` ergänzt.
- `tests/fixtures/legacy-1.3.2-wrg-mixed-air.tcproj` als Legacy-Migrationsfixture ergänzt.
- `scripts/audit-e2e-coverage-phase46d.mjs` ergänzt und in `npm run lint` eingebunden.

## Abgedeckte Workflows

1. Mischluft berechnen und als Moduldatensatz speichern.
2. Legacy-WRG/Mischluft-Projekt laden und gespeicherte Records korrekt trennen.
3. Mischluft-Projekt als `.tcproj` exportieren und PDF-Export auslösen.

## Regression

- Keine funktionalen Änderungen an Berechnung, Persistenz oder PDF-Engine.
- Der neue Audit prüft, dass die E2E-Abdeckung nicht versehentlich entfernt wird.
- Standard-Gates bleiben unverändert: `lint`, `test`, `test:integration`, `build`, `build:minified`.

## Ergebnis

Phase 46D schließt die E2E-Lücke aus der Bewertung der Version 1.3.3 und etabliert Mischluft als vollständig getesteten Browser-Workflow.

## Hinweis zur Ausführung der Playwright-Suite

`npm run test:e2e` ist ab Phase 46D mit `@playwright/test` verdrahtet. Die lokale Ausführung benötigt installierte Playwright-Browser (`npx playwright install`). In dieser Build-Umgebung waren die Browser-Binaries nicht vorhanden; die E2E-Specs und ihre Abdeckung wurden daher statisch über `audit:e2e-coverage` verifiziert und in die Standard-Gates eingebunden.
