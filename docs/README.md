# TechCalc Pro Documentation Index

Dieser Index beschreibt die aktive Dokumentationsstruktur von TechCalc Pro. Die Dokumentation ist ab Version 1.3.3 so organisiert, dass Phasen, Verträge, ADRs, Audits und historische Artefakte eindeutig getrennt sind.

## Structure

- `docs/phases/` - aktive Phasendokumentation. Jede neue Phase besitzt genau eine nachvollziehbare Abschlussdokumentation.
- `docs/engineering/` - engineering standards, branch strategy, review and release process.
- `docs/contracts/` - verbindliche Architektur- und Modulverträge. Der aktuelle Modulvertrag ist `docs/contracts/module-contract.md`.
- `docs/adr/` - Architecture Decision Records.
- `docs/audits/json/` - generated audit JSON baselines and scorecards.
- `docs/audits/reports/` - text-based audit artefacts and legacy cleanup reports.
- `docs/architecture/` - ältere stabile Architekturgrundlagen und Qualitätstore, sofern sie noch Referenzwert besitzen.
- `docs/release-notes/` - release notes that are not required in the root.
- `docs/archive/` - historical root-level phase documents, detailed legacy phase notes and deprecated migration artefacts.

## Root policy

The project root should contain runtime/build files only. New phase notes, audit results and cleanup reports should be written under `docs/` unless they are required by the application at runtime. Detailed historical notes that are no longer active references belong in `docs/archive/`, not in the root or top-level `docs/` directory.

## Phase 42 Architecture Consolidation

The authoritative architecture consolidation documents are located in `docs/phases/phase-42*.md`. Root-level phase notes are not used as the source of truth.

## Engineering Baseline

Ab Phase 43 werden Entwicklungsstandards unter `docs/engineering/`, dauerhafte Architekturvertraege unter `docs/contracts/` und Architecture Decision Records unter `docs/adr/` gepflegt.


## Phase 43B Repository Cleanup

Phase 43B moved detailed legacy phase artefacts out of top-level `docs/` folders into `docs/archive/legacy-phase-docs/`. Active phase summaries remain under `docs/phases/`.

## Current 1.3.3 reference

Für Version 1.3.3 sind folgende Dokumente maßgeblich:

- `docs/contracts/module-contract.md` – aktueller Modulvertrag und Modulbestand.
- `docs/contracts/wrg-mixed-air-splitting-contract.md` – Detailvertrag für Wärmerückgewinnung/Mischluft.
- `docs/adr/ADR-0006-wrg-mixed-air-module-splitting.md` – Architekturentscheidung zum Modulsplitting.
- `docs/phases/phase-45a-modulsplitting-analysis.md` bis `docs/phases/phase-45e1-documentation-cleanup.md` – vollständiger Weg der Version 1.3.3.

## Documentation quality rules

- Ein Thema hat genau eine aktive Referenz.
- Jede Phase besitzt eine Phasendokumentation unter `docs/phases/`.
- Jeder verbindliche Architekturvertrag liegt unter `docs/contracts/`.
- Historische Dokumente bleiben unter `docs/archive/`, wenn sie Nachvollziehbarkeitswert besitzen.
- Veraltete Inhalte werden nicht parallel als aktive Referenz weitergeführt.
