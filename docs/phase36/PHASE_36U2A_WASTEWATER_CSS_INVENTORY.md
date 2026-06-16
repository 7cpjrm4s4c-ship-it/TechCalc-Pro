# Phase 36U.2A – Wastewater CSS Inventory

Basis: `techcalc-pro-1.3.0-rc.1-phase36u1-wastewater-dynamic-wrapper-stack.zip`

## Kurzbefund

Schmutzwasser besitzt weiterhin deutlich mehr CSS-Ausnahmen als Regenwasser nach 36T.3. 36U.1 hat die Dynamic-Wrapper korrekt auf `tc-stack` gebracht, aber die alten `wastewater-*` Regeln in `modules.css` und einige `data-ww-dynamic` Regeln in `components.css` bleiben aktiv.

- Wastewater-Klassen gesamt: **15**
- `module-view[data-module='wastewater']` Regeln: **15**
- `[data-ww-dynamic]` Regeln: **3**
- doppelte Selektoren: **3**

## Klasseninventar

### `wastewater-compact-list`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- CSS-Regeln:
  - `css/modules.css`: `/* Wastewater / drinking water -------------------------------- */ .wastewater-fixtures, .wastewater-fixture__main, .wastewater-fixture__custom, .wastewater-compact-list, .wastewater-line-hints`

### `wastewater-compact-row`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- Hardcoded-Werte:
  - `grid-template-columns: minmax(0,1fr) minmax(120px,160px`
- CSS-Regeln:
  - `css/modules.css`: `.wastewater-compact-row`
  - `css/modules.css`: `.wastewater-compact-row__inputs`
  - `css/modules.css`: `.wastewater-compact-row__meta`
  - `css/modules.css`: `.pipe-dimension-card__meta, .wastewater-fixture__main, .wastewater-fixture__stats .inline-stats, .wastewater-compact-row__inputs, .buffer-input-grid, .buffer-input-grid--reserve`

### `wastewater-compact-row__inputs`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- Hardcoded-Werte:
  - `grid-template-columns: minmax(0,1fr) minmax(120px,160px`
- CSS-Regeln:
  - `css/modules.css`: `.wastewater-compact-row__inputs`
  - `css/modules.css`: `.pipe-dimension-card__meta, .wastewater-fixture__main, .wastewater-fixture__stats .inline-stats, .wastewater-compact-row__inputs, .buffer-input-grid, .buffer-input-grid--reserve`

### `wastewater-compact-row__meta`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- CSS-Regeln:
  - `css/modules.css`: `.wastewater-compact-row__meta`

### `wastewater-fixture`
- Kategorie: **legacy fixture component**
- JS-Nutzung: view
- Zielphase: 36U.2C
- Empfehlung: review; probably obsolete after tc-consumer-row migration
- Hardcoded-Werte:
  - `gap: 8px`
  - `grid-template-columns: minmax(0, 1fr) 86px 38px`
  - `grid-template-columns: minmax(0, 1fr) 96px 42px`
  - `grid-template-columns: minmax(0,1fr) 82px 38px`
  - `grid-template-columns: minmax(0,1fr) minmax(110px,160px`
  - `height: 34px`
  - `min-width: 38px`
  - `width: 38px`
- CSS-Regeln:
  - `css/modules.css`: `/* Wastewater / drinking water -------------------------------- */ .wastewater-fixtures, .wastewater-fixture__main, .wastewater-fixture__custom, .wastewater-compact-list, .wastewater-line-hints`
  - `css/modules.css`: `.wastewater-fixture`
  - `css/modules.css`: `.wastewater-fixture-row`
  - `css/modules.css`: `.wastewater-fixture__main`
  - `css/modules.css`: `.wastewater-fixture__stats .inline-stats`
  - `css/modules.css`: `.wastewater-fixture__delete`
  - `css/modules.css`: `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable`
  - `css/modules.css`: `.tc-collection-row.tc-consumer-row--editable > button, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable > button`
  - `css/modules.css`: `.pipe-dimension-card__meta, .wastewater-fixture__main, .wastewater-fixture__stats .inline-stats, .wastewater-compact-row__inputs, .buffer-input-grid, .buffer-input-grid--reserve`
  - `css/modules.css`: `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable`
  - `css/modules.css`: `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable`
  - `css/modules.css`: `.wastewater-fixture-row`
  - `css/modules.css`: `/* Phase 35A: module exception cleanup after RC retest. */ .module-view[data-module='drinking-water'] .tc-collection-row.tc-consumer-row--editable, .module-view[data-module='drinking-water'] .dw-consumer-row--editable, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable`
  - `css/modules.css`: `.module-view[data-module='drinking-water'] .tc-collection-row.tc-consumer-row--editable, .module-view[data-module='drinking-water'] .dw-consumer-row--editable, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable`

### `wastewater-fixture-row`
- Kategorie: **collection row styling**
- JS-Nutzung: view
- Zielphase: 36U.2C
- Empfehlung: prefer global tc-consumer-row/tc-collection-row; keep only if domain-specific
- Hardcoded-Werte:
  - `gap: 8px`
  - `grid-template-columns: minmax(0, 1fr) 86px 38px`
  - `grid-template-columns: minmax(0, 1fr) 96px 42px`
  - `grid-template-columns: minmax(0,1fr) 82px 38px`
  - `height: 34px`
  - `min-width: 38px`
  - `width: 38px`
