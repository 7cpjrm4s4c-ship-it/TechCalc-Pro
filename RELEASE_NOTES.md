
## 1.3.0-rc.1 · Phase 37C.1 – App-Shell Decomposition Map

- `app.js` responsibility map created without runtime changes.
- 13 app-shell responsibilities identified and mapped to target controllers.
- Incremental extraction order defined for 37C.2 through 37C.6.
- Highest-risk extraction flagged: settings drawer scroll/focus/touch behavior.
- Added guard: `test:phase37c1`.

## Phase 37B.3 - Service Worker Offline Runtime Hardening

- Service-Worker-Precache auf vollstaendigen Runtime-Surface erweitert: alle `js/**/*.js`, alle CSS-Dateien, Shell-Dateien und Icons.
- Offline-All-Module-Reload-Smoke fuer alle 11 Modulrouten in Playwright-Spec ergaenzt.
- Neuer Guard `test:phase37b3` prueft Precache-Vollstaendigkeit, Navigation-Fallback, Cache-First-with-Refresh, versionierten Cache und Client-Update-Message.
- Keine Feature-Aenderung; gezielte PWA-/Offline-Haertung fuer den 1.3.0 RC.

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


## Phase 37B.1A - Browser Console Cleanup

- Fix: `renderer.js` definiert jetzt `cssEscape()` fuer stabile Viewport-/Anchor-Selektoren.
- Fix: `safeReplaceContent()` ist gegen detached roots und reentrant DOM-Replacement-Races gehaertet.
- Test: `test:phase37b1a` ergaenzt.
- Validierung: Build ok, Phase 37B.1 Preflight ok, Module Smoke 11/11.
- Runtime-Logik: keine Feature-Aenderung, gezieltes Browser-Hardening.

## Phase 37B.1B — Browser Runtime Error Elimination

- EventPipeline: fehlende globale `PlatformFocusManager`-Referenz durch expliziten `preserveFocusDuring`-Import ersetzt.
- Trinkwasser Dynamic Renderer: Dynamic-Island `innerHTML`-Writes gegen stale/detached DOM-Anker gehärtet.
- Neuer Guard: `test:phase37b1b`.


## Phase 37B.2 - Browser Runtime Smoke Coverage Expansion

- Playwright-Smoke-Spec um Saved-Record-, Dynamic-Renderer-, Enter-/Tab-, Mobile-Nav-, Scroll-Lock- und Offline-Reload-Szenarien erweitert.
- Bekannte externe Browser-Meldungen werden als Nicht-App-Befund gefiltert; echte App-Errors bleiben testrelevant.
- Neuer Guard: `test:phase37b2`.
- Keine Runtime-Logik geaendert.
## 1.3.0-rc.1 - Phase 37B.4 Documentation Consolidation

- Consolidated `docs/phases` from 145 historical markdown files to 25 phase-level markdown files.
- Replaced nested phase/subphase note folders with one summary file per phase family.
- Added `audit:phase37b4` and `test:phase37b4` guards.
- Preserved critical regression contracts for Phase 12, Phase 13, Phase 16, Phase 27, Phase 37A and Phase 37B inside consolidated files.
- Runtime logic unchanged.


## 1.3.0-rc.1 · Phase 37C.2 – Theme Controller Extraction

- Theme-Initialisierung, Theme-Persistenz und Theme-Button-Binding aus `js/core/app.js` extrahiert.
- Neuer Shell-Controller: `js/platform/shell/themeController.js`.
- `app.js` von 616 auf 588 Zeilen reduziert.
- Neuer Guard: `test:phase37c2`.
- Service-Worker-Precache um den neuen Theme-Controller ergänzt.
- Keine Modul- oder Feature-Änderung.
