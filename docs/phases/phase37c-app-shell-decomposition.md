# Phase 37C – App-Shell Decomposition

## 37C.1 – Responsibility Map

Phase 37C.1 is a non-runtime analysis phase. No production behavior was changed.

The goal was to turn `js/core/app.js` from an informal monolith finding into a concrete extraction plan. The current app shell still carries 13 responsibilities in roughly 616 lines. The file is stable, but the coupling level is too high for the next long-term maintenance cycle.

## Current responsibilities

| Area | Target module | Risk | Planned phase |
|---|---|---:|---|
| Module manifest, lazy imports, registration | `js/core/moduleRegistryBootstrap.js` | Medium | 37C.2 |
| Session persistence lifecycle hooks | `js/core/sessionPersistenceController.js` | Low | 37C.2 |
| Module runtime/router bridge | `js/core/appRuntimeBootstrap.js` | Medium | 37C.2 |
| Global nav gesture guard | `js/core/navigationGestureController.js` | Medium | 37C.3 |
| Resize navigation refresh | `js/core/responsiveNavigationController.js` | Low | 37C.3 |
| Header scroll transparency | `js/core/headerScrollController.js` | Low | 37C.3 |
| PDF export bootstrap/pre-init | `js/core/pdfExportController.js` | Low | 37C.4 |
| Theme mode | `js/core/themeController.js` | Medium | 37C.4 |
| Feedback form | `js/core/feedbackController.js` | Low | 37C.4 |
| Release notes | `js/core/releaseNotesController.js` | Low | 37C.4 |
| Settings drawer/scroll lock/submenus | `js/core/settingsPanelController.js` | High | 37C.5 |
| Service worker registration/update message | `js/core/serviceWorkerController.js` | Medium | 37C.6 |

## Findings

### P1 – app.js owns too many responsibilities

This remains the primary 37C driver. The app shell has become reliable, but it is not yet small enough to be a clean composition root.

### P1 – Settings drawer must be extracted last

The settings panel owns the highest-risk behavior: iOS scroll lock, focus restore, submenu persistence and touchmove prevention. It must not be the first extraction target. The 37B browser-smoke guards must remain active while this code moves.

### P2 – Feedback endpoint remains hardcoded

The endpoint is unchanged in 37C.1. Extraction should parameterize it without behavior change; build-time injection can follow later.

## Extraction order

1. **37C.2 – Bootstrap boundaries**
   - Module manifest/lazy loader
   - Session persistence hooks
   - Module runtime/router bridge

2. **37C.3 – Navigation and small UI controllers**
   - Mobile navigation gesture guard
   - Resize navigation refresh
   - Header scroll transparency

3. **37C.4 – Settings-adjacent low-risk controllers**
   - PDF export bootstrap
   - Theme controller
   - Feedback controller
   - Release notes controller

4. **37C.5 – Settings panel controller**
   - Drawer open/close
   - Scroll lock
   - Focus restore
   - Submenu persistence
   - iOS touch guard

5. **37C.6 – Service worker shell controller and closure**
   - Cache update message handling
   - Registration with version parameter

## Stop condition

Any new browser console error, module-smoke regression, settings scroll-lock regression or offline-reload regression stops the decomposition until fixed.

## Generated artifacts

- `scripts/audit-app-shell-decomposition-phase37c1.mjs`
- `docs/audits/json/app-shell-decomposition-phase37c1.json`
- `tests/platform-app-shell-decomposition-phase37c1.test.mjs`

## Validation

- `npm run build`
- `npm run test:phase37c1`
- `npm run test:phase37b4`
- `npm run test:phase37b3`
- `npm run test:module-smoke`

---

# Phase 37C.2 – Theme Controller Extraction

## Ziel

37C.2 ist die erste produktive App-Shell-Extraktion. Der Theme-Pfad wurde aus `js/core/app.js` gelöst und in einen eigenen Shell-Controller überführt. Das Laufzeitverhalten bleibt unverändert: Theme-Auswahl, Persistenz und aktive Button-Zustände funktionieren weiterhin über dieselben DOM-Attribute und Storage-Keys.

## Geänderte Struktur

Neu:

- `js/platform/shell/themeController.js`

Aus `app.js` entfernt:

- `THEME_STORAGE_KEY`
- `getStoredThemeMode()`
- `applyThemeMode()`
- direkte Theme-Button-Listener

In `app.js` verbleibt nur die Composition-Root-Initialisierung:

```js
initializeThemeController({ root: settingsPanel || document });
```

## Öffentliche Theme-API

- `initializeThemeController()`
- `applyTheme()`
- `toggleTheme()`
- `getCurrentTheme()`

## Offline/PWA

Der neue Runtime-Pfad wurde in `service-worker.js` in die Precache-Liste aufgenommen:

- `./js/platform/shell/themeController.js`

## Ergebnis

- `app.js`: 616 → 588 Zeilen
- keine Moduldateien geändert
- keine Feature-Änderung
- erster App-Shell-Verantwortungsbereich extrahiert

## Validierung

- `npm run build`
- `npm run test:phase37c2`
- `npm run test:phase37c1`
- `npm run test:phase37b4`
- `npm run test:phase37b3`
- `npm run test:module-smoke`

## Phase 37C.2A – Theme Extraction Regression Fix

Nach 37C.2 wurde eine Touch-Scroll-Regression im Modul Trinkwasser gemeldet: Beim Finger-Scroll innerhalb eines Teilbereichs sprang der Viewport auf die Ausgangsposition zurück. Die Ursache lag in `bindNoClickScroll()`: Ein bei `touchstart` / `pointerdown` erfasster Viewport-Snapshot konnte bis zum synthetischen `click` erhalten bleiben, obwohl der Nutzer tatsächlich gescrollt hatte.

Korrektur:
- Pending Viewport-Snapshots werden bei `pointermove` / `touchmove` über 8 px verworfen.
- Native `scroll`-Events verwerfen pending Snapshots ebenfalls.
- `themeController` wurde idempotent gehärtet, damit die extrahierte Theme-Logik keine doppelten Listener registriert.

Validierung:
- `npm run build`
- `npm run test:phase37c2a`
- `npm run test:phase37c2`
- `npm run test:phase37b3`
- `npm run test:module-smoke`
