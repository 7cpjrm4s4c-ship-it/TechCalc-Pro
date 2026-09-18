# ADR-0021: Root-Level Runtime Layout

Status: Accepted
Date: 2026-09-18
Target release: 2.0.0
Supersedes: ADR-0020 path layout decision

---

## Context

The Core-first ownership decision from ADR-0020 remains valid, but the physical runtime layout needs refinement.

The current transitional structure contains 117 files under `js/core`, including 53 files directly in its root, while `js/modules` is already organized into 15 feature-module directories. Keeping both runtime families below an additional `js` wrapper adds path depth without adding an ownership boundary.

Root-level `css` and `assets` are coherent static-resource trees. Moving them below Core would mix browser resources with JavaScript implementation and would lengthen paths without improving responsibility ownership.

## Decision

Adopt this final repository-level runtime layout:

```text
core/
modules/
css/
assets/
```

`core` owns app-wide runtime responsibilities. `modules` owns feature-specific runtime code. `css` owns stylesheets and `assets` owns static application resources.

Keep these discoverable Core entry points directly under `core/`:

- `core/app.js`
- `core/index.js`
- `core/version.js`

Group the remaining Core implementation by responsibility:

- `core/app`
- `core/contracts`
- `core/data`
- `core/diagnostics`
- `core/domain`
- `core/events`
- `core/forms`
- `core/pdf`
- `core/rendering`
- `core/runtime`
- `core/state`
- `core/storage`
- `core/styles`
- `core/ui`
- `core/ux`

`core/styles` owns stylesheet manifests and style contracts only. Physical stylesheets remain in root-level `css`. Static files remain in root-level `assets`.

The migration is split into two independently verified operations:

1. Move `js/core` to `core` and `js/modules` to `modules` without reorganizing Core internals.
2. After green CI and visual verification, reorganize Core one responsibility family at a time.

The outer directory move and the internal Core reorganization must not be combined.

## Transition state

Until the coordinated directory move is committed, runtime files remain temporarily under:

```text
js/core
js/modules
```

Tooling and contracts may support the target paths before the move, but runtime consumers must switch atomically with the directory relocation. After the move, the empty `js` boundary must be removed and protected by an audit gate.

## Consequences

Moving both sibling trees together preserves most relative imports between modules and Core. For example, imports using `../../core/...` remain valid when `js/modules/<module>` becomes `modules/<module>`.

Repository-level consumers still require coordinated updates, including `index.html`, scripts, tests, documentation, the service-worker precache and release audits.

The Core root becomes easier to navigate only after the later responsibility-based cleanup. That cleanup remains CI-gated and must preserve public exports.

## Non-goals

- Do not move `css` into `core`.
- Do not move `assets` into `core`.
- Do not change calculation behavior.
- Do not rename module identifiers.
- Do not combine the outer directory move with internal Core reorganization.
- Do not change the application bootstrap behavior.

## Risk assessment

| Risk | Assessment | Mitigation |
|---|---|---|
| Repository path churn | High | Prepare audits and precache first, then move both runtime trees atomically. |
| Missed static path | High | Scan runtime, tests, scripts, HTML, service worker and documentation before deletion of `js`. |
| Import regression | Medium | Preserve the sibling relationship between `core` and `modules`. |
| Offline regression | Medium | Regenerate and verify the complete precache manifest. |
| Core root remains crowded | Medium | Reorganize one responsibility family at a time only after the outer move is green. |
| CSS or asset regression | Low | Keep both resource trees at their established root paths. |

## Follow-up work

- prepare import, audit and precache tooling for `core` and `modules`
- move `js/core` and `js/modules` together
- run all quality gates and complete visual verification
- reorganize Core by responsibility in isolated blocks
- forbid recreation of the removed `js` runtime boundary
- prepare release 2.0.0 only after final release readiness
