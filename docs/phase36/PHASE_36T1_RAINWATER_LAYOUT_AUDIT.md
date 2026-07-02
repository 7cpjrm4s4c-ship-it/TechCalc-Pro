# Phase 36T.1 – Rainwater Layout Audit

Basis: `techcalc-pro-1.3.2-dev.1-rc.1-phase36s3-platform-navigation-parity.zip`

## Kurzbefund

Regenwasser ist strukturell bereits nah am Plattformstandard: `renderModuleShell`, zwei `span-6`-Spalten, `stack()` und `lineSectionController.renderCard()` sind vorhanden. Die verbleibenden Abweichungen sitzen überwiegend in `css/modules.css` und betreffen alte `rainwater-*` Spezialklassen.

## Rainwater Custom-Klassen

### `rainwater-kostra-link`
- Kategorie: **dead-css-or-selector-only**
- JS-Nutzung: keine
- Empfehlung: löschen, falls kein Runtime-HTML diese Klasse erzeugt
- CSS-Regeln:
  - `.rainwater-kostra-link`

### `rainwater-result-group`
- Kategorie: **dead-css-or-selector-only**
- JS-Nutzung: keine
- Empfehlung: löschen, falls kein Runtime-HTML diese Klasse erzeugt
- CSS-Regeln:
  - `.rainwater-result-group`
  - `.rainwater-result-group + .rainwater-result-group`
  - `.rainwater-result-group h4`

### `rainwater-result-list`
- Kategorie: **dead-css-or-selector-only**
- JS-Nutzung: keine
- Empfehlung: löschen, falls kein Runtime-HTML diese Klasse erzeugt
- CSS-Regeln:
  - `/* Wastewater / rainwater / drinking water -------------------------------- */ .rainwater-result-list, .wastewater-fixtures, .wastewater-fixture__main, .wastewater-fixture__custom, .wastewater-compact-list, .wastewater-line-hints`
  - `.rainwater-surface-row.is-active, .rainwater-result-list .line-section-card.is-active`

### `rainwater-surface-row`
- Kategorie: **dead-css-or-selector-only**
- JS-Nutzung: keine
- Empfehlung: löschen, falls kein Runtime-HTML diese Klasse erzeugt
- CSS-Regeln:
  - `.rainwater-surface-row`
  - `.rainwater-surface-row.is-active, .rainwater-result-list .line-section-card.is-active`

## `module-view[data-module='rainwater']` Regeln

### `.module-view[data-module='buffer-storage'] [data-buffer-dynamic="result"], .module-view[data-module='hx-diagram'] [data-hx-dynamic="results"], .module-view[data-module='wastewater'] .card__body, .module-view[data-module='rainwater'] .card__body`
```css
display: grid;
  gap: var(--tc-gap);
```
### `/* Phase 36Q.4: rainwater/wastewater follow global spacing only. */ .module-view[data-module='rainwater'] .card, .module-view[data-module='wastewater'] .card, .module-view[data-module='rainwater'] .result-card, .module-view[data-module='wastewater'] .result-card`
```css
margin: 0;
```
### `.module-view[data-module='rainwater'] .card__body, .module-view[data-module='wastewater'] .card__body`
```css
gap: var(--tc-gap);
```
## Referenzvergleich View-Struktur

### rainwater
- `renderModuleShell`: True
- `stack()`: True
- `card()`: False
- `lineSectionController.renderCard`: True
- `span-6`: 2
- Dynamic Wrapper: ['form', 'result']
- Custom Klassen: []

### heating_view
- `renderModuleShell`: True
- `stack()`: True
- `card()`: True
- `lineSectionController.renderCard`: True
- `span-6`: 2
- Dynamic Wrapper: ['formula', 'input-fields', 'medium-stats', 'mode-segment', 'pipe-recommendation', 'result', 'target-segment']
- Custom Klassen: []

### pressure_view
- `renderModuleShell`: True
- `stack()`: True
- `card()`: True
- `lineSectionController.renderCard`: False
- `span-6`: 2
- Dynamic Wrapper: ['basis', 'holding-options', 'pressure-fields', 'result', 'saved-records', 'temperature-fields', 'volume-fields']
- Custom Klassen: []

### buffer_view
- `renderModuleShell`: True
- `stack()`: True
- `card()`: True
- `lineSectionController.renderCard`: False
- `span-6`: 2
- Dynamic Wrapper: ['input-blocks', 'medium', 'result', 'saved-records']
- Custom Klassen: ['buffer-input-grid', 'buffer-mode-tabs', 'ph-help']

### ventilation_view
- `renderModuleShell`: True
- `stack()`: True
- `card()`: True
- `lineSectionController.renderCard`: True
- `span-6`: 2
- Dynamic Wrapper: ['air-stats', 'formula', 'input-fields', 'mode-segment', 'result', 'target-segment', 'temperatures']
- Custom Klassen: []

## Empfehlung für 36T.2

### Ziel
Regenwasser soll keine eigenen Layout-Ausnahmen mehr benötigen.

### Sichere Reihenfolge
1. `rainwater-kostra-link` durch globale `.tc-action-link` ersetzen oder CSS-Regel löschen, wenn globale Zentrierung ausreicht.
2. `rainwater-result-group` / `rainwater-result-list` prüfen: Wenn sie nur `display:grid; gap:var(--tc-gap)` setzen, löschen und durch globale `result-groups` / `result-list` ersetzen.
3. `rainwater-surface-row` prüfen: Wenn nur Cursor/Active-State, auf `line-section-card`/`saved-record-card`-Standard umstellen.
4. Alle `.module-view[data-module='rainwater'] ...` Selektoren entfernen, sobald kein sichtbarer Unterschied mehr besteht.
