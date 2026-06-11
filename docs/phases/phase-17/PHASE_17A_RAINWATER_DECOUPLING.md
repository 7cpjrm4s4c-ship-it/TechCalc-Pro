# Phase 17A - Rainwater Decoupling

Phase 17A starts the module-cleanup phase after the platform layers became stable.

## Goal

Rainwater must move from module-owned UI/action logic towards platform-owned contracts.

## Implemented in this step

- Added the shared `resultRenderer` facade for platform-owned result and notice cards.
- Rainwater result and notice cards now use the shared result renderer instead of direct `mainResult`/warning markup.
- Extended `savedRecordReducer` with `expandedIdKey` and `toggle-expanded` so accordion state can be handled by platform state rules.
- Rainwater surface create/update/load/delete/toggle actions now use `createSavedRecord` and `savedRecordReducer` instead of direct list mutations.
- Rainwater still owns domain mapping (`surfaceRecordSnapshot`, `surfaceRecordHydrate`) because this is Fachlogik, not UI logic.

## Next cleanup target

The remaining Rainwater renderer functions should be converted into schema/result definitions once the generic schema renderer supports the required grouped domain layout.
