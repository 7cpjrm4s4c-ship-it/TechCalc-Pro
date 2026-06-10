# Phase 16D – CSS / UI System Consolidation

Phase 16D starts the move from module-owned visual rules to a platform-owned CSS system.

## Goal

New and migrated modules must compose global `tc-*` primitives instead of introducing module-specific UI classes.

## Added platform primitives

- `tc-card`
- `tc-card__header`
- `tc-card__title`
- `tc-card__subtitle`
- `tc-card__body`
- `tc-field`
- `tc-field__label`
- `tc-result-list`
- `tc-result-item`
- `tc-save-actions`
- `tc-actions`
- `tc-scroll-safe`

## Migration rule

Modules may keep legacy selectors temporarily, but every new migration step must reduce module UI classes such as:

- `dw-*`
- `ph-*`
- `rainwater-*`
- `wastewater-*`
- `hx-*`
- `pipe-*`
- `buffer-*`

## Quality gate

Phase 16D adds `scripts/audit-css-system-phase16d.mjs` and `tests/css-system-phase16d.test.mjs`.

The audit verifies:

- required global primitives exist
- `!important` usage stays below budget
- remaining module selector debt is explicitly tracked

## Next step

Phase 16E should consolidate events. After that, Phase 17 can begin removing module-specific CSS selectors module by module.
