# Phase 14G - Regenwasser Global Standard

Regenwasser follows the reference-module direction from Heizung/Kälte and Lüftung more strictly.

## Completed in this phase

- Removed the dormant calculation-level save workflow.
- Removed unused calculation snapshot/render functions.
- Removed the bespoke surface-dimension card renderer.
- Kept one user workflow: Regenflächen are stored, selected, updated, deleted and expanded through the global saved-record UI.
- Removed obsolete calculation save state keys from the module initial state.
- Added a dedicated regression test for the Phase 14G contract.

## Remaining observation

The module is now functionally aligned with the global saved-record workflow. A final mobile smoke test should still verify scroll behavior and select behavior on a physical device before marking Regenwasser as fully reference-grade.
