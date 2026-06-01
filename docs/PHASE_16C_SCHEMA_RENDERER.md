# Phase 16C – Schema Renderer

Phase 16C introduces the central schema renderer as the next platform layer after the router/lifecycle and saved-record controller.

## Goal

Modules should no longer own input markup, result cards, select attributes, segment buttons, or field-level event wiring. A module should provide:

- `schema` – field and group definition
- `initialState` – default values
- `calculate(state)` – domain calculation
- `results` – result row definition

The platform renders:

- cards
- fields
- selects
- segments
- readonly values
- result rows
- central `data-field` / `data-tc-action` markers

## New central file

`js/core/schemaRenderer.js`

The renderer owns:

- `renderSchemaField()`
- `renderSchemaForm()`
- `renderSchemaResults()`
- `createSchemaView()`

## Compatibility

`js/core/formSchema.js` now keeps validation and schema defaults, while delegating all rendering to `schemaRenderer.js`.

Existing modules do not need to be rewritten immediately. The renderer is the target path for the next module migrations.

## Contract

A field rendered from schema must use global event markers:

- inputs/selects: `data-field`
- segment buttons: `data-tc-action="segment"`
- selects: immediate commit and lookup hydration by default

## Why this matters

The next migration phases can remove module-owned UI and gradually replace it with schema definitions. This is the main step toward modules containing only domain data and calculation logic.
