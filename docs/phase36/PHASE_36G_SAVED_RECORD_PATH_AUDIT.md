# Phase 36G – Saved-Record-Pfad Audit

Status: PASS

## Prüfkriterien

- [x] rainwater: no export function savedRecords() — Treffer: 0
- [x] rainwater: no createLineSectionController in controller.js — Treffer: 0
- [x] rainwater: exactly one createLineSectionController in index.js — Treffer: 1
- [x] rainwater: no dynamicAttr saved-records — Treffer: 0
- [x] rainwater: no data-platform-dynamic saved-records — Treffer: 0
- [x] rainwater: no exported SavedController in controller.js — Treffer: 0
- [x] rainwater: renderCard only in view.js — Treffer: 1
- [x] wastewater: no export function savedRecords() — Treffer: 0
- [x] wastewater: no createLineSectionController in controller.js — Treffer: 0
- [x] wastewater: exactly one createLineSectionController in index.js — Treffer: 1
- [x] wastewater: no dynamicAttr saved-records — Treffer: 0
- [x] wastewater: no data-platform-dynamic saved-records — Treffer: 0
- [x] wastewater: no exported SavedController in controller.js — Treffer: 0
- [x] wastewater: renderCard only in view.js — Treffer: 1

## Fundstellen nach Datei


### `js/modules/rainwater/index.js`
- L17 `createLineSectionController`: `import { createRainwaterView } from './view.js';\n\nconst lineSectionController = createLineSectionController({\n  state,\n  listKey: 'surfaces',\n  activeIdKey: 'activeSurfaceId',\n  nameKey: 'areaName',\n  expandedIdKey: 'expandedSur`
- L29 `line_sections_dynamic_attr`: `ord',\n  emptyText: 'Noch keine Regenflächen gespeichert.',\n  accent: 'green',\n  dynamicAttr: 'line-sections',\n  title: item => item.name || 'Regenfläche',\n  subtitle: rainwaterSavedSubtitle,\n  stats: rainwaterSavedStats,\n  curre`

### `js/modules/rainwater/view.js`
- L21 `renderCard`: `>`\n    ].join(''));\n\n    const savedColumn = stack([\n      lineSectionController.renderCard(s)\n    ].join(''));\n\n    return renderModuleShell(moduleConfig, `\n      <div class="span-6">${inputColumn}</div>\n      <`

### `js/modules/wastewater/index.js`
- L17 `createLineSectionController`: `mport { createWastewaterView } from './view.js';\n\nconst lineSectionController = createLineSectionController({\n  state,\n  listKey: 'savedCalculations',\n  activeIdKey: 'activeCalculationId',\n  nameKey: 'name',\n  expandedIdKey: 'ex`
- L29 `line_sections_dynamic_attr`: `ext: 'Noch keine Schmutzwasser-Berechnungen gespeichert.',\n  accent: 'green',\n  dynamicAttr: 'line-sections',\n  title: item => item.name || 'Berechnung',\n  subtitle: wastewaterSavedSubtitle,\n  stats: wastewaterSavedStats,\n  curr`

### `js/modules/wastewater/view.js`
- L49 `renderCard`: `mic="result">${renderWastewaterResult(s, r)}</div>`,\n      lineSectionController.renderCard(s)\n    ].join(''));\n\n    return renderModuleShell(config, `\n      <div class="span-6">${inputColumn}</div>\n      <div cl`

### `js/platform/lineSectionController/index.js`
- L11 `createLineSectionController`: `value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');\n}\n\nexport function createLineSectionController({\n  state,\n  listKey = 'lineSections',\n  activeIdKey = 'activeLineSectionId',\n  nameKey = 'activeLineSectionName',\n  exp`