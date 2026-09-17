# ADR-0020: Internal Neutral Framework Kernel

Status: Accepted
Date: 2026-09-07
Target release: 2.0.0

---
## Context

TechCalc Pro already provides central platform services for module registration, runtime execution, schema rendering, result rendering, saved records, number handling and PDF export.

The PDF structure has been centralized before this ADR. Version 1.6.1 is the current baseline for starting the neutral framework transition.
The next architectural step is to prepare `js/core` as the complete internal platform basis before migrating feature modules. The application remains TechCalc Pro. The framework is internal and repository-owned.

After the reference-module migration, all JavaScript compatibility boundaries outside `js/core` and `js/modules` have been removed. The remaining runtime ownership ambiguity is limited to root-level `css` and root-level `assets`.

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

Introduce `js/core/data` as the canonical central data path for shared datasets, data catalogs and data lookup services.


`js/shared` and `js/utils` were temporary migration boundaries for legacy data/helper access. After verified migration they are no longer valid app-wide data targets for reference modules.

The final runtime application code target is `js/core` plus `js/modules` only. App-wide implementation belongs in `js/core`; module-specific implementation belongs in `js/modules`.

The former `js/platform`, `js/framework` and `js/data` boundaries have been removed and must not be reintroduced. Runtime JavaScript now resides only in `js/core` and `js/modules`.

Root-level `css` and `assets` are app runtime resources and should be moved into Core-owned resource paths after platform ownership is stabilized:

- `css/*` to `js/core/styles/*`
- `assets/*` to `js/core/assets/*`

Tooling, tests, documentation, CI and deployment configuration remain outside the runtime target because they are repository concerns.

---
## Implementation status

The Data Catalog ownership is Core-first: `js/core/data/catalog.js` owns the implementation.

`js/data` has been removed after all consumers were confirmed on canonical `js/core/data` paths.

`js/shared` and `js/utils` have been removed after verified migration to Core data paths.

`js/platform` has been fully migrated into `js/core` and removed. The unused `js/framework` and `js/data` compatibility facades have also been removed. The framework kernel audit rejects any reintroduction of these legacy runtime boundaries.

---
## Consequences

New and migrated modules can use narrow central core paths instead of depending directly on scattered platform, shared and utility files.

Existing modules consume canonical Core paths without JavaScript compatibility aliases outside `js/core`.

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
| Import churn | Low | Canonical Core imports are enforced by the framework kernel audit. |
| Core entry points become dumping grounds | Medium | Keep ownership separated by dedicated core responsibility paths. |
| Data ownership ambiguity | Medium | Make `js/core/data` the canonical path for shared datasets and lookup services. |
| Legacy boundary reintroduction | Low | The framework kernel audit rejects recreated `js/platform` and `js/framework` boundaries. |
| PWA/precache regression | Medium | Run `npm run precache:check`, browser compliance and build after every asset or CSS move. |
| Regression in existing modules | Low | Preserve public exports and update ownership without changing calculation behavior. |

---
## Follow-up work

- run the framework kernel audit
- keep `js/platform`, `js/framework` and `js/data` absent through the framework kernel audit
- migrate root-level `css` to Core styles after platform ownership is stabilized
- migrate root-level `assets` to Core assets after style migration is stable
- add or tighten migration checks after each completed boundary removal
- prepare 2.0.0 release only after build, lint, tests, E2E and release readiness checks pass
