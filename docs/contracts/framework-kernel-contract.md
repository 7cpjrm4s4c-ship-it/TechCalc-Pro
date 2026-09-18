# Framework Kernel Contract

Status: Active
Version target: 2.0.0
Authority: Repository First
Architecture decision: ADR-0021

---

## Purpose

The internal framework kernel defines central access points for recurring application responsibilities.

Modules must use Core-provided services for app-wide concerns instead of reimplementing them locally.

## Core first

The canonical target framework basis is:

```text
core
```

The current `js/core` path is a temporary transition location until the coordinated Root-Level Runtime Layout migration is committed.

All app-wide responsibilities must remain discoverable through Core. No additional framework or platform facade may be introduced.

## Core-only runtime target

The final runtime JavaScript target is intentionally narrow:

```text
core
modules
```

`core` owns app-wide responsibilities: bootstrap, runtime, routing, UI primitives, rendering, data, storage, PDF, number handling, events, UX policies and diagnostics.

`modules` owns module-specific responsibilities: metadata, configuration, state, schema, calculation logic, result mapping, report adapters, saved-record adapters and module-specific controller or view code.

Root-level `css` and `assets` remain canonical static-resource locations. They are not Core implementation directories.

Scripts, tests, documentation, CI and deployment configuration remain outside the runtime target because they are repository concerns.

## Core responsibility paths

| Concern | Canonical target path |
|---|---|
| Bootstrap and Core overview | `core/app.js`, `core/index.js`, `core/version.js` |
| Application composition and routing | `core/app` |
| Contracts and policies | `core/contracts` |
| Data catalogs and lookup services | `core/data` |
| Diagnostics and logging | `core/diagnostics` |
| Shared technical domain services | `core/domain` |
| Events | `core/events` |
| Forms and schema handling | `core/forms` |
| PDF export | `core/pdf` |
| Rendering | `core/rendering` |
| Runtime and lifecycle | `core/runtime` |
| State | `core/state` |
| Storage and saved records | `core/storage` |
| Stylesheet manifests and contracts | `core/styles` |
| UI primitives and interaction services | `core/ui` |
| UX and shell controllers | `core/ux` |
| Physical stylesheets | `css` |
| Static application resources | `assets` |

`core/app.js`, `core/index.js` and `core/version.js` remain direct Core entry points. Other top-level Core files must be migrated into the responsibility paths in isolated, CI-backed steps after the outer directory move.

## Module import rule

Modules must import from the narrowest Core path matching the required responsibility.

The sibling relationship between `core` and `modules` preserves imports such as:

```js
import { dataCatalog } from '../../core/data/index.js';
import { createPlatformModule } from '../../core/runtime/index.js';
import { defineModuleDefinition } from '../../core/contracts/index.js';
```

Modules must not use broad compatibility facades when a narrow Core path is available.

## Central data path

The canonical target data path is:

```text
core/data
```

During transition it remains at `js/core/data`. The former `js/data`, `js/shared` and `js/utils` compatibility paths have been removed and must not be recreated.

Data catalogs, shared datasets and lookup services belong exclusively to Core Data.

## Reference module guard

The reference modules are the 15 feature directories below target path `modules/`. Until the coordinated move they remain below `js/modules/`.

Reference modules must use central Core paths for app-wide dependencies and must not import directly from removed platform, shared or utility paths.

The guard validates, among other responsibilities:

- runtime through `../../core/runtime/index.js`
- report adapters through Core
- data through `../../core/data`
- central state and storage through Core
- rendering, schema, event, focus and scroll services through Core

This guard is enforced by `npm run audit:framework-kernel`.

## Module responsibility

A module may own only feature-specific concerns:

- metadata and configuration
- initial state
- schema
- calculation logic
- result mapping
- report adapter
- saved-record adapter
- optional module-specific controller and view code

App-wide rendering, lifecycle, routing, validation, storage, PDF dispatch, data catalogs, number handling, CSS policies and UX policies remain Core responsibilities.

## Static resources

Physical stylesheet and asset ownership remains:

```text
css/
assets/
```

`core/styles` may expose stylesheet manifests or contracts but must not contain physical application stylesheets. Moving `css` or `assets` into Core is outside the accepted architecture.

## Transition contract

The migration order is binding:

1. Keep `css` and `assets` unchanged.
2. Prepare import, audit and precache tooling for both current and target runtime paths.
3. Move `js/core` to `core` and `js/modules` to `modules` in one coordinated commit.
4. Verify lint, tests, version, precache, build, integration and visual behavior.
5. Reorganize Core one responsibility family at a time.
6. Remove the empty `js` boundary and forbid its recreation.

The outer directory move and internal Core reorganization must not occur in the same commit.

## Compatibility

The former `js/platform`, `js/framework`, `js/data`, `js/shared` and `js/utils` boundaries are removed.

The transitional `js/core` and `js/modules` locations are not compatibility APIs. They exist only until the coordinated root relocation.

## Review requirements

Changes to this contract require:

- architecture review
- affected module review
- data catalog review when data APIs change
- regression tests for migrated paths
- browser and offline verification
- release readiness review before 2.0.0
