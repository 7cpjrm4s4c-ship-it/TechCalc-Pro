# TechCalc Pro Engineering

Status: Phase 43A baseline

Dieser Ordner enthaelt die verbindlichen Engineering-Standards fuer TechCalc Pro. Er beschreibt den Entwicklungsprozess, nicht die fachliche Berechnungslogik.

## Grundsatz

Ab Phase 43 gilt:

1. Dokumentation und bestehende Contracts werden vor Codeaenderungen geprueft.
2. Bestehende Architekturvertraege haben Vorrang vor neuen lokalen Loesungen.
3. Neue Regeln werden nur eingefuehrt, wenn kein tragfaehiger bestehender Vertrag existiert.
4. Hotfix-Schichten, parallele Implementierungen und modulinterne Sondervertraege sind zu vermeiden.
5. Jede Architektur- oder Vertragsaenderung aktualisiert die zugehoerige Dokumentation.
6. Jede Phase endet mit Regression, Build-Pruefung und Phasendokumentation.

## Dokumenttypen

- `docs/engineering/`: Arbeitsweise, Branching, Review, Tests, Release-Gates.
- `docs/contracts/`: langfristige Architekturvertraege fuer Runtime, UI und Module.
- `docs/adr/`: Architecture Decision Records, also das Warum hinter wesentlichen Entscheidungen.
- `docs/phases/`: historische und phasenbezogene Umsetzungsergebnisse.

## Startpunkt

Der Startpunkt fuer Phase 43 ist der konsolidierte Architekturstand aus Phase 42E.6.
