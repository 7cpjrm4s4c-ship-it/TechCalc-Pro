# Phase 37B - Browser Runtime Smoke Baseline

## Ziel

Phase 37B ergänzt die bisherige Node-Testbasis um eine Browser-Runtime-Smoke-Schicht. Der Fokus liegt auf den Risiken, die Node-Tests strukturell nicht abdecken: echtes Routing im Browser, DOM-Mounts, mobile Pointer-Gesten, Scroll-Lock-Verhalten und Service-Worker-Offline-Fähigkeit.

## Umfang

- 11 aktive Modulrouten
- Chromium Desktop
- WebKit Mobile Profil
- Modulwechsel
- Saved-Record-Erreichbarkeit
- Mobile Navigation Swipe Guard
- Settings Scroll Lock / Restore
- Service-Worker Offline Reload

## Neue Artefakte

- `playwright.config.mjs`
- `tests/e2e/phase37b-runtime-smoke.spec.mjs`
- `tests/platform-browser-runtime-phase37b.test.mjs`
- `docs/audits/json/browser-runtime-smoke-phase37b.json`

## Ergebnis

Status: **ready**

Die Phase 37B ändert keine Runtime-Logik. Sie legt die Browser-Testschicht als Release-Candidate-Gate an und hält die bestehende Node-Import- und Modul-Smoke-Basis unverändert stabil.

## Ausführung

Lokale Browser-Ausführung nach Dependency-Installation:

```bash
npm install
npx playwright install
npm run test:e2e:phase37b
```

Node-Gate ohne Browser-Installation:

```bash
npm run test:phase37b
```
