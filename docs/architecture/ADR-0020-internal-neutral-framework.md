# ADR-0020: Internal Neutral Framework Kernel

Status: Accepted
Date: 2026-09-07
Target release: 2.0.0

---
## Context

TechCalc Pro already provides central platform services for module registration, runtime execution, schema rendering, result rendering, saved records, number handling and PDF export.

The PDF structure has been centralized before this ADR. Version 1.6.1 is the current baseline for starting the neutral framework transition.
The next architectural step is to prepare `js/core` as the complete internal platform basis before migrating feature modules. The application remains TechCalc Pro. The framework is internal and repository-owned.

After the reference-module migration and removal of `js/shared` and `js/utils`, the `js/platform` boundary has also been fully migrated and removed. The remaining runtime ownership ambiguity is concentrated in `js/framework`, `js/data`, root-level `css` and root-level `assets`.

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

Keep `js/data` import paths compatible during migration. They are compatibility aliases and must delegate to `js/core/data` when a matching Core API exists.

`js/shared` and `js/utils` were temporary migration boundaries for legacy data/helper access. After verified migration they are no longer valid app-wide data targets for reference modules.

The final runtime application code target is `js/core` plus `js/modules` only. App-wide implementation belongs in `js/core`; module-specific implementation belongs in `js/modules`.

`js/framework` and `js/data` remain migration boundaries, not final ownership locations. They must be reduced through reviewed, CI-backed migration steps. The former `js/platform` boundary has been fully migrated into Core and must not be reintroduced.

Root-level `css` and `assets` are app runtime resources and should be moved into Core-owned resource paths after platform ownership is stabilized:

- `css/*` to `js/core/styles/*`
- `assets/*` to `js/core/assets/*`

Tooling, tests, documentation, CI and deployment configuration remain outside the runtime target because they are repository concerns.

---
## Implementation status

The Data Catalog ownership is Core-first: `js/core/data/catalog.js` owns the implementation.

`js/data/catalog.js` and `js/framework/dataCatalog.js` are compatibility facades to the Core catalog and must not own catalog entries.

`js/shared` and `js/utils` have been removed after verified migration to Core data paths.

`js/platform` has been fully migrated into `js/core` and removed. The framework kernel audit rejects any reintroduction of this legacy runtime boundary.

---
## Consequences

New and migrated modules can use narrow central core paths instead of depending directly on scattered platform, shared and utility files.

Existing modules remain compatible and can be migrated incrementally through documented compatibility aliases.

The Core-first framework boundary makes app-wide responsibilities discoverable before module migration begins.

Future moves must preserve existing public behavior, service-worker precache consistency and release gates. File moves must be performed in isolated blocks so each step can be verified independently.

---
## Non-goals

This ADR does not create an external package.

This ADR does not replace the current application bootstrap.

This ADR does not move all existing implementation files in one step.

This ADR does not migrate feature modules in this step.

This ADR does not move root-level `css` or `assets` in the same step as platform runtime code.

This ADR does not change calculation behavior.

---
## Risk assessment

| Risk | Assessment | Mitigation |
|---|---|
| Import churn | Medium | Keep existing imports valid through documented compatibility aliases and migrate incrementally. |
| Core entry points become dumping grounds | Medium | Keep ownership separated by dedicated core responsibility paths. |
| Data ownership ambiguity | Medium | Make `js/core/data` the canonical path for shared datasets and lookup services. |
| Platform reintroduction | Low | The framework kernel audit rejects any recreated `js/platform` boundary. |
| PWA/precache regression | Medium | Run `npm run precache:check`, browser compliance and build after every asset or CSS move. |
| Regression in existing modules | Low | Preserve public exports and update ownership without changing calculation behavior. |

---
## Follow-up work

- run the framework kernel audit
- keep `js/platform` absent through the framework kernel audit
- remove `js/framework` only after all consumers use Core paths or documented framework-local facades are no longer needed
- remove `js/data` only after all compatibility consumers are migrated to Core data paths
- migrate root-level `css` to Core styles after platform ownership is stabilized
- migrate root-level `assets` to Core assets after style migration is stable
- add or tighten migration checks after each completed boundary removal
- prepare 2.0.0 release only after build, lint, tests, E2E and release readiness checks pass
