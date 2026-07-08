# Phase 45C – Modulsplitting Implementierung

## Analyse

Basis ist `1.3.3-dev.2` mit ADR-0006 und dem Splitting-Contract. Das bisherige Kombimodul `heat-recovery` enthielt zwei fachliche Berechnungen in einem State-/Schema-/View-Vertrag. Die Trennung erfolgt ohne Änderung der Berechnungsformeln.

## Design Review

Der bestehende Modulschlüssel `heat-recovery` bleibt für Wärmerückgewinnung bestehen. Das neue Modul `mixed-air` übernimmt die Mischluftberechnung. Bestehende Projektdateien bleiben kompatibel: historische Mischluftfelder aus `modules['heat-recovery'].state` werden beim Import nach `modules['mixed-air'].state` migriert.

## Implementierung

- `heat-recovery` auf WRG-only UI, State und Schema reduziert.
- `mixed-air` als eigenständiges Plattformmodul ergänzt.
- Mischluftlogik nutzt die bestehende geprüfte Berechnungsfunktion `calculateMixing` weiter.
- Navigation/Lazy Loading um `mixed-air` erweitert.
- Project Storage exportiert und importiert `heat-recovery` und `mixed-air` getrennt.
- Legacy-Migration für alte Kombimodul-Projekte ergänzt.

## Regression

Bestanden:

- `npm test`
- `npm run test:integration`
- `npm run lint`
- `npm run build`
- `npm run build:minified`

Zusätzlicher Guard:

- `tests/phase45c-modulsplitting-implementation.test.mjs`

## Dokumentation

- Release Notes auf `1.3.3-dev.3` ergänzt.
- Phase-45C-Dokumentation erstellt.
- Automatisch aktualisierte Audit-Reports behalten 12 Plattformmodule fest.
