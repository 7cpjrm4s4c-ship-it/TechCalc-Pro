# TechCalc Pro 1.3.1 Beta 4

- Globales iOS-18-Flat-Design als verbindlicher App-Kontraststandard ergänzt.
- Liquid-Glass-Overrides für Module, Accordions, Dropdowns, Eingabefelder, Karten und Ergebnisflächen zurückgenommen.
- Mobile Startseite optimiert: drei Kacheln pro Displaybreite, kompaktere Modul-Kacheln und direkte Modul-Verknüpfung.
- Dashboard bleibt feste Startseite beim App-Start; App-Logo und bestehender Schriftzug bleiben unverändert.



## Version 1.3.1 Beta 4
- Dashboard als feste Startseite beim App-Start etabliert.
- Mobile Home-Ansicht mit Favoriten, zuletzt verwendeten Projekten, Alle-Module-Kacheln und zentralem „Neues Projekt“-Button umgesetzt.
- Bestehendes App-Logo und bestehender Header/Schriftzug unverändert beibehalten.
- Mobile Modul-Navigation auf der Startseite ausgeblendet, um doppelte Navigation und Überlagerungen zu verhindern.
- Liquid-Glass-Anteil reduziert; Controls, Dropdowns und Accordion-Flächen auf kontrastreicheren iOS-Flat-Look umgestellt.
## Version 1.3.1 Beta 4 — Dashboard / TSS System Icons / UI Controls

- Neues Dashboard-Modul als Startseite ergänzt.
- Eigenes TechCalc Symbol System (TSS) für Systemicons, Chevrons, Aktionen, Status und Modul-Schnellzugriffe ergänzt.
- iOS-inspirierte UI-Control-Schicht für Dropdowns, Buttons, Accordions und Touch-Animationen umgesetzt.
- App-Icon, Markenname und bestehender Header bleiben unverändert.
- Kein zusätzliches Hamburger-Menü im Dashboard-Layout.

## Version 1.3.1 Beta 1 — Liquid Glass Design System Baseline

- Neue Beta-Linie 1.3.1 eröffnet; Beta-Nummer läuft ab jetzt pro ZIP-Artefakt mit.
- Eigenes TechCalc-Pro-Modul-Iconset als SVG ergänzt; keine Apple-Systemicons oder Apple-App-Assets enthalten.
- Liquid-Glass-Stylesheet als additive Designsystem-Schicht ergänzt und in die App-Shell eingebunden.
- Aktuelle Entwicklungsbasis aus `1.3.0-development-netlify-v5-updated` übernommen, inklusive angepasster AGB in `docs/legal/agb.html`.
- Service-Worker-Cache und Precaching auf `1.3.1-beta.1` synchronisiert.

## Version 1.3.0 — Mobile Feedback Zoom Scope Correction

- iOS/PWA Input-Zoom-Fix auf das Feedback-Formular begrenzt.
- Globalen `input/select/textarea/button`-Font-Override entfernt, damit Bottom-Navigation und Pufferspeicher-Segmente wieder ihre responsive Schriftgröße nutzen.
- Service-Worker-Revision auf `1.3.0-final-mobile-feedback-zoom-v5` aktualisiert.

# Version 1.3.0 — Official Deployment Metadata Fix

Aktuelle Versionsanzeige wird aus der finalen `1.3.0`-Release-Notes-Quelle synchronisiert. Version-kritische App-Shell-Dateien werden im Service Worker network-first behandelt, damit alte `1.3.0-rc.1`-Caches die Anzeige nicht mehr überlagern.

## Version 1.3.0 — Official Deployment

- RC-Phase abgeschlossen und Version auf `1.3.0` finalisiert.
- Service-Worker-Cache, App-Version, Feedback-Metadaten und Release-Notes-Anzeige auf `1.3.0` synchronisiert.
- Netlify-Entwicklungspaket und neutrales Drittanbieter-Deploy-Artefakt werden getrennt ausgeliefert.
- Release-Pfad: `npm ci` → `npm run build:minified` → Deployment von `dist/`.

## Phase 39I — Button Accent Finalization

- HX-Diagramm: `Diagramm leeren` nutzt jetzt die reguläre blaue Aktzentfläche statt Ghost/Grau.
- Schmutzwasser: `Gegenstand hinzufügen` nutzt die reguläre Aktzentfläche.
- Trinkwasser: `Verbraucher zur Nutzungseinheit hinzufügen` und `Verbraucher zur Gruppe hinzufügen` nutzen die reguläre Aktzentfläche.
- Layout/DOM-Anordnung bleibt unverändert; es wurde nur die Button-Variante angepasst.