- CSS-Regeln:
  - `css/modules.css`: `.wastewater-fixture-row`
  - `css/modules.css`: `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable`
  - `css/modules.css`: `.tc-collection-row.tc-consumer-row--editable > button, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable > button`
  - `css/modules.css`: `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable`
  - `css/modules.css`: `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable`
  - `css/modules.css`: `.wastewater-fixture-row`
  - `css/modules.css`: `/* Phase 35A: module exception cleanup after RC retest. */ .module-view[data-module='drinking-water'] .tc-collection-row.tc-consumer-row--editable, .module-view[data-module='drinking-water'] .dw-consumer-row--editable, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable`
  - `css/modules.css`: `.module-view[data-module='drinking-water'] .tc-collection-row.tc-consumer-row--editable, .module-view[data-module='drinking-water'] .dw-consumer-row--editable, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable`

### `wastewater-fixture-row--editable`
- Kategorie: **duplicate editable collection layout**
- JS-Nutzung: view
- Zielphase: 36U.2B
- Empfehlung: consolidate into global tc-collection-row rule or single module rule
- Hardcoded-Werte:
  - `gap: 8px`
  - `grid-template-columns: minmax(0, 1fr) 86px 38px`
  - `grid-template-columns: minmax(0, 1fr) 96px 42px`
  - `grid-template-columns: minmax(0,1fr) 82px 38px`
  - `height: 34px`
  - `min-width: 38px`
  - `width: 38px`
- CSS-Regeln:
  - `css/modules.css`: `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable`
  - `css/modules.css`: `.tc-collection-row.tc-consumer-row--editable > button, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable > button`
  - `css/modules.css`: `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable`
  - `css/modules.css`: `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable`
  - `css/modules.css`: `/* Phase 35A: module exception cleanup after RC retest. */ .module-view[data-module='drinking-water'] .tc-collection-row.tc-consumer-row--editable, .module-view[data-module='drinking-water'] .dw-consumer-row--editable, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable`
  - `css/modules.css`: `.module-view[data-module='drinking-water'] .tc-collection-row.tc-consumer-row--editable, .module-view[data-module='drinking-water'] .dw-consumer-row--editable, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable`

### `wastewater-fixture__custom`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- CSS-Regeln:
  - `css/modules.css`: `/* Wastewater / drinking water -------------------------------- */ .wastewater-fixtures, .wastewater-fixture__main, .wastewater-fixture__custom, .wastewater-compact-list, .wastewater-line-hints`

### `wastewater-fixture__delete`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- CSS-Regeln:
  - `css/modules.css`: `.wastewater-fixture__delete`

### `wastewater-fixture__main`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- Hardcoded-Werte:
  - `grid-template-columns: minmax(0,1fr) minmax(110px,160px`
- CSS-Regeln:
  - `css/modules.css`: `/* Wastewater / drinking water -------------------------------- */ .wastewater-fixtures, .wastewater-fixture__main, .wastewater-fixture__custom, .wastewater-compact-list, .wastewater-line-hints`
  - `css/modules.css`: `.wastewater-fixture__main`
  - `css/modules.css`: `.pipe-dimension-card__meta, .wastewater-fixture__main, .wastewater-fixture__stats .inline-stats, .wastewater-compact-row__inputs, .buffer-input-grid, .buffer-input-grid--reserve`

### `wastewater-fixture__stats`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- CSS-Regeln:
  - `css/modules.css`: `.wastewater-fixture__stats .inline-stats`
  - `css/modules.css`: `.pipe-dimension-card__meta, .wastewater-fixture__main, .wastewater-fixture__stats .inline-stats, .wastewater-compact-row__inputs, .buffer-input-grid, .buffer-input-grid--reserve`

### `wastewater-fixtures`
- Kategorie: **list stack/layout**
- JS-Nutzung: view
- Zielphase: 36U.2C
- Empfehlung: replace by tc-consumer-list/tc-stack; remove class from markup if no longer needed
- CSS-Regeln:
  - `css/modules.css`: `/* Wastewater / drinking water -------------------------------- */ .wastewater-fixtures, .wastewater-fixture__main, .wastewater-fixture__custom, .wastewater-compact-list, .wastewater-line-hints`

### `wastewater-line-hints`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- CSS-Regeln:
  - `css/modules.css`: `/* Wastewater / drinking water -------------------------------- */ .wastewater-fixtures, .wastewater-fixture__main, .wastewater-fixture__custom, .wastewater-compact-list, .wastewater-line-hints`

### `wastewater-line-selector`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- CSS-Regeln:
  - `css/modules.css`: `.wastewater-line-selector`
  - `css/modules.css`: `.wastewater-line-selector button`

### `wastewater-subselect`
- Kategorie: **dead-css-or-global-selector-only**
- JS-Nutzung: keine
- Zielphase: 36U.2B
- Empfehlung: delete candidate after selector split
- Hardcoded-Werte:
  - `gap: 8px`
