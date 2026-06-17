# Phase 37B.2 - Browser Runtime Smoke Coverage Expansion

## Ziel

Phase 37B.2 erweitert die in 37B eingefuehrte Browser-Runtime-Abdeckung. Nach der Console-Bereinigung aus 37B.1A/37B.1B liegt der Fokus nicht mehr auf einzelnen Runtime-Fehlern, sondern auf reproduzierbarer Browser-Verhaltensabsicherung.

## Umfang

Erweitert wurde `tests/e2e/phase37b-runtime-smoke.spec.mjs` um sieben Szenariogruppen:

1. Modul-Routing und Mount fuer alle 11 Module
2. Saved-Record-Control-Erreichbarkeit fuer speicherfaehige Module
3. Dynamic-Renderer Field-Commit-Smoke
4. Enter-/Tab-Navigation im HX-Diagramm
5. Mobile Navigation Swipe-Guard
6. Settings-Panel Scroll-Lock / Restore
7. Service-Worker Offline-Reload-Smoke

## Technische Leitentscheidung

Bekannte externe Browser-Meldungen werden explizit als Nicht-App-Befund gefiltert:

- `cdn.segment.com` / `ERR_BLOCKED_BY_CLIENT`
- Edge-Copilot-Hinweis
- Apple-Meta-Deprecation-Warnung

Alle echten `pageerror`-Ereignisse und Console-Errors aus der App bleiben testrelevant.

## Dateien

- `tests/e2e/phase37b-runtime-smoke.spec.mjs`
- `scripts/audit-browser-runtime-phase37b2.mjs`
- `tests/platform-browser-runtime-phase37b2.test.mjs`
- `docs/audits/json/browser-runtime-smoke-coverage-phase37b2.json`

## Ergebnis

- Runtime-Logik nicht geaendert
- Browser-Smoke-Abdeckung erweitert
- Node-Guard fuer E2E-Struktur ergaenzt
- Vollstaendiger Playwright-Lauf bleibt lokal/CI auszufuehren, sobald `@playwright/test` und Browser-Binaries installiert sind