## Phase 39H — RC UI/State Bugfixes

- Trinkwasser-Draft-Verbraucher nutzen jetzt denselben Collection-/Mengenfeld-Layoutvertrag wie Schmutzwasser.
- h,x gespeicherte Prozesse hydratisieren sichtbare Eingabefelder wieder direkt aus dem gespeicherten Snapshot.
- h,x gespeicherte Prozessauswahl aktualisiert Prozessauswahl, Ergebnisliste und Diagramm sofort im dynamischen Pfad.
- h,x „Diagramm leeren“ läuft nicht mehr in den reinen Saved-Records-Refresh, sondern leert auch Diagramm- und Ergebnis-Islands.
- Ergänzt `audit:rc-ui-state` im Integration-Gate.
- Keine Berechnungslogik geändert.


## Phase 39G — Service Worker Metadata Display Fix

- Service-Worker-Revision wird jetzt automatisch aus `package.json` und dem aktuellen Release-Notes-Heading erzeugt.
- Release-Notes-Parser unterstützt Phase-Headings ohne explizite Versionsnummer.
- Versionsanzeige synchronisiert `data-app-version-current`, `#appVersion` und Feedback-Hidden-Input.
- Phase-38D.10-Guard akzeptiert die generierte Service-Worker-Revision statt eines alten hardkodierten Revisionsstrings.
- Keine Fachlogik geändert.


## Phase 39F — Feedback Offline Fallback

- Feedback-Formular erkennt Offline-Zustand über `navigator.onLine` und ruft dann keinen Netzwerk-Submit auf.
- Feedback-Payloads werden bei Offline, fehlendem `fetch` oder fehlgeschlagenem Submit lokal unter `techcalc.feedback.offlineQueue.v1` zwischengespeichert.
- Nutzer erhalten eine sichtbare Statusmeldung statt eines stillen Fehlers.
- Ergänzt `audit:feedback-offline`, `scripts/audit-feedback-offline-fallback-phase39f.mjs` und `tests/platform-feedback-offline-fallback-phase39f.test.mjs` im Integration-Gate.
- Keine Berechnungslogik geändert.


## Phase 39B — Versioned Build Artifact Correction

- `build:minified` now produces a deterministic `dist/` deploy artifact.
- `dist/build-info.json` records package name, version, artifact id, minification mode and SHA-256 file manifest.
- Added `netlify.toml` so Netlify builds with `npm run build:minified` and publishes `dist`.
- Added `audit:artifacts` / `scripts/audit-versioned-build-artifact-phase39b.mjs`.
- Added `.gitignore` entries for generated build and test artifacts.

## Phase 39C — Service Worker Version Injection

- Service-Worker-Cache-Name wird jetzt vom Precache-Generator aus `package.json` (`name` + `version`) abgeleitet.
- `scripts/generate-precache-manifest.mjs --check` validiert nun Manifest und Cache-Version ohne Schreibzugriff.
- Phase-37B.3-Service-Worker-Audit auf dynamische Paketversion statt hardkodierter RC-Version umgestellt.
- Neuer Guard: `scripts/audit-service-worker-version-injection-phase39c.mjs` im Integration-Gate.
- Keine Fachlogik geändert.


## Phase 38D.10 — Pufferspeicher Vergleich vollständig entfernt

- Entfernt den Vergleich als auswählbare Berechnungsart vollständig aus dem Pufferspeicher-Pfad.
- Erzwingt genau drei zulässige Berechnungsarten: Mindestlaufzeit, Abtauung, Wasservorlage.
- Normalisiert alte gespeicherte `compare`-States weiterhin defensiv auf `runtime`.
- Erhöht die Service-Worker-Revision, damit Mobile-Clients keine alte Switch-Struktur aus dem Cache behalten.
- Ergänzt `test:phase38d10` gegen erneute Compare-Strukturen im Pufferspeicher-Modul.

# Phase 38D.6 – Buffer Storage Compare Regression Rollback

- Reverts the risky 38D visual alias cleanup for the Pufferspeicher render path to the last known good 38C contract.
- Keeps 38E low-end rendering hardening, 38F optional esbuild minification and 38G package hygiene.
- Bumps the service-worker cache name so mobile/PWA clients cannot continue using stale CSS/JS.

## Phase 38E — Low-End Mobile Rendering Hardening

