# Framework Kernel Contract

Status: Active
Version target: 2.0.0
Authority: Repository First

---

## Purpose

The internal neutral framework kernel defines central access points for recurring module responsibilities.

Modules must use core-provided services for app-wide concerns instead of reimplementing them locally.

---
## Core first

The canonical framework basis is:

```js
js/core
```

All app-wide responsibilities must be discoverable through `js/core` before feature modules are migrated.

The framework entry point `js/framework/index.js` is an aggregation facade over `js/core` and framework-local facades such as `js/framework/dataCatalog.js`. It must not delegate through `js/data` and must not own data, UI, PDF, CSS, UX, runtime or domain logic.

---
## Core-only runtime target

The final runtime application code target is intentionally narrow:

```text
js/core
js/modules
```

`js/core` owns app-wide responsibilities: internal framework, runtime, shell, routing, UI primitives, rendering services, data, storage, PDF, styles, static app assets, number handling, events, UX policies and quality/runtime diagnostics.

`js/modules` owns module-specific responsibilities only: module metadata, configuration, state, schema, calculation logic, result mapping, report adapters, saved-record adapters and optional controller/view code required by the module.

The following paths remain migration boundaries, not final runtime ownership locations:

- `js/framework`
- `js/data`
- root-level `css`
- root-level `assets`

They must shrink through isolated, reviewed migration steps. New app-wide runtime implementation must not be added to those migration boundaries.

The historical `js/platform` boundary has been fully migrated into `js/core` and removed. It must not be recreated.

Root files, build scripts, tests, documentation, CI and deployment configuration remain outside `js/core` and `js/modules` because they are repository/tooling concerns, not runtime ownership areas.

---
## Core responsibility paths
| Concern | Canonical core path |
|---|---|
| Core overview | `js/core/index.js`, `js/core/appCore.js` |
| Contracts and policies | `js/core/contracts` |
| Data catalogs and lookup services | `js/core/data` |
| Events | `js/core/events` |
| PDF export | `js/core/pdf`, `js/core/pdfExport.js` |
| Runtime, routing and navigation | `js/core/runtime` |
| Shell and app controllers | `js/core/ux` |
| State | `js/core/state` |
| Storage and saved records | `js/core/storage` |
| Stylesheet manifest and app styles | `js/core/styles` target path |
| Static app assets | `js/core/assets` target path |
| UI rendering and primitives | `js/core/ui` |
| UX policies and interaction helpers | `js/core/ux` |
---
## Module import rule

Modules should import from the narrowest central core path that matches the required responsibility.

Examples:

```js
import { dataCatalog } from '../../core/data/index.js';
import { createPlatformModule } from '../../core/runtime/index.js';
import { defineModuleDefinition } from '../../core/contracts/index.js';
```

Modules should not use broad framework imports when a narrow core path is sufficient.

---
## Central data path

The canonical central data path is:

```js
js/core/data
```

`js/data` remains as a compatibility alias during migration. It must delegate to `js/core/data` and must not own catalog entries, lookup services or shared data implementations.

The compatibility alias is intentionally limited to these documented and imported files:

- `js/data/index.js`
- `js/data/pipes.js`
- `js/data/rainwater.js`
- `js/data/refrigerants.js`
- `js/data/catalog.js`

Data catalogs, shared data sets and data lookup services belong under `js/core/data`.

The previous `js/shared` and `js/utils` data/helper compatibility paths have been removed after verified migration to `js/core/data`. Reference modules must consume app-wide data through Core paths.

`js/core/data/fGasesSystemSnapshot.js` exposes the F-Gase system snapshot implementation through the central data boundary. `f-gases-check` consumes it through `js/core/data`.
`js/core/data/rainwater.js` exposes Rainwater domain tables and Rainwater surface snapshot access through the central data boundary. Rainwater and Flooding consume them through Core Data.
`js/modules/mixed-air` currently reuses domain-specific calculation and result mapping from `js/modules/heat-recovery`. This is an existing WRG/Mischluft domain coupling and is not a legacy app-wide boundary. It must remain limited to `../heat-recovery/logic.js` and `../heat-recovery/results.js` until a dedicated shared HVAC air-domain core is introduced.

