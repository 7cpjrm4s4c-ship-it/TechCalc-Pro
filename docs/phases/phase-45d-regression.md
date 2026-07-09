# Phase 45D – Modulsplitting Regression

Status: abgeschlossen  
Version: 1.3.3-dev.5  
Scope: Regression nach Trennung von Wärmerückgewinnung und Mischluft

## Ziel

Phase 45D validiert, dass das in Phase 45C, 45C.1 und 45C.2 umgesetzte Modulsplitting keine funktionalen Regressionen verursacht.

## Ausgangssituation

Das ehemalige kombinierte WRG-/Mischluft-Modul wurde in zwei fachlich eigenständige Module getrennt:

- `heat-recovery` – Wärmerückgewinnung
- `mixed-air` – Mischluft

Kritische Integrationspunkte waren Projektmigration, gespeicherte Datensätze, Save-/Load-Lifecycle und PDF-Export.

## Regression

Geprüfte Bereiche:

- Berechnung Wärmerückgewinnung
- Berechnung Mischluft
- Eingaben in beiden Modulen
- gespeicherte Datensätze
- Projekt speichern
- Projekt laden
- Laden bestehender Projekte aus Version 1.3.2
- Migration alter WRG-/Mischluftdaten
- PDF-Export
- Import/Export
- nicht betroffene Module
- PWA-/Build-Verhalten

## Ergebnis

Keine Regression festgestellt.

Die bestehenden Projekte werden korrekt geladen. Mischluftdaten werden in das neue Modul übernommen. Gespeicherte Mischluft-Datensätze verbleiben nicht mehr im WRG-Kontext, sondern werden dem Modul `mixed-air` zugeordnet.

## Risiken

Die wesentlichen Risiken des Modulsplittings wurden durch 45C.1 und 45C.2 geschlossen:

- fehlende Lifecycle-Integration des neuen Moduls
- unvollständige Migration gespeicherter Legacy-Records
- fehlerhafte Zuordnung von Legacy-WRG-/Mischluft-Daten

## Referenzen

- `docs/phases/phase-45a-modulsplitting-analysis.md`
- `docs/phases/phase-45b-modulsplitting-design-review.md`
- `docs/phases/phase-45c-modulsplitting-implementation.md`
- `docs/phases/phase-45c1-project-lifecycle-integration.md`
- `docs/phases/phase-45c2-legacy-saved-records-migration.md`
- `docs/contracts/wrg-mixed-air-splitting-contract.md`
- `docs/adr/ADR-0006-wrg-mixed-air-module-splitting.md`
