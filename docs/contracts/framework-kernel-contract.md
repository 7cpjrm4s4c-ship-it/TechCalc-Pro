# Framework Kernel Contract

Status: Active
Version target: 2.0.0
Authority: Repository First

---

## Purpose

The internal neutral framework kernel defines the central entry point for module implementation.

Modules must use framework-provided services for recurring platform tasks instead of reimplementing them locally.

---

## Scope

The framework kernel covers:

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
- centralized data catalog access

The framework kernel does not contain domain-specific module calculations.

---

## Public entry point

Modules and new platform code may import central framework APIs from:

```js
js/framework/index.js
```

Direct imports from `js/core`, `js/platform`, `js/shared` or `js/utils` remain valid for existing code, but new modules should prefer the framework entry point when the required API is exported there.

---

## Data catalog contract

Centralized data access is provided by:

```js
js/framework/dataCatalog.js
```

The catalog exposes registered data entries through stable catalog identifiers and read-only access methods.

Built-in catalog groups currently include:

- rainwater area, hydraulic, roof drain and gutter data
- pipe system and nominal diameter data
- refrigerant, safety class, regulation and EN 378 safety data

Modules must not create private copies of catalog data when a matching framework catalog entry exists.

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

Central concerns stay in the framework:

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

Existing modules remain compatible. Migration to framework imports can happen incrementally.

---

## Review requirements

Changes to this contract require:

- architecture review
- affected module review
- data catalog review when catalog APIs change
- regression tests for migrated modules
- release readiness review before 2.0.0
