# Phase 37B.3 - Service Worker Offline Runtime Hardening

## Ziel

Phase 37B.3 haertet die PWA-/Offline-Schicht. Nach 37B.2 war ein Offline-Reload-Smoke vorhanden, aber der Service-Worker-Precache enthielt nicht den vollstaendigen Runtime-Surface der ungebuendelten ES-Module. Fuer eine Cache-First-PWA ohne Bundler muss der Install-Cache alle produktiven JS-Module, CSS-Dateien, Shell-Dateien und Icons enthalten.

## Umsetzung

Der `service-worker.js`-Precache wurde auf den vollstaendigen Runtime-Surface erweitert:

- alle `js/**/*.js` Dateien
- alle `css/**/*.css` Dateien
- App-Shell: `./`, `index.html`, `manifest.json`, `RELEASE_NOTES.md`
- alle Icons unter `assets/icons/`

Dadurch sind Modulwechsel, Dynamic-Renderer-Nachladungen und Deep-Link-Navigation nach erfolgreichem Erstinstall auch offline vollstaendig aus dem Cache verfuegbar.

## Erweiterte Browser-Smoke-Abdeckung

`tests/e2e/phase37b-runtime-smoke.spec.mjs` wurde um einen Offline-All-Module-Reload-Smoke erweitert:

1. alle 11 Modulrouten online einmal aufrufen und den Cache warm laufen lassen
2. Browser-Kontext offline setzen
3. alle 11 Modulrouten erneut per Deep Link laden
4. pro Route `data-active-module-id` und sichtbare App-Shell pruefen
5. echte App-Runtime-Errors weiterhin als Testfehler behandeln

## Neuer Guard

Ergaenzt wurden:

- `scripts/audit-service-worker-offline-phase37b3.mjs`
- `tests/platform-service-worker-offline-phase37b3.test.mjs`
- `docs/audits/json/service-worker-offline-phase37b3.json`
- npm Scripts:
  - `audit:phase37b3`
  - `test:phase37b3`
  - `test:e2e:phase37b3`

Der Guard prueft statisch:

- keine fehlenden Runtime-Assets im Precache
- keine stale Precache-Eintraege
- alle JS-Module im Offline-Cache
- Navigation-Fallback auf `index.html`
- Cache-First-with-Refresh fuer statische Assets
- versionierter Cache-Name
- `skipWaiting()`
- `clients.claim()`
- `TECHCALC_CACHE_UPDATED`-Client-Message
- Offline-All-Module-Smoke im Playwright-Spec

## Ergebnis

- Offline-Runtime-Surface vollstaendig gecacht
- PWA-Strategie weiter konsistent mit der bewussten No-Bundler-Architektur
- Kein Feature-Verhalten geaendert
- Service-Worker-Install-Cache groesser, dafuer belastbare Offline-Faehigkeit fuer alle Module

## Validierung

- `npm run test:phase37b3`
- `npm run test:phase37b2`
- `npm run test:phase37b1b`
- `npm run build`
- `npm run test:module-smoke`
