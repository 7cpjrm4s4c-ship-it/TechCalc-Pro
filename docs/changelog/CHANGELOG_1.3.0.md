# Changelog 1.3.2-dev.1

## 1.3.2-dev.1 - Platform Consolidation Release

### Added

- Platform runtime contracts for schema-mounted modules.
- Central result-rendering compatibility facades.
- Shared saved-record workflow bindings.
- Global input confirmation behavior for Enter navigation.
- Platform focus service and dynamic input navigation support.
- Scroll-stability services for saved records and module switching.
- Audit scripts and JSON artefact output under `docs/audits/json/`.
- Module smoke audit covering all 11 active modules.

### Changed

- Multiple modules migrated from local behavior toward shared platform handling.
- h,x diagram rendering now reacts immediately to semantic air-treatment changes.
- Documentation moved into a structured `docs/` hierarchy.
- Runtime review reduced legacy candidates and removed obsolete menu fallback code.
- Release gates standardized around `build`, `test` and `audit:imports` scripts.

### Fixed

- Scroll jumps during saved-record selection/deselection paths.
- Inconsistent Enter/Tab behavior across dynamic inputs.
- Delayed h,x result and diagram updates after air-treatment changes.
- Test and audit paths after documentation cleanup.
- Node/test-environment safety issue in scroll management.

### Removed

- Obsolete `menuFallback.js` runtime candidate.
- Root-level audit JSON artefacts in favor of `docs/audits/json/`.
- Several legacy documentation placement patterns from earlier migration phases.

### Documentation

- Added consolidated release notes for 1.3.2-dev.1.
- Added migration summary for 1.3.2-dev.1.
- Added known limitations for 1.3.2-dev.1.
- Added Phase 31D release documentation summary.
