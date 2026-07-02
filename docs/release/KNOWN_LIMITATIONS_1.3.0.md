# Known Limitations 1.3.2-dev.1

## Scope

This document records known constraints at the end of Phase 31D. These items are not automatic release blockers, but they should remain visible for RC validation and post-release planning.

## Limitations

### Browser Smoke Test Still Required

Automated gates cover imports, structural runtime checks and module smoke contracts. A manual browser pass is still required before final release-candidate approval, especially for visual behavior, saved-record UX, keyboard navigation and scroll stability.

### Compatibility Facades Remain Intentionally Present

Some compatibility files remain by design to protect migrated modules during the 1.3.2-dev.1 release window. They should not be removed before the release candidate unless a dedicated regression pass proves they are unnecessary.

Examples:

- result renderer facade
- saved-calculation workflow facade
- module contract compatibility entry points

### PDF Export Not Deep-Regressed in Phase 31D

PDF export remains part of the runtime and was retained during the runtime review. Phase 31D does not claim deep browser-level PDF visual validation.

### Audit Coverage Is Structural, Not Full E2E

The module smoke audit confirms module structure and platform compatibility signals. It does not replace full user-flow E2E testing with real browser automation.

### New Feature Freeze Recommended

Large refactors, new utilities, module rewrites and new features should stay out of the release-candidate branch. Only bugfixes, regression fixes and documentation corrections should be accepted after RC marking.
