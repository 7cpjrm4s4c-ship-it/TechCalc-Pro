# Framework Kernel Contract

Status: Active
Version target: 2.0.0
Authority: Repository First

---

## Purpose

The internal neutral framework kernel defines central access points for recurring module responsibilities.

Modules must use framework- and platform-provided services for app-wide concerns instead of reimplementing them locally.

---

## Scope

The framework kernel covers central contracts and service boundaries for:

- module definition and contract helpers
- module registration
- module runtime and lifecycle integration
- schema-based form rendering
- result rendering
- state binding
- number parsing and formatting
- saved records
- PDF export access
- platform module creation
- centralized data access through `js/data`

The framework kernel does not contain domain-specific module calculations.

---

## Public framework entry point

The framework entry point is:

```js
js/framework/index.js
```

This file is an aggregation boundary only. It must not become the owner of data, UI, PDF, CSS, UX or domain logic.

Modules may import from the framework entry point when they need a stable platform-level API. Modules should otherwise import from the narrowest central path that matches the needed responsibility.

---

## Central data path

The canonical central data path is:

```js
js/data
```

Data catalogs, shared data sets and data lookup services belong under `js/data`.

Existing data sources in `js/shared` and `js/utils` remain compatible during migration, but new modules must not create private copies of catalog data when a matching data entry exists under `js/data`.

---

## Data catalog contract

Centralized data access is provided by:

```js
js/data/catalog.js
```

The catalog exposes registered data entries through stable catalog identifiers and read-only access methods.

Built-in catalog groups currently include:

- rainwater area, hydraulic, roof drain and gutter data
- pipe system and nominal diameter data
- refrigerant, safety class, regulation and EN 378 safety data

---

## Central responsibility paths

App-wide concerns must stay in their dedicated central paths:

| Concern | Central path |
|---|---|
| Data catalogs | `js/data` |
| PDF export | `js/core/pdf` and `js/core/pdfExport.js` |
| Module contracts | `js/core/moduleDefinition.js`, `js/core/moduleContract.js` |
| Module runtime | `js/core/moduleRuntime.js`, `js/platform/moduleRuntime` |
| Schema rendering | `js/core/schemaRenderer.js` |
| Result rendering | `js/core/resultRenderer.js` |
| Number parsing/formatting | `js/core/numberService.js` |
| Saved records | `js/core/savedRecords.js`, `js/core/savedRecordController.js` |

The framework entry point may expose these APIs, but ownership stays with the dedicated central path.

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
- state binding
- validation flow
- saved records
- PDF dispatch
- data catalogs
- number formatting and parsing

---

## Compatibility

This contract introduces an internal framework boundary without moving existing core files.

Existing modules remain compatible. Migration to central paths can happen incrementally.

---

## Review requirements

Changes to this contract require:

- architecture review
- affected module review
- data catalog review when catalog APIs change
- regression tests for migrated modules
- release readiness review before 2.0.0
