# TechCalc Pro Documentation Index

Phase 30C reorganizes project documentation so operational files remain in the project root and historical/audit material is grouped under `docs/`.

## Structure

- `docs/phases/` - phase documentation grouped by phase number.
- `docs/audits/json/` - generated audit JSON baselines and scorecards.
- `docs/audits/reports/` - text-based audit artefacts and legacy cleanup reports.
- `docs/architecture/` - stable platform contracts, architecture notes and quality gates.
- `docs/release-notes/` - release notes that are not required in the root.
- `docs/archive/phase-artifacts/` - historical root-level phase documents moved out of the application root.

## Root policy

The project root should contain runtime/build files only. New phase notes, audit results and cleanup reports should be written under `docs/` unless they are required by the application at runtime.
