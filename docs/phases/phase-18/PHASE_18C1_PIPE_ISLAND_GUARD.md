# Phase 18C.1 - Pipe Recommendation Island Guard

## Goal

Changing the pipe material in Heizung/Kälte must only refresh the pipe recommendation island. The global navigation pill and the app shell must remain mounted.

## Platform rule

`pipeSystemId` is treated as a recommendation-only update in `platform/dynamicRenderer`:

- update `[data-hc-dynamic="pipe-recommendation"]`
- keep medium/result/input/line-section islands mounted
- never replace navigation or shell ancestors

## Regression

`tests/heating-cooling-phase18c1-pipe-island-guard.test.mjs` verifies that a pipe-only change updates the recommendation island without touching a simulated nav node or unrelated islands.