---
## Platform migration boundary

The historical `js/platform` boundary has been fully migrated into Core and removed.

All app-wide runtime services and shell controllers now use canonical paths under `js/core`. Reintroducing `js/platform` is forbidden and enforced by `npm run audit:framework-kernel`.

The completed migration retained public behavior, service-worker precache consistency and release gates through isolated, CI-backed ownership changes.

---

## Data catalog contract

Centralized data access is owned by:

```js
js/core/data/catalog.js
```

The catalog exposes registered data entries through stable catalog identifiers and read-only access methods.

`js/data/catalog.js` is a compatibility alias to `js/core/data/catalog.js` and must not own built-in catalog entries.

`js/framework/dataCatalog.js` is a framework facade to `js/core/data/catalog.js` and must not delegate through `js/data/catalog.js`.

Built-in catalog groups currently include:

- rainwater area, hydraulic, roof drain and gutter data
- pipe system and nominal diameter data
- refrigerant, safety class, regulation and EN 378 safety data

---
## Reference module guard

The migrated reference modules are:

```js
js/modules/unit-converter
js/modules/pipe-sizing
js/modules/pressure-holding
js/modules/heating-cooling
js/modules/ventilation
js/modules/buffer-storage
js/modules/wastewater
js/modules/rainwater
js/modules/flooding-verification
js/modules/heat-recovery
js/modules/mixed-air
js/modules/hx-diagram
js/modules/f-gases-check
js/modules/en-378-safety-check
js/modules/drinking-water
```
Reference modules must use central Core paths for app-wide dependencies and must not import directly from these legacy or platform implementation paths:

- `../../platform/`
- `../../utils/`
- `../../shared/`

The reference modules currently validate the following Core responsibilities:
- runtime and dynamic renderer access through `../../core/runtime/index.js`
- typed report adapter access through `../../core/typedDtoReportAdapter.js`
- data access through `../../core/data/index.js` and `../../core/data/rainwater.js`
- central store access through `../../core/centralStore.js`
- number formatting and parsing through `../../core/numberService.js` and `../../core/numbers.js`
- schema access through `../../core/formSchema.js`
- base rendering through `../../core/renderer.js`
- result rendering through `../../core/resultRenderer.js`
- collection, record identity and saved-record access through `../../core/storage/index.js` and `../../core/savedRecords.js`
- central event pipeline access through `../../core/eventPipeline.js`
- focus preservation access through `../../core/focusManager.js`
- scroll stability access through `../../core/scrollManager.js`
- safe DOM update access through `../../core/domUpdate.js`
This guard is enforced by `npm run audit:framework-kernel`.

---
## Module responsibility

A framework-oriented module should provide only module-specific concerns:

- metadata and configuration
- initial state
- schema
- calculation logic
- result mapping
- report adapter
- optional controller logic where required

Central concerns stay outside feature modules:

- rendering
- lifecycle
- routing and navigation
- state binding
- validation flow
- saved records
- PDF dispatch
- data catalogs
- number formatting and parsing
- CSS and UX policies

---
## App resource migration target

Root-level `css` and `assets` are runtime application resources and should be migrated into Core-owned resource paths after platform implementation ownership is stabilized.

Target ownership:

```text
css/*    → js/core/styles/*
assets/* → js/core/assets/*
```

Moving these paths requires coordinated updates to `index.html`, `manifest.json`, `service-worker.js`, precache generation and browser/PWA audits. These moves must not be combined with platform or module runtime migrations.

---
## Compatibility

This contract defines a Core-first internal framework boundary with documented compatibility aliases only where they still exist in the repository.

Existing modules remain compatible. Migration to central core paths can happen incrementally while compatibility aliases delegate back to Core ownership.

---

## Review requirements

Changes to this contract require:

- architecture review
- affected module review
- data catalog review when catalog APIs change
- regression tests for migrated modules
- release readiness review before 2.0.0
