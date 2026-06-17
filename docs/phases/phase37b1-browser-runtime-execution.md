# Phase 37B.1 — Browser Runtime Execution

## Ziel

Phase 37B.1 überführt den in Phase 37B angelegten Browser-Runtime-Smoke von einer reinen Harness-Baseline in eine ausführbare Runtime-Prüfung.

## Anpassungen

- Zero-Dependency Static Server ergänzt: `scripts/serve-static.mjs`
- Playwright-Webserver von `npx http-server` auf den projekteigenen Node-Server umgestellt
- Neuer Preflight: `scripts/phase37b1-runtime-preflight.mjs`
- Neuer Guard: `tests/platform-browser-runtime-phase37b1.test.mjs`
- Neue npm Scripts:
  - `serve:static`
  - `test:phase37b1`
  - `test:e2e:phase37b1`

## Ausführungslogik

Der Runtime-Smoke bleibt der Playwright-Spezifikation `tests/e2e/phase37b-runtime-smoke.spec.mjs` zugeordnet. Phase 37B.1 stellt sicher, dass die App ohne externes `http-server`-Paket über einen lokalen statischen Server gestartet werden kann.

## Validierung in dieser Umgebung

Die Node-basierte Preflight-Prüfung konnte den lokalen Static Server starten und erreichen. Die vollständige Playwright-Testausführung war in der aktuellen Sandbox nicht möglich, weil das verfügbare `playwright`-CLI aus der Python-Installation stammt und kein `@playwright/test` bereitstellt. Zusätzlich blockiert die Sandbox Browser-Navigationen auf lokale URLs mit `net::ERR_BLOCKED_BY_ADMINISTRATOR`.

Das ist kein App-Befund, sondern eine Ausführungsgrenze der aktuellen Umgebung. Für lokale/CI-Ausführung gilt:

```bash
npm install -D @playwright/test
npx playwright install
npm run test:e2e:phase37b1
```

## Runtime-Logik

Keine Runtime-Logik der App wurde geändert.
