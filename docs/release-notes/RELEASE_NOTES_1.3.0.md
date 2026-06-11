# TechCalc Pro 1.3.0 Release Notes

Status: Release-stabilized baseline after Phase 31D  
Target: 1.3.0 release candidate stream

## Executive Summary

TechCalc Pro 1.3.0 is the platform consolidation release. The central objective was not a single feature, but the migration from module-local behavior and legacy UI handling toward a consistent platform runtime for calculation modules.

The release hardens the application around shared contracts for rendering, saved records, input confirmation, focus behavior, scrolling, module mounting, auditability and documentation structure.

## Major Changes

### Platform Migration

- Centralized module lifecycle and schema-based module mounting.
- Shared rendering pipeline for result sections and dynamic module views.
- Consolidated saved-record workflow through platform-compatible handlers.
- Reduced module-local event handling and moved repeated behavior into shared runtime services.
- Introduced repeatable audit scripts for imports, module contracts, UI classes, rendering risk, CSS debt and platform migration progress.

### h,x Module Stabilization

- h,x diagram and process rendering now update directly after semantic input changes.
- Air-treatment selection updates result and diagram state without requiring a manual refresh action.
- Saved process interaction remains compatible with direct result rendering.
- Enter/Tab navigation and result updates are aligned with the global platform behavior.

### UI/UX Hardening

- Central handling for Enter confirmation and Tab navigation.
- Scroll-jump prevention hardened for saved-record selection, deselection and module transitions.
- Platform-level focus handling introduced for dynamic input views.
- UI class usage and component structure audited and cleaned.
- Mobile-scroll and saved-record interaction risks documented through audits.

### Cleanup and Documentation

- Dead-code and duplicate-code audits performed.
- Documentation structure consolidated under `docs/`.
- Audit JSON artefacts consolidated under `docs/audits/json/`.
- Phase documentation organized under `docs/phases/`.
- Runtime candidates reviewed during Release Hardening Phase 31A.

## Quality Gates

The Phase 31B/31C release-hardening baseline contains the following gates:

- `npm install`
- `npm run build`
- `npm run test`
- `npm run audit:imports`
- module smoke audit for all 11 active modules

Phase 31C module smoke result: 11/11 modules passed the structural smoke audit.

## Active Modules in Scope

- `buffer-storage`
- `drinking-water`
- `heat-recovery`
- `heating-cooling`
- `hx-diagram`
- `pipe-sizing`
- `pressure-holding`
- `rainwater`
- `unit-converter`
- `ventilation`
- `wastewater`

## Known Limitations

Known limitations are tracked separately in:

- `docs/release/KNOWN_LIMITATIONS_1.3.0.md`

## Release Recommendation

After Phase 31D, the project is ready for Phase 31E: release-candidate marking as `1.3.0-rc.1`, assuming the local browser smoke test confirms the same behavior as the automated gates.
