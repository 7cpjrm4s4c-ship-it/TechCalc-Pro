# Phase 18B.4 - Heating/Cooling Platform Mount

## Goal

Move the Heizung/Kälte lifecycle onto the platform runtime without changing the stable UI behavior proven in Phase 18B.3.

## Changes

- `modules/heating-cooling/index.js` now exports through `createPlatformModule(...)`.
- The former module-owned `mountHeatingCooling()` implementation has been removed.
- `platform/moduleRuntime` now supports a custom-view dynamic mount adapter for modules that are already partially migrated but still need a domain-specific view during transition.
- The platform runtime owns:
  - initial mount
  - common input binding
  - state binding
  - dynamic-update subscription
  - custom bind hooks
- Heizung/Kälte keeps only its domain adapter functions:
  - `view(...)`
  - `activeCalculationState(...)`
  - line-section record mapping
  - result model callbacks

## Why not use the generic schema view yet?

The current Heizung/Kälte UI still contains mode-dependent input islands and unit-specific fields that were proven stable in the existing view. Phase 18B.4 therefore moves the lifecycle first while preserving the proven view. The final schema-only view can follow after additional schema capabilities cover those dynamic islands.

## Regression

Added `heating-cooling-phase18b4-platform-mount.test.mjs`.

`npm test` passes.
