# ADR-0020: Internal Neutral Framework Kernel

Status: Accepted
Date: 2026-09-07
Target release: 2.0.0

---

## Context

TechCalc Pro already provides central platform services for module registration, runtime execution, schema rendering, result rendering, saved records, number handling and PDF export.

The PDF structure has been centralized before this ADR. Version 1.6.1 is the current baseline for starting the neutral framework transition.

The next architectural step is to make recurring module responsibilities centrally available through an internal neutral framework boundary. The application remains TechCalc Pro. The framework is internal and repository-owned.

---

## Decision

Introduce `js/framework` as the neutral internal framework entry point.

The framework entry point re-exports stable existing platform and core services instead of moving them. This keeps the change minimal and preserves existing runtime behavior.

Introduce `js/framework/dataCatalog.js` as the central data catalog access layer for shared domain data that is currently maintained in `js/shared` and `js/utils`.

Document the public framework contract in `docs/contracts/framework-kernel-contract.md`.

---

## Consequences

New modules can use one central framework import boundary instead of depending directly on individual core, platform, shared and utility files.

Existing modules remain compatible and can be migrated incrementally.

The framework boundary becomes the preferred location for central cross-module responsibilities:

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

This ADR does not move existing core files.

This ADR does not migrate all modules in one step.

This ADR does not change calculation behavior.

---

## Risk assessment

| Risk | Assessment | Mitigation |
|---|---|---|
| Import churn | Medium | Keep existing imports valid and migrate incrementally. |
| Framework boundary drift | Medium | Add a framework audit and maintain the framework contract. |
| Data ownership ambiguity | Medium | Route shared data through the central data catalog. |
| Regression in existing modules | Low | No existing module behavior is changed in this step. |

---

## Follow-up work

- migrate reference modules to `js/framework/index.js`
- extend the data catalog when further shared data sources are identified
- add module migration checks after reference migration
- prepare 2.0.0 release only after build, lint, tests, E2E and release readiness checks pass
