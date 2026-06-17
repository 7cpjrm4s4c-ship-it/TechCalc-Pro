# Phase 37B.1 — Browser Runtime Execution

- Added zero-dependency static server for Playwright runtime smoke execution.
- Replaced `npx http-server` dependency in Playwright config with `node scripts/serve-static.mjs`.
- Added `test:phase37b1` guard and runtime preflight report.
- App runtime logic unchanged.

## 1.3.0-rc.1 · Phase 37A abgeschlossen

- Platform Convergence Audit abgeschlossen.
- P1-Findings nach 37A.1 vollständig geschlossen.
- Runtime-`migrationStatus`-Breadcrumbs nach 37A.2 vollständig entfernt.
- Finaler Abschluss-Guard `test:phase37a-final` ergänzt.
- Restbestand bewusst auf 6 P2-Findings begrenzt: CSS-Spezialisierungen, Drinking-Water Event-Density und zwei Utility-Kandidaten für 37B.

## 1.3.0-rc.1 · Phase 37A.2

- Removed runtime `migrationStatus` breadcrumbs from all module configs.
- Added `test:phase37a2` metadata cleanup guard.
- Platform convergence backlog reduced from 17 P2 findings to 6 P2 findings.

# TechCalc Pro 1.3.0

TechCalc Pro 1.3.0 is the platform consolidation release.

Primary documentation:

- `docs/release-notes/RELEASE_NOTES_1.3.0.md`
- `docs/changelog/CHANGELOG_1.3.0.md`
- `docs/release/MIGRATION_SUMMARY_1.3.0.md`
- `docs/release/KNOWN_LIMITATIONS_1.3.0.md`

Release-hardening status after Phase 31D:

- Runtime review completed
- Local build/test/import gates established
- Module smoke audit completed for 11 active modules
- Audit artefacts stored under `docs/audits/json/`
- Release documentation consolidated

## 1.3.0-rc.1 / Phase 34B

- `components.css` neu aufgebaut und von 5027 auf 747 Zeilen reduziert.
- Globale UI-Komponenten zentralisiert; Modul-Ausnahmen nach `css/modules.css` isoliert.
- CSS-Quality-Gate ohne `!important` in `components.css` bestanden.
### Phase 35D – Saved Dialog Parity

- Speicherdialoge von Druckhaltung, Schmutzwasser und Regenwasser an den stabilen Rohr-/Puffer-Workflow angeglichen.
- Schmutzwasser/Regenwasser nutzen für Saved-Record-Aktionen denselben Line-Section-Controller-Pfad statt eigener Runtime-Sonderlogik.
- Regenwasser-Flächeneditor behält sein Reset-Verhalten nach dem Speichern.
- Phase-35D Regressionstest ergänzt.


## Phase 35F – Save Dialog Module Cleanup

- Druckhaltung, Schmutzwasser und Regenwasser auf Single-Controller-Speicherpattern bereinigt.
- Legacy-`savedRecords`-Reste aus Schmutzwasser/Regenwasser entfernt.
- Save-Dialog-Tests auf aktuelles `createLineSectionController`-Pattern aktualisiert.

## Version 1.3.0-rc.1 - Phase 37B Browser Runtime Smoke Baseline
- Playwright-Konfiguration für Chromium Desktop und WebKit Mobile ergänzt.
- Browser-Smoke-Spezifikation für Modulwechsel, Saved-Record-Erreichbarkeit, mobile Navigation, Settings-Scroll-Lock und Service-Worker-Offline-Reload angelegt.
- Node-Gate `test:phase37b` ergänzt, das die Browser-Testschicht statisch validiert und den Importcheck ausführt.
- Keine Runtime-Logik geändert.
