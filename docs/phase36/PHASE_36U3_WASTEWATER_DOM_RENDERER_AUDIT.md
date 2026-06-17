# Phase 36U.3 – Wastewater DOM-/Renderer-Audit

Basis: `techcalc-pro-1.3.0-rc.1-phase36v1-hx-field-action-dynamic-path.zip`

## Ziel

Schmutzwasser wird strukturell gegen funktionierende Referenzen verglichen, um verbliebene versteckte Abstandstreiber zu finden.

## View-Struktur Vergleich

### wastewater
- `renderModuleShell`: True
- `stack()` Aufrufe: 3
- `card()` Aufrufe: 4
- `span-6`: 2
- Dynamic Wrapper:
  - `<div class="tc-stack" data-ww-dynamic="usage">`
  - `<div class="tc-stack" data-ww-dynamic="line-fields">`
  - `<div class="tc-stack" data-ww-dynamic="fixture-inputs">`
  - `<div class="tc-stack" data-ww-dynamic="fixtures">`
  - `<div class="tc-stack" data-ww-dynamic="additional-flows">`
  - `<div class="tc-stack" data-ww-dynamic="result">`
- Custom Klassen: []

### rainwater
- `renderModuleShell`: True
- `stack()` Aufrufe: 2
- `card()` Aufrufe: 0
- `span-6`: 2
- Dynamic Wrapper:
  - `<div class="tc-stack" data-rw-dynamic="form">`
  - `<div class="tc-stack" data-rw-dynamic="result">`
- Custom Klassen: []

### pressure
- `renderModuleShell`: True
- `stack()` Aufrufe: 1
- `card()` Aufrufe: 5
- `span-6`: 2
- Dynamic Wrapper:
  - `<div data-ph-dynamic="basis">`
  - `<div data-ph-dynamic="holding-options">`
  - `<div data-ph-dynamic="volume-fields">`
  - `<div data-ph-dynamic="temperature-fields">`
  - `<div data-ph-dynamic="pressure-fields">`
  - `<div data-ph-dynamic="saved-records">`
  - `<div class="span-6" data-ph-dynamic="result">`
- Custom Klassen: ['ph-dynamic', 'pressure-fields']

### buffer
- `renderModuleShell`: True
- `stack()` Aufrufe: 4
- `card()` Aufrufe: 5
- `span-6`: 2
- Dynamic Wrapper:
  - `<div data-buffer-dynamic="medium">`
  - `<div data-buffer-dynamic="input-blocks">`
  - `<div data-buffer-dynamic="saved-records">`
  - `<div data-buffer-dynamic="result">`
- Custom Klassen: ['buffer-dynamic', 'buffer-help', 'buffer-input-grid', 'buffer-input-grid--defrost', 'buffer-input-grid--reserve', 'buffer-input-grid--runtime', 'buffer-mode-tabs', 'ph-help', 'ph-help--inline']

### heating
- `renderModuleShell`: True
- `stack()` Aufrufe: 4
- `card()` Aufrufe: 3
- `span-6`: 2
- Dynamic Wrapper:
  - `<div data-hc-dynamic="medium-stats">`
  - `<div data-hc-dynamic="mode-segment">`
  - `<div data-hc-dynamic="target-segment">`
  - `<div data-hc-dynamic="input-fields">`
  - `<div data-hc-dynamic="result">`
  - `<div class="formula" data-hc-dynamic="formula">`
  - `<div data-hc-dynamic="pipe-recommendation">`
- Custom Klassen: []

## Kritischer Befund


Schmutzwasser nutzt nach 36U.1 zwar `tc-stack` auf allen `data-ww-dynamic` Wrappern. Anders als Regenwasser enthält Schmutzwasser aber **jeden Eingabebereich bereits als eigene Card** und legt darin teilweise zusätzliche Dynamic-Stack-Wrapper ab:

