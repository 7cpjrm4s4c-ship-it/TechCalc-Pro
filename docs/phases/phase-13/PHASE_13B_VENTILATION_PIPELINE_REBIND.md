# Phase 13B — Ventilation Pipeline Rebind Fix

Ventilation now relies on the same root-level event pipeline as the Heizung/Kälte reference module.

## Fixed

- The central event pipeline is rebound when a reused module root switches to a different module state.
- Visual segment feedback can no longer update only the UI while committing into a stale store.
- Ventilation mode/target switches, calculation updates and save actions use the active Ventilation store.

## Guard

`event-pipeline-rebind.test.mjs` verifies that stale pipeline bindings are cleaned up before rebinding to another module state.
