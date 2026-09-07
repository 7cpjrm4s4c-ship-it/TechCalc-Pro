# ADR-0020: Internal Neutral Framework Kernel

Status: Accepted
Date: 2026-09-07
Target release: 2.0.0

---

## Context

TechCalc Pro already provides central platform services for module registration, runtime execution, schema rendering, result rendering, saved records, number handling and PDF export.

The PDF structure has been centralized before this ADR. Version 1.6.1 is the current baseline for starting the neutral framework transition.

The next architectural step is to make recurring module responsibilities centrally available through dedicated internal boundaries. The application remains TechCalc Pro. The framework is internal and repository-owned.

---

## Decision

Introduce `js/framework` as a neutral internal aggregation entry point for stable framework APIs.

The framework entry point re-exports stable existing platform and core services instead of moving them. This keeps the change minimal and preserves existing runtime behavior.

Introduce `js/data` as the canonical central data path for shared datasets, data catalogs and data lookup services.

Introduce `js/data/catalog.js` as the central data catalog access layer for shared domain data that is currently maintained in `js/shared` and `js/utils`.

Keep existing `js/shared` and `js/utils` import paths compatible during migration. They are not the preferred target paths for new module data access when a matching `js/data` API exists.

Document the public framework and data contracts in `docs/contracts/framework-kernel-contract.md`.

---

## Consequences

New modules can use dedicated central paths instead of depending directly on scattered shared and utility files.

Existing modules remain compatible and can be migrated incrementally.

The framework boundary exposes central cross-module responsibilities without taking ownership away from their dedicated paths:

- module contracts
- module lifecycle
- schema rendering
- result rendering
- state binding
- saved records
- PDF export access
- number handling
- data catalog access

---

## Non-goals

This ADR does not create an external package.

This ADR does not replace the current application bootstrap.

This ADR does not move all existing shared or utility files in one step.

This ADR does not migrate all modules in one step.

This ADR does not change calculation behavior.

---

## Risk assessment

| Risk | Assessment | Mitigation |
|---|---|---|
| Import churn | Medium | Keep existing imports valid and migrate incrementally. |
| Framework entry point becomes a dumping ground | Medium | Keep ownership in dedicated paths such as `js/data`, `js/core/pdf` and renderer/runtime files. |
| Data ownership ambiguity | Medium | Make `js/data` the canonical path for shared datasets and lookup services. |
| Regression in existing modules | Low | No existing module behavior is changed in this step. |

---

## Follow-up work

- migrate reference modules to `js/data` and other narrow central paths
- move additional shared datasets into `js/data` when ownership is verified
- extend the data catalog when further shared data sources are identified
- add module migration checks after reference migration
- prepare 2.0.0 release only after build, lint, tests, E2E and release readiness checks pass
