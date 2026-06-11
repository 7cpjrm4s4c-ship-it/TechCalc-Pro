# Phase 13C - Ventilation derived temperature difference

The ventilation module now treats the temperature difference as a derived value.

Rules:
- Delta T is calculated from supply-air temperature and room temperature.
- Delta T is rendered read-only in the input area.
- Saved ventilation records no longer hydrate a stale editable Delta T value.
- Calculations use the current store values for supply-air and room temperature as the source of truth.

This keeps the ventilation module aligned with the Heizung/Kälte reference architecture: user-editable inputs stay in the store, derived values are displayed but not committed as independent source data.
