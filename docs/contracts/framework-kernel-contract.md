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

The framework entry point `js/framework/index.js` is an aggregation facade over `js/core` and documented compatibility aliases. It must not own data, UI, PDF, CSS, UX, runtime or domain logic.

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
| State | `js/core/state` |
| Storage and saved records | `js/core/storage` |
| Stylesheet manifest | `js/core/styles` |
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

`js/data` remains as a compatibility alias during migration.

The compatibility alias is intentionally limited to these documented and imported files:

- `js/data/index.js`
- `js/data/pipes.js`
- `js/data/rainwater.js`
- `js/data/refrigerants.js`
- `js/data/catalog.js`

Data catalogs, shared data sets and data lookup services belong under `js/core/data`.

Existing data sources in `js/shared` and `js/utils` remain compatible during migration, but new modules must not create private copies of catalog data when a matching data entry exists under `js/core/data`.

`js/core/data/fGasesSystemSnapshot.js` exposes the existing F-Gase system snapshot implementation through the central data boundary. The snapshot implementation remains unchanged while `f-gases-check` consumes it through `js/core/data`.

`js/modules/rainwater/tables.js` consumes Rainwater domain tables through `js/core/data/rainwater.js`. The implementation remains unchanged while the module no longer imports the shared Rainwater table source directly.

`js/modules/flooding-verification` consumes Rainwater domain tables through `js/core/data/rainwater.js`. The Rainwater surface snapshot bridge still remains in `js/shared/rainwaterSurfaceSnapshot.js` as a documented transitional exception until the snapshot contract is migrated.

`js/modules/mixed-air` currently reuses domain-specific calculation and result mapping from `js/modules/heat-recovery`. This is an existing WRG/Mischluft domain coupling and is not a legacy app-wide boundary. It must remain limited to `../heat-recovery/logic.js` and `../heat-recovery/results.js` until a dedicated shared HVAC air-domain core is introduced.

---

## Data catalog contract

Centralized data access is provided by:

```js
js/core/data/catalog.js
```

The catalog exposes registered data entries through stable catalog identifiers and read-only access methods.

Built-in catalog groups currently include:

- rainwater area, hydraulic, roof drain and gutter data
- pipe system and nominal diameter data
- refrigerant, safety class, regulation and EN 378 safety data
- F-Gase system snapshot access through the core data boundary

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
- `../../shared/`, except the documented transitional Flooding surface snapshot bridge

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

## Compatibility

This contract introduces a Core-first internal framework boundary without moving existing implementation files.

Existing modules remain compatible. Migration to central core paths can happen incrementally.

---

## Review requirements

Changes to this contract require:

- architecture review
- affected module review
- data catalog review when catalog APIs change
- regression tests for migrated modules
- release readiness review before 2.0.0
