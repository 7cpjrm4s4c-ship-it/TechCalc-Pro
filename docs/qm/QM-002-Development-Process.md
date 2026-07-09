# QM-002 Development Process

Status: verbindlich ab Version 1.3.3-dev.7

## Standardprozess

Jede Phase folgt verbindlich diesem Ablauf:

1. Analyse – bestehende Dokumentation, Contracts, ADRs und Referenzmodule prüfen.
2. Design Review – Zielbild, Schnittstellen, Risiken und Referenzverhalten festlegen.
3. Implementierung – kleine, nachvollziehbare Änderungen ohne unnötige Aufblähung.
4. Regression – gezielte Tests gegen Referenzmodule, Migration, Persistenz, PDF und PWA.
5. Dokumentation – Phasendokumente, Contracts, ADRs, Release Notes und QM-Verweise aktualisieren.

## Definition of Done

Eine Phase ist abgeschlossen, wenn:

- fachliche Akzeptanzkriterien erfüllt sind,
- keine bekannten Regressionen offen sind,
- `npm run lint`, `npm test`, `npm run test:integration`, `npm run build` und, falls relevant, `npm run build:minified` bestanden sind,
- betroffene Contracts geprüft oder aktualisiert sind,
- ADRs für Architekturentscheidungen ergänzt sind,
- Phasendokumentation vollständig ist,
- Release Notes aktualisiert sind.

## Änderungsdisziplin

- Keine künstliche Aufblähung der Software oder Dokumentation.
- Keine parallelen Implementierungen ohne Migrationsplan.
- Keine historischen Auditlisten als aktive Qualitätsreferenz weiterführen.
- Jede neue Datei benötigt eine klare Rolle: Code, Test, Contract, ADR, Phase, QM oder Release.