- Moved active `backdrop-filter` / `-webkit-backdrop-filter` blur usage behind explicit `@supports` blocks.
- Added opaque fallback backgrounds for cards, app header, safe-area header and module navigation.
- Kept deliberate `backdrop-filter: none` guards for settings surfaces unchanged.
- Added `scripts/audit-low-end-mobile-rendering-phase38e.mjs` to the integration gate.
- Keine Fachlogik geändert.


## Phase 38D — UI Alias Cleanup

- Removed visual `dw-*` / `ph-*` class aliases from shared component CSS and module markup.
- Kept semantic module data hooks such as `data-dw-*`, `data-ph-*` and h,x diagram-specific classes intact.
- Added `scripts/audit-ui-alias-cleanup-phase38d.mjs` to the integration gate to prevent visual alias regressions before RC freeze.

## 1.3.0-rc.1 · Phase 38B – Test Script Consolidation

- `package.json` auf die RC-Standard-Gates `test`, `test:integration` und `test:e2e` reduziert.
- Schneller lokaler Testlauf in `scripts/test-fast.mjs` ausgelagert.
- Integrations-Gate in `scripts/test-integration.mjs` gebündelt.
- Historische Phase-Tests bleiben im Repository, sind aber nicht mehr als einzelne npm-Standard-Scripts exponiert.
- Phase-37-Audits auf die konsolidierte Script-Oberfläche angepasst.
- Keine Fachlogik geändert.

## Phase 37F – AGB Integration

- AGB als statische Legal-Seite unter `docs/legal/agb.html` ergänzt.
- Settings-Menü unter „Rechtliches & App“ mit aktivem AGB-Link erweitert.
- Service-Worker-Precache um die AGB-Seite ergänzt.
- Keine Fachlogik geändert.


## 1.3.0-rc.1 – Phase 37D Performance Observability Baseline

- Performance Controller ergänzt.
- Browser-seitige `performance.mark()` / `performance.measure()` Baseline eingeführt.
- Messpunkte für App Init, Lazy Load, Modulwechsel, Mount, Dynamic Render, Render Commit, Saved Records und Service Worker ergänzt.
- Keine Fachlogik- oder UX-Änderung.

## 1.3.0-rc.1 · Phase 37C.7 – App-Shell Decomposition Closure

- App-Shell-Decomposition abgeschlossen.
- `js/core/app.js` bleibt als Composition Root für Bootstrap, Lazy-Module, Router, Session-Persistenz und globale Navigation erhalten.
- Shell-Controller-Boundaries für Theme, Settings, Release Notes, Feedback und Service Worker per Audit fixiert.
- Service-Worker-Precache-Abdeckung der Shell-Controller validiert.
- Neuer Audit: `audit:phase37c7`.
- Neuer Guard: `test:phase37c7`.
- Keine Runtime- oder Modul-Logik geändert.

## 1.3.0-rc.1 · Phase 37C.6 – Service Worker Controller Extraction

- Service-Worker-Registration und Cache-Update-Message-Handling aus `app.js` extrahiert.
- Neuer Controller: `js/platform/shell/serviceWorkerController.js`.
- `app.js` weiter auf Bootstrap-/Composition-Root-Aufgaben reduziert.
- Service-Worker-Precache um den neuen Shell-Controller erweitert.
- Neuer Guard: `test:phase37c6`.

## 1.3.0-rc.1 · Phase 37C.5 – Feedback Controller Extraction

- Feedback-Formular-Logik aus `app.js` in `js/platform/shell/feedbackController.js` extrahiert.
- Submit-, Status-, Payload- und Fehlerbehandlung gekapselt.
- Service-Worker-Precache um den neuen Shell-Controller erweitert.
- Neuer Guard: `test:phase37c5`.

## 1.3.0-rc.1 · Phase 37C.4F – Settings Accordion Stack Flow Fix

- Settings-Accordion-Inhalte in normalen Dokumentfluss zurückgeführt.
- Geöffnete Accordion-Bodies schieben nachfolgende Cards wieder korrekt nach unten.
- Overlay-/Layering-Regression aus 37C.4E beseitigt.
- Settings Drawer Scroll, opake Surfaces und Accordion Visibility bleiben erhalten.
- Neuer Guard: `test:phase37c4f`.
- Keine Modul-Logik geändert.


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

## 1.3.0-rc.1 · Phase 37E – RC Closure

- Release-Candidate-Abschlussaudit ergänzt.
- Neuer Guard: `audit:phase37e` / `test:phase37e`.
- App-Shell-, Browser-Runtime-, Offline- und Performance-Stabilisierungen aus Phase 37 zusammengeführt.
- Temporäre Trinkwasser-Debugpfade werden im RC-Audit blockiert.
- Keine Feature- oder Fachlogikänderung.

