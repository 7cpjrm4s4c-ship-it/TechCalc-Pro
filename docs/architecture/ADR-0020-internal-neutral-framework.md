# ADR-0020: Internal Neutral Framework Kernel

Status: Accepted
Date: 2026-09-07
Target release: 2.0.0

---

## Context

TechCalc Pro already provides central platform services for module registration, runtime execution, schema rendering, result rendering, saved records, number handling and PDF export.

The PDF structure has been centralized before this ADR. Version 1.6.1 is the current baseline for starting the neutral framework transition.

The next architectural step is to prepare `js/core` as the complete internal platform basis before migrating feature modules. The application remains TechCalc Pro. The framework is internal and repository-owned.

---

## Decision

Use `js/core` as the canonical framework basis.

Introduce dedicated core responsibility entry points for app-wide concerns:

- `js/core/contracts`
- `js/core/data`
- `js/core/events`
- `js/core/pdf`
- `js/core/runtime`
- `js/core/state`
- `js/core/storage`
- `js/core/styles`
- `js/core/ui`
- `js/core/ux`

Introduce `js/core/index.js` and `js/core/appCore.js` as the discoverable overview of the app core.

Keep `js/framework/index.js` only as an aggregation facade over `js/core`.

Introduce `js/core/data` as the canonical central data path for shared datasets, data catalogs and data lookup services.

Keep `js/data`, `js/shared` and `js/utils` import paths compatible during migration. They are not the preferred target paths for new module data access when a matching `js/core/data` API exists.

---

## Consequences

New and migrated modules can use narrow central core paths instead of depending directly on scattered platform, shared and utility files.

Existing modules remain compatible and can be migrated incrementally.

The Core-first framework boundary makes app-wide responsibilities discoverable before module migration begins.

---

## Non-goals

This ADR does not create an external package.

This ADR does not replace the current application bootstrap.

This ADR does not move all existing implementation files in one step.

This ADR does not migrate feature modules in this step.

This ADR does not change calculation behavior.

---

## Risk assessment

| Risk | Assessment | Mitigation |
|---|---|---|
| Import churn | Medium | Keep existing imports valid and migrate incrementally. |
| Core entry points become dumping grounds | Medium | Keep ownership separated by dedicated core responsibility paths. |
| Data ownership ambiguity | Medium | Make `js/core/data` the canonical path for shared datasets and lookup services. |
| Regression in existing modules | Low | No existing module behavior is changed in this step. |

---

## Follow-up work

- run the framework kernel audit
- migrate the unit converter module to narrow `js/core` imports
- move additional shared datasets into `js/core/data` when ownership is verified
- add module migration checks after reference migration
- prepare 2.0.0 release only after build, lint, tests, E2E and release readiness checks pass