```js
card('Nutzung', `<div class="tc-stack" data-ww-dynamic="usage">...</div>`)
card('Leitungsart / Randbedingungen', `<div class="tc-stack" data-ww-dynamic="line-fields">...</div>`)
card('Entwässerungsgegenstände', stack([
  `<div class="tc-stack" data-ww-dynamic="fixture-inputs">...</div>`,
  `<div class="tc-stack" data-ww-dynamic="fixtures">...</div>`
]))
```

Das ist prinzipiell gültig, aber es bedeutet:
- äußere Spalte: `stack()` Gap zwischen Cards
- innerhalb Card: `.card__body` Gap
- darin: `.tc-stack` Gap

Wenn zusätzlich CSS für `data-ww-dynamic` oder `.module-view[data-module='wastewater'] .card__body` aktiv ist, kann der Abstand sichtbar größer wirken.
## Verbliebene CSS-Regeln mit möglichem Abstandseinfluss

### `/* Wastewater: direct dynamic wrappers inside module columns need the same rhythm as cards. */ .module-view[data-module='wastewater'] .span-6 > [data-ww-dynamic]` in `css/components.css`
```css
margin: 0;
```

### `/* Phase 36Q.5: complete dynamic wrapper display reset */ [data-ww-dynamic="usage"], [data-ww-dynamic="line-fields"], [data-ww-dynamic="fixture-inputs"], [data-ww-dynamic="fixtures"], [data-ww-dynamic="additional-flows"], [data-ww-dynamic="result"]` in `css/components.css`
```css
display: block;
  min-width: 0;
```

### `.wastewater-subselect` in `css/modules.css`
```css
display: grid; gap: var(--tc-gap);
```

### `.module-view[data-module='buffer-storage'] [data-buffer-dynamic="result"], .module-view[data-module='hx-diagram'] [data-hx-dynamic="results"], .module-view[data-module='wastewater'] .card__body` in `css/modules.css`
```css
display: grid;
  gap: var(--tc-gap);
```

### `/* Phase 36Q.4: wastewater follows global spacing only. */ .module-view[data-module='wastewater'] .card, .module-view[data-module='wastewater'] .result-card` in `css/modules.css`
```css
margin: 0;
```

### `.module-view[data-module='wastewater'] .card__body` in `css/modules.css`
```css
gap: var(--tc-gap);
```

## Wahrscheinlichster Abstandstreiber


Der wahrscheinlichste Resttreiber ist nicht mehr `wastewater-*`, sondern diese Kombination:

```css
[data-ww-dynamic] { ... }
[data-ww-dynamic="usage"], ...
.module-view[data-module='wastewater'] .card__body { gap: var(--tc-gap); }
```

Bei Regenwasser wurden `[data-rw-dynamic]` CSS-Ausnahmen entfernt, und die Wrapper erhielten nur die globale Klasse `tc-stack`. Bei Schmutzwasser existieren nach 36U.2C noch `[data-ww-dynamic]` CSS-Regeln. Damit ist Schmutzwasser **nicht exakt auf demselben Pfad wie Regenwasser**.

### Konsequenz
36U.4 sollte Schmutzwasser analog zu 36T.3/36T.6 behandeln:

1. `[data-ww-dynamic]` CSS-Ausnahmen aus `components.css` entfernen.
2. `module-view[data-module='wastewater'] .card__body` Sonderregel entfernen.
3. Nur `class="tc-stack"` auf Dynamic-Wrappern behalten.
4. Danach erneut Screenshot prüfen.
## Konkreter Patch-Vorschlag für 36U.4

```css
/* entfernen */
[data-ww-dynamic],
[data-ww-dynamic="usage"],
[data-ww-dynamic="line-fields"],
[data-ww-dynamic="fixture-inputs"],
[data-ww-dynamic="fixtures"],
[data-ww-dynamic="additional-flows"],
[data-ww-dynamic="result"] { ... }

.module-view[data-module='wastewater'] .card__body { ... }
.module-view[data-module='wastewater'] .span-6 > [data-ww-dynamic] { ... }
```

Die Dynamic-Wrapper bleiben im HTML, aber ihr Layout kommt ausschließlich aus:

```html
class="tc-stack"
```
