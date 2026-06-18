
## 1.3.0-rc.1 · Phase 37C.4B – Settings Accordion Body Visibility Fix

- Settings-Accordion Body-Visibility repariert.
- Offene Settings-Submenus synchronisieren `open`, `.is-open` und `aria-expanded`.
- Inhalte in PDF-Export, Release Notes, Feedback und Rechtliches bleiben sichtbar und im Drawer scrollbar.
- Keine Modul-Logik geändert.


## Phase 37C.2B — Drinking-Water Mobile Scroll Restore Dampening

- Trinkwasser-spezifische aggressive Scroll-Restore-Parameter entschärft.
- Aktive Touch-Scrolls unterdrücken jetzt opt-in Restore-Schreibzugriffe.
- ThemeController-Extraktion aus 37C.2 bleibt erhalten.
- Neuer Guard: `test:phase37c2b`.


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

### Phase 37C.2A – Theme Extraction Regression Fix

- Touch-Scroll-Regression nach 37C.2 im Trinkwasser-Modul isoliert.
- `bindNoClickScroll()` verwirft Viewport-Snapshots jetzt bei echter Touch-/Pointer-Bewegung und nativen Scroll-Events.
- `themeController` Initialisierung idempotent gehärtet, um doppelte Listener auszuschließen.
- Neuer Guard: `test:phase37c2a`.

### Phase 37C.2D – Drinking Water Surface Confirm Isolation

- Trinkwasser Dynamic Renderer ignoriert `surface:confirm`-Events ohne trinkwasserrelevante State-Keys jetzt vor `preserveScroll()`.
- `isDynamicDrinkingWaterAction()` weist irrelevante `surface:confirm`-Events ebenfalls ab.
- Passive Klicks auf freie Trinkwasser-Flächen lösen keinen Vollrefresh mehr aus; aktive Edits werden weiterhin bereinigt.
- Dynamic-Renderer-Scroll-Preserve nutzt `skipDuringActiveTouch`.
- Neuer Guard: `test:phase37c2d`.

## Phase 37C.2E – Surface Confirm No-Op Suppression

- Suppressed no-op `surface:confirm` commits in the central event pipeline.
- `commitAllFields()` now compares DOM field values against state before emitting.
- Passive taps/scroll-end clicks on module background no longer notify the store when no field changed.
- Deferred input confirmation remains supported through `input:confirm`.
- Added `test:phase37c2e` guard.

## Phase 37C.2F – Copper Pipe Dimension Correction

- Corrected copper pipe large-diameter master data for DN65, DN80 and DN100.
- DN65 now uses `76,1 × 2,0` with `di 72.1`.
- DN80 now uses `88,9 × 2,0` with `di 84.9`.
- DN100 now uses `108 × 2,0` with `di 104`.
- Added `test:phase37c2f` guard.


### Phase 37C.3 – Settings Controller Extraction

- Settings-Drawer-Logik aus `js/core/app.js` extrahiert.
- Neuer Controller: `js/platform/shell/settingsController.js`.
- Settings-Scroll-Lock, Submenu-Persistenz, Escape-/Outside-Click und iOS-Touchmove-Guard bleiben erhalten.
- Service-Worker-Precache um Settings-Controller erweitert.
- Guard ergänzt: `test:phase37c3`.

### Phase 37C.4 – Release Notes Controller Extraction

- Release-Notes-Parser, Renderer und Loader aus `js/core/app.js` extrahiert.
- Neuer Controller: `js/platform/shell/releaseNotesController.js`.
- Versionsanzeige und dynamisches Laden von `RELEASE_NOTES.md` bleiben erhalten.
- Service-Worker-Precache um Release-Notes-Controller erweitert.
- Guard ergänzt: `test:phase37c4`.

## 1.3.0-rc.1 – Phase 37C.4A Settings Drawer Scroll Fix

- Settings-Drawer auf einen stabilen inneren Scroll-Host umgestellt.
- Lange Accordion-Inhalte bleiben vollständig erreichbar.
- Bottom-/Safe-Area-Padding für Mobile, Desktop Responsive und Hosted Preview erweitert.
- Accordion-Open-State scrollt deterministisch in den sichtbaren Drawer-Bereich.
- Keine Modul- oder Runtime-Berechnungslogik geändert.

## 1.3.0-rc.1 · Phase 37C.4D – Settings Accordion Chevron Layer Fix

- Settings-Accordion-Layering korrigiert.
- Pfeile geschlossener Accordions scheinen nicht mehr durch geöffnete Cards.
- Drawer-Body und Submenus erhalten isolierte Stacking Contexts.
- Keine Runtime- oder Modul-Logik geändert.

## 1.3.0-rc.1 · Phase 37C.4C – Settings Drawer Surface Opacity Fix

- Settings Drawer Hintergrund auf opake Surface-Ebene gehärtet.
- Accordion-Bodies und Settings Cards erhalten eigene undurchsichtige Surface-Hintergründe.
- Durchscheinen des Modulhintergrunds hinter Settings-Texten behoben.
- Keine Änderung an Modul- oder Settings-Controller-Logik.
