# Phase 27A - Platform Audit Framework

## Executive intent

Phase 27A establishes the audit framework for the completed platform migration. This phase does not refactor business modules. It defines the objective scorecard, evidence model and quality gates used by Phase 27B through 27E.

## Scope

Audited module classes:

- Standard calculation modules
- Modules with Saved Records
- Modules with Dynamic Renderer
- Modules with Diagram Renderer
- Modules with cross-module references

Current platform module inventory:

- `heating-cooling`
- `ventilation`
- `rainwater`
- `wastewater`
- `pipe-sizing`
- `pressure-holding`
- `unit-converter`
- `buffer-storage`
- `heat-recovery`
- `drinking-water`
- `hx-diagram`

## Reference architecture

Every migrated module is evaluated against this target boundary model:

```text
config.js       static module metadata and option catalogs
schema.js       form model and field structure
state.js        defaults, persistence-compatible state shape
logic.js        pure calculation/business logic
index.js        platform mount only
controller.js   events, actions, state mutation orchestration
viewModel.js    derived render state
view.js         layout shell and DOM slots only
results.js      result card rendering
dynamicRenderer.js dynamic sections and saved-record islands
diagramRenderer.js diagram/SVG rendering where applicable
renderPipeline.js single render orchestration where applicable
```

## Audit dimensions

Each module receives a 0-5 score per dimension.

| Score | Meaning |
|---:|---|
| 0 | Not migrated / boundary absent |
| 1 | Legacy dominant |
| 2 | Partially migrated with architectural leakage |
| 3 | Platform compatible with known weaknesses |
| 4 | Platform conformant with minor cleanup potential |
| 5 | Reference-grade implementation |

### A. Platform mount

Criteria:

- `index.js` delegates to platform mount/runtime APIs.
- No large view/controller/result logic remains in `index.js`.
- Module metadata and lifecycle hooks are explicit.

Evidence:

- `createPlatformModule`, module registration, mount adapter usage.
- `index.js` line count and imported boundary files.

### B. State contract

Criteria:

- `state.js` exposes stable defaults and persistence-compatible state.
- Saved-record state names are normalized where applicable.
- Derived UI state is not persisted as calculation truth unless intentional.

Evidence:

- `defaultState`, saved record collections, active/expanded ids.

### C. Controller separation

Criteria:

- DOM events and user actions are isolated in `controller.js` or platform controllers.
- View files do not mutate persistent state directly.
- Saved-record actions flow through controller boundaries.

Evidence:

- Event binding locations.
- Use of platform action/update APIs.

### D. ViewModel separation

Criteria:

- Render state is derived before reaching the view.
- Formatting and conditional display rules do not leak into core logic.
- ViewModel is deterministic for the same state/input model.

Evidence:

- `viewModel.js` exports.
- Result/dynamic/diagram render data preparation.

### E. View purity

Criteria:

- `view.js` contains shell/layout/slot composition only.
- No calculation logic, storage logic, SVG generation or saved-record mutation.
- View imports renderers instead of implementing renderer internals.

Evidence:

- Import graph and forbidden pattern scan.

### F. Result renderer

Criteria:

- Result rendering is isolated in `results.js` or platform result renderer.
- Result cards are render-only and side-effect-free.
- Empty/error states are handled consistently.

Evidence:

- `results.js` presence and renderer export structure.

### G. Dynamic renderer

Criteria:

- Conditional sections and repeating collections live outside `view.js`.
- Dynamic renderer participates in the same render pipeline as results.
- Re-rendering does not rebind duplicate handlers.

Evidence:

- `dynamicRenderer.js`, render pipeline usage, event delegation.

### H. Diagram renderer

Criteria for diagram modules:

- SVG/chart logic lives in `diagramRenderer.js` or equivalent.
- Diagram rendering consumes view-model/state snapshots.
- Diagram updates are part of the central render pipeline.

Evidence:

- `diagramRenderer.js`, absence of SVG internals in `view.js`.

### I. Saved Records

Criteria for saved-record modules:

- Saved records use normalized state naming and platform behavior.
- Active and expanded selection are explicit.
- Select/update/delete does not trigger scroll jumps or partial stale renders.

Evidence:

- saved collection names, active id handling, saved-record controller integration.

### J. Render pipeline

Criteria:

- Input changes trigger one coherent render path.
- Results, dynamic sections and diagrams use the same state snapshot.
- No manual patch islands remain unless explicitly justified.

Evidence:

- `renderPipeline.js`, `renderCoordinator`, `dynamicRenderer` delegation.

### K. Numeric and locale handling

Criteria:

- German comma and thousands notation are parsed centrally.
- Numeric formatting is centralized.
- Unit conversion state does not corrupt persisted values.

Evidence:

- `numberService`, `numbers`, module-specific parsing bypass scan.

### L. UX stability

Criteria:

- Tab/Enter navigation works according to platform convention.
- Saved-record selection does not cause scroll jumps.
- Mobile layout and dynamic sections remain stable on re-render.

Evidence:

- input confirmation tests, scroll manager usage, mobile-scroll audit.

### M. Test coverage and regression gates

Criteria:

- Module has phase-level platform tests.
- Import/syntax checks pass.
- Critical saved-record/render-pipeline regressions are covered.

Evidence:

- test files and package scripts.

## Risk classification

| Risk | Definition |
|---|---|
| P0 | Release blocker: data corruption, unusable module, broken app boot |
| P1 | Critical: broken calculation path, saved-record corruption, major UX regression |
| P2 | High: architecture violation likely to produce regressions |
| P3 | Medium: cleanup required before long-term scaling |
| P4 | Low: documentation, naming or minor consistency issue |

## Phase 27B output contract

Phase 27B must produce:

1. Module-by-module score matrix.
2. Evidence-backed findings per module.
3. Cross-module comparison against reference modules.
4. P0/P1/P2 risk register.
5. Ordered remediation backlog for 27C/27D.

## Non-goals in 27A

- No functional refactor.
- No UI redesign.
- No calculation formula changes.
- No saved-record schema migration.