## Phase 37F.1 – AGB Replacement & Back Navigation

- AGB-Dokument unter `docs/legal/agb.html` durch finalen Textstand ersetzt.
- Herausgeber-/Kontaktinformationen ergänzt.
- Zurück-zur-App-Link ergänzt (`../../index.html`).
- Guard `test:phase37f1` ergänzt.

## 1.3.0-rc.1 · Phase 38C – Accessibility / Viewport Fix

- `user-scalable=no` aus dem App-Viewport entfernt.
- `maximum-scale=1` entfernt, damit Browser-Zoom nicht künstlich begrenzt wird.
- `width=device-width`, `initial-scale=1` und `viewport-fit=cover` bleiben erhalten.
- Guard ergänzt: `tests/platform-viewport-accessibility-phase38c.test.mjs`.
- Keine Änderung an Modul-, Berechnungs- oder Service-Worker-Logik.

## Phase 38F — Optional esbuild Minification

- Added `esbuild` as a development dependency.
- Added `scripts/minify-static-assets.mjs` for static asset minification into `dist/`.
- Preserved the existing ES-module file graph: no bundling, no import rewriting, no runtime path changes.
- Added optional `npm run build:minified` so the deployable `dist/` artifact is generated after precache generation and import validation, while keeping the standard build path unchanged.
- Added `scripts/audit-esbuild-minification-phase38f.mjs` and wired it into `npm run test:integration`.

## Phase 38G — RC Package Hygiene Closure

- Added a final release-package hygiene guard for RC-freeze readiness.
- Blocks generated artifacts such as `dist/`, `node_modules/`, coverage output, browser reports, source maps and packaged archives from entering the source release ZIP.
- Keeps optional esbuild minification explicit through `npm run build:minified`; the standard `npm run build` remains non-emitting.
- Added `scripts/audit-release-package-hygiene-phase38g.mjs` and wired it into `npm run test:integration`.

## Phase 38D.7 — Buffer Storage Compare Stack Root Fix

- Fixes the persistent Pufferspeicher compare-mode card spacing regression at the renderer boundary.
- `renderInputBlocks(vm)` now wraps compare-mode cards in a dedicated `.tc-stack.buffer-compare-stack`.
- Adds explicit grid/gap ownership for `[data-buffer-dynamic="input-blocks"]` and `.buffer-compare-stack`.
- Adds a margin fallback for adjacent compare cards and a static/render audit `test:phase38d7`.


## Phase 38D.8 — Buffer Storage Compare Global Stack Fix

- Moves the Pufferspeicher `input-blocks` dynamic island onto the global `.tc-stack` spacing contract.
- Removes the module-specific compare spacing workaround from `css/modules.css`.
- Compare mode again renders the three input cards as direct children of a globally spaced stack.
- Adds `test:phase38d8` to prevent competing buffer compare spacing exceptions from returning.

## Phase 38H — Netlify npm Registry Fix

- Fixed Netlify dependency installation failure caused by internal Artifactory `resolved` URLs in `package-lock.json`.
- Added `.npmrc` pinning installs to `https://registry.npmjs.org/`.
- Added `test:phase38h` guard to block private/internal npm registry references in npm/Netlify config files.

## Phase 39A — Release Script Hygiene

- Removed phase-specific `test:phase*` npm scripts from `package.json`.
- Added `scripts/audit-package-script-hygiene-phase39a.mjs` to prevent `test:phase*` scripts from regrowing.
- Wired the script hygiene audit into the integration gate.
- Kept historical phase audit files in `scripts/`; they remain callable directly by `node` and/or through the integration gate.

## Phase 39D — Core Module Preload

- Added `rel="modulepreload"` hints for the critical app shell module graph.
- Kept ES module structure unchanged; no bundling introduced.
- Added `scripts/audit-core-module-preload-phase39d.mjs` to the integration gate.


## Phase 39E — Manifest Icon Correction

- Split PWA manifest icon purposes into separate `any` and `maskable` entries.
- Removed combined `purpose: "any maskable"` declarations from `manifest.json`.
- Added `scripts/audit-manifest-icons-phase39e.mjs` and `audit:manifest-icons`.
- Wired the manifest icon audit into the integration gate.

## Version 1.3.0 Final Mobile Input Zoom Hardening

- iOS/PWA input focus zoom prevention hardened.
- Form controls now use explicit `16px !important` sizing including focus state.
- Viewport accessibility remains unchanged; `user-scalable=no` is not reintroduced.
