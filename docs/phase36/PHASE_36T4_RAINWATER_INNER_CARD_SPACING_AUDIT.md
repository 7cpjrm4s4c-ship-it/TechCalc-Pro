# Phase 36T.4 – Rainwater Inner-Card Spacing Audit

Basis: `techcalc-pro-1.3.2-dev.1-rc.1-phase36t3-rainwater-zero-css-exceptions.zip`

## Ergebnis

Die äußeren Card-Abstände sind korrekt. Das verbleibende Problem entsteht innerhalb der Cards durch die Kombination globaler Primitive, nicht durch Rainwater-spezifische CSS-Regeln.

## Wahrscheinliche Ursachen

### 1. Form-Cards: doppelter vertikaler Rhythmus

Rainwater nutzt `renderFormSchema()` und erzeugt viele einzelne `.field`-Elemente in `.form-grid`/`.card__body`. Die globale Kette ist:

```text
.card
  gap: var(--tc-gap)
.card__body
  gap: var(--tc-gap)
.form-grid
  gap: var(--tc-gap)
.field
  gap: var(--tc-gap)
.control
  min-height: var(--tc-control-height)
```

Bei mobilen Einspalten-Layouts wirkt dieser Rhythmus sehr groß, weil jedes Feld aus Label + Control besteht und beide zusätzlich durch `.field { gap: var(--tc-gap) }` getrennt werden.

### 2. Result-Cards: `.result-row` ist auf Mobile ein Grid

Global existiert im Mobile-Breakpoint:

```css
.result-row { display: grid; grid-template-columns: 1fr; }
```

Dadurch stehen Label und Wert untereinander. Zusammen mit `min-height: 36px`, `gap: var(--tc-gap)` und Border-Zeilen wirkt jede Result-Zeile deutlich höher als in Desktop-/Referenzansichten.

### 3. 36S.1 adressierte nur Padding, nicht die Mobile-Struktur

Das Entfernen von `.result-row` Padding war korrekt, aber die sichtbare Höhe bleibt durch `gap`, `min-height`, mobile `display:grid` und die Label/Wert-Zweizeiligkeit bestehen.

## Relevante CSS-Regeln

### `.card__body, .tc-card__body, .result-card__body` in `css/components.css`
```css
display: grid;
  gap: var(--tc-gap);
  min-width: 0;
```

### `.card *, .tc-card *, .result-card *, .result-row *, .inline-stat *, .main-result *, .saved-record-card *, .line-section-card *` in `css/components.css`
```css
min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
```

### `.tc-stack, .tc-stack--section, .card-grid, .form-grid, .two-column, .tc-two-column, .settings-list, .quick-access-list, .quick-access-pool` in `css/components.css`
```css
display: grid;
  gap: var(--tc-gap);
  min-width: 0;
```

### `.result-row` in `css/components.css`
```css
display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--tc-gap);
  min-height: 36px;
  padding: 0;
  border-bottom: 1px solid rgba(255,255,255,.08);
```

### `.result-row span` in `css/components.css`
```css
color: var(--color-muted);
```

### `.result-row strong` in `css/components.css`
```css
color: var(--color-text); font-size: 18px; line-height: 1.2; text-align: left; white-space: normal;
```

### `.result-row small` in `css/components.css`
```css
font-size: .85em; color: var(--color-text);
```

### `.main-result` in `css/components.css`
```css
display: grid; gap: 4px; padding: var(--tc-gap) 0; border-bottom: 1px solid rgba(255,255,255,.10);
```

### `.main-result span` in `css/components.css`
```css
color: var(--color-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 1.4px; font-weight: 900;
```

### `.main-result strong` in `css/components.css`
```css
color: var(--color-text); font-size: clamp(24px,3vw,36px); line-height: 1.05; font-weight: 900; text-align: left;
```

### `:root[data-theme='light'] strong, :root[data-theme='light'] .inline-stat strong, :root[data-theme='light'] .main-result strong, :root[data-theme='light'] .result-row strong` in `css/components.css`
```css
color: #101827;
```

### `.result-row` in `css/components.css`
```css
display: grid; grid-template-columns: 1fr;
```

### `.card, .tc-card, .result-card, .line-section-card, .saved-record-card, .ph-saved-item, .pipe-dimension-card, .inline-stat, .result-row, .main-result` in `css/components.css`
```css
min-width: 0;
  max-width: 100%;
  overflow: hidden;
```

### `.inline-stat, .main-result, .pipe-result-head, .tc-result-item` in `css/components.css`
```css
padding: var(--tc-gap);
  border-radius: var(--radius-md);
```

### `.result-row > *, .inline-stat > *, .main-result > *, .pipe-result-head > *, .tc-result-item > *` in `css/components.css`
```css
min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
```

### `/* Phase 36S.1: result-row spacing is owned by .result-list gap */ .result-list > .result-row, .tc-result-list > .result-row` in `css/components.css`
```css
padding: 0;
```

### `.module-view, .module-content, .tc-grid, .tc-fields, .card-grid, .form-grid` in `css/layout.css`
```css
row-gap: var(--ui-gap);
  column-gap: var(--ui-gap);
```

### `.card-grid, .form-grid` in `css/layout.css`
```css
display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: var(--ui-gap);
```

### `.card-grid, .form-grid, .tc-fields, .tc-fields--3` in `css/layout.css`
```css
grid-template-columns: 1fr;
```

### `/* Mobile width lock and clipping guards. */ .app-main, .grid-12, .module-view, .tc-grid, .module-content, .two-column, .tc-two-column, .card-grid, .form-grid, .tc-fields` in `css/layout.css`
```css
min-width: 0;
  max-width: 100%;
```

### `.unit-all-values .result-row` in `css/modules.css`
```css
min-height: 34px; padding-block: 4px;
```

### `.unit-all-values .result-row span` in `css/modules.css`
```css
font-size: 15px; font-weight: 500; color: var(--color-muted);
```

### `.unit-all-values .result-row strong` in `css/modules.css`
```css
font-size: 16px; font-weight: 650; color: var(--color-muted);
```

### `:root[data-theme='light'] .unit-all-values .result-row span, :root[data-theme='light'] .unit-all-values .result-row small` in `css/modules.css`
```css
color: #6b7280;
```

### `:root[data-theme='light'] .unit-all-values .result-row strong` in `css/modules.css`
```css
color: #4b5563;
```

## Empfehlung für 36T.5

Nicht weiter Rainwater-spezifisch patchen. Stattdessen globale mobile Compact-Regeln für Ergebniszeilen und Feldabstände einführen, die allen Modulen helfen:

```css
@media (max-width: 767px) {
  .field,
  .tc-field,
  .settings-field {
    gap: calc(var(--tc-gap) * .5);
  }

  .result-row {
    min-height: 0;
    gap: calc(var(--tc-gap) * .5);
  }

  .result-list,
  .tc-result-list {
    gap: calc(var(--tc-gap) * .75);
  }
}
```

Damit bleibt der globale Standard erhalten, aber Mobile wird kompakter. Das erklärt, warum die Abstände bei Regenwasser sichtbar problematisch sind: das Modul hat viele Form- und Result-Zeilen direkt untereinander.