- CSS-Regeln:
  - `css/modules.css`: `.wastewater-subselect`
  - `css/modules.css`: `.wastewater-subselect > span`

## Module-View-Regeln

### `.module-view[data-module='wastewater'] .segmented` in `css/modules.css`
```css
overflow-x: auto;
```

### `.module-view[data-module='wastewater'] .segmented button` in `css/modules.css`
```css
min-width: max-content;
```

### `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable` in `css/modules.css`
```css
display: grid; grid-template-columns: minmax(0,1fr) 82px 38px; column-gap: var(--tc-gap); align-items: center;
```

### `.tc-collection-row.tc-consumer-row--editable > button, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable > button` in `css/modules.css`
```css
width: 38px; min-width: 38px; height: 34px; justify-self: end;
```

### `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable` in `css/modules.css`
```css
grid-template-columns: minmax(0,1fr) 82px 38px;
```

### `.module-view[data-module='wastewater'] .wastewater-fixture-row--editable, .tc-collection-row.tc-consumer-row--editable` in `css/modules.css`
```css
grid-template-columns: minmax(0,1fr) 82px 38px; column-gap: 8px;
```

### `/* Phase 35A: module exception cleanup after RC retest. */ .module-view[data-module='drinking-water'] .tc-collection-row.tc-consumer-row--editable, .module-view[data-module='drinking-water'] .dw-consumer-row--editable, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable` in `css/modules.css`
```css
display: grid;
  grid-template-columns: minmax(0, 1fr) 96px 42px;
  align-items: center;
  column-gap: var(--tc-gap);
```

### `.module-view[data-module='drinking-water'] .tc-quantity-field, .module-view[data-module='wastewater'] .tc-quantity-field, .module-view[data-module='drinking-water'] .mini-edit-field, .module-view[data-module='wastewater'] .mini-edit-field` in `css/modules.css`
```css
width: 96px;
  min-width: 96px;
  max-width: 96px;
  justify-self: end;
```

### `.module-view[data-module='drinking-water'] .tc-quantity-field input, .module-view[data-module='wastewater'] .tc-quantity-field input, .module-view[data-module='drinking-water'] .mini-edit-field input, .module-view[data-module='wastewater'] .mini-edit-field input` in `css/modules.css`
```css
width: 100%;
  text-align: right;
  font-variant-numeric: tabular-nums;
```

### `.module-view[data-module='buffer-storage'] [data-buffer-dynamic="result"], .module-view[data-module='hx-diagram'] [data-hx-dynamic="results"], .module-view[data-module='wastewater'] .card__body` in `css/modules.css`
```css
display: grid;
  gap: var(--tc-gap);
```

### `.module-view[data-module='drinking-water'] .tc-collection-row.tc-consumer-row--editable, .module-view[data-module='drinking-water'] .dw-consumer-row--editable, .module-view[data-module='wastewater'] .wastewater-fixture-row--editable` in `css/modules.css`
```css
grid-template-columns: minmax(0, 1fr) 86px 38px;
```

### `.module-view[data-module='drinking-water'] .tc-quantity-field, .module-view[data-module='wastewater'] .tc-quantity-field, .module-view[data-module='drinking-water'] .mini-edit-field, .module-view[data-module='wastewater'] .mini-edit-field` in `css/modules.css`
```css
width: 86px;
    min-width: 86px;
    max-width: 86px;
```

### `/* Phase 36Q.4: wastewater follows global spacing only. */ .module-view[data-module='wastewater'] .card, .module-view[data-module='wastewater'] .result-card` in `css/modules.css`
```css
margin: 0;
```

### `.module-view[data-module='wastewater'] .card__body` in `css/modules.css`
```css
gap: var(--tc-gap);
```

### `/* Wastewater: direct dynamic wrappers inside module columns need the same rhythm as cards. */ .module-view[data-module='wastewater'] .span-6 > [data-ww-dynamic]` in `css/components.css`
```css
margin: 0;
```

## Empfohlene Umsetzung

### 36U.2B – Sofort konsolidieren
- doppelte `.wastewater-fixture-row--editable` / `tc-collection-row` Layoutregeln zusammenführen
- hardcoded `82px`, `96px`, `38px`, `42px`, `34px` auf eine globale Collection-Row-Regel reduzieren
- `gap: 8px` auf `var(--tc-gap)` umstellen

### 36U.2C – Legacy-Klassen entfernen
- `wastewater-fixtures` aus Markup entfernen, wenn `tc-consumer-list` reicht
- `wastewater-fixture-row` / `wastewater-fixture-row--editable` durch reine `tc-consumer-row tc-collection-row` ersetzen
- nicht genutzte Klassen wie `wastewater-fixture__main`, `wastewater-fixture__custom`, `wastewater-compact-*` löschen, wenn JS sie nicht mehr rendert

### 36U.2D – Restprüfung
- `wastewater-line-selector` nur behalten, wenn Scroll-Snap tatsächlich notwendig ist
- alle `module-view[data-module='wastewater']` Regeln entfernen oder auf globale Primitive verschieben
