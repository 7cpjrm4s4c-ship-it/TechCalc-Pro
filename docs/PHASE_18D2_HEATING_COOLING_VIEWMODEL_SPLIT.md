# Phase 18D.2 - Heating/Cooling Controller ViewModel Split

Heizung/Kälte now separates controller/state derivation from field composition.

## Changed

- Added `js/modules/heating-cooling/viewModel.js`.
- Moved `massFlowField()`, `powerField()` and `inputFields()` out of `controller.js`.
- Updated `view.js` to consume `inputFields()` from the view model.

## Contract

- `controller.js`: state derivation, active calculation state, line-section record creation and hydration.
- `viewModel.js`: UI field composition for the active calculation inputs.
- Platform remains responsible for mount, dynamic updates, results, saved records and layout.
