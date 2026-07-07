# TechCalc Pro Documentation Index

Phase 30C reorganizes project documentation so operational files remain in the project root and historical/audit material is grouped under `docs/`.

## Structure

- `docs/phases/` - active phase documentation grouped by phase number.
- `docs/engineering/` - engineering standards, branch strategy, review and release process.
- `docs/contracts/` - durable architecture contracts used as source of truth.
- `docs/adr/` - Architecture Decision Records.
- `docs/audits/json/` - generated audit JSON baselines and scorecards.
- `docs/audits/reports/` - text-based audit artefacts and legacy cleanup reports.
- `docs/architecture/` - stable platform contracts, architecture notes and quality gates that predate the contract split.
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
