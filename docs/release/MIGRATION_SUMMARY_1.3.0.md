# Migration Summary 1.3.2-dev.1

## Objective

Version 1.3.2-dev.1 moved TechCalc Pro from module-specific implementation patterns toward a shared platform runtime. The work focused on maintainability, consistent UX, repeatable quality gates and release readiness.

## Architecture Outcomes

### Runtime

- Schema modules are mounted through central platform entry points.
- Result rendering is routed through shared renderer contracts and compatibility facades.
- Saved-record interactions use a common workflow instead of competing module-local paths.
- Module lifecycle helpers reduce repeated binding and duplicate event registration.

### UI/UX

- Input confirmation, focus movement and keyboard navigation are handled globally.
- Scroll behavior is treated as a platform concern instead of a per-module patch.
- Component class usage was audited and consolidated.

### Auditing

- Import validation is available through `npm run audit:imports`.
- Build validation is available through `npm run build`.
- Broad project quality validation is available through `npm run test`.
- JSON audit artefacts are stored below `docs/audits/json/`.

## Module Scope

The platform baseline covers the following active modules:

1. buffer-storage
2. drinking-water
3. heat-recovery
4. heating-cooling
5. hx-diagram
6. pipe-sizing
7. pressure-holding
8. rainwater
9. unit-converter
10. ventilation
11. wastewater

## Release-Hardening Result

- Phase 31A reviewed retained runtime candidates.
- Phase 31A.1 removed obsolete menu fallback code.
- Phase 31B established local build/test/import gates.
- Phase 31C added module smoke audit coverage and consolidated audit artefacts under `docs/`.
- Phase 31D consolidated release documentation.

## Post-Release Direction

After `1.3.2-dev.1-rc.1`, only bugfixes, regression fixes and documentation corrections should enter the release branch. New features and larger refactorings should wait until after the 1.3.2-dev.1 release.
