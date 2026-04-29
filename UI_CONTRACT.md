# TechCalc Pro — verbindlicher UI-Vertrag

## Grundsatz
Neue Module definieren keine eigenen Desktop-/Mobile-Layouts. Sie verwenden ausschließlich zentrale `tcp-*` Strukturklassen. Modulindividuell erlaubt ist nur die Akzentfarbe.

## Pflichtstruktur

```html
<div class="tab-panel tcp-module tcp-module--moduleName">
  <div class="tab-inner tcp-layout">
    <div class="tcp-col tcp-col--left">...</div>
    <div class="tcp-col tcp-col--right">...</div>
  </div>
</div>
```

## Karten
- Standardkarte: `.gc.tcp-card`
- Ergebniskarte: `.out-card.tcp-card.tcp-result-card`
- Kompakte Karte: `.tcp-card--compact`
- Karte ohne Innenabstand: `.tcp-card--flush`

## Ergebniszeilen
- Ergebniszeile: `.tcp-result-row`
- Titel: `.ui-result-title` oder bestehend `.ob-title`
- Wert: `.ui-result-value` oder bestehend `.out-val`

## Layout
- Zwei-Spalten-Desktop wird von `.tcp-layout` und `.tcp-col` gesteuert.
- Mobile wird automatisch zu einer Spalte.
- Keine `nth-of-type`-Layoutregeln in neuen Modulen.
- Keine Inline-Abstände in neuen Modulen.

## Akzente
Module setzen ausschließlich Variablen:

```css
.tcp-module--example {
  --module-accent: ...;
  --module-accent-t: ...;
  --module-accent-b: ...;
}
```

## PDF
PDF-Layout gehört ausschließlich in `layout.css` oder PDF-spezifische Klassen. App-UI darf keine PDF-Annahmen enthalten.

## Phase-6-Erweiterung

### Standard-Layout ab jetzt
Für neue Module ist diese Struktur verbindlich:

```html
<div class="tab-panel tcp-module tcp-module--example">
  <div class="tab-inner tcp-layout">
    <div class="tcp-col tcp-col--left">
      <div class="gc tcp-card">...</div>
    </div>
    <div class="tcp-col tcp-col--right">
      <div class="out-card tcp-card tcp-result-card">...</div>
    </div>
  </div>
</div>
```

### Erlaubte Ausnahmen
- Einspaltige Module wie Einheiten dürfen `.tcp-layout` ohne `.tcp-col` nutzen.
- Modulfarben werden ausschließlich über `--module-accent`, `--module-accent-t`, `--module-accent-b` gesetzt.
- App-spezifische Gestaltung gehört in `style.css`; PDF-spezifische Gestaltung gehört in `layout.css`.

### Verbot für neue Module
- keine `nth-of-type`-Layouts
- keine Inline-Abstände
- keine eigenen Desktop-/Mobile-Breakpoints
- keine App-UI-Regeln in `layout.css`

---

## Ergänzung Phase 7 — V7-Klammer

Ab Phase 7 gilt zusätzlich:

```html
<body class="tc-app tc-ui-v7">
```

Neue App-UI-Regeln müssen unter dieser Klammer liegen:

```css
body.tc-app.tc-ui-v7 .tcp-card { ... }
```

### Verbindliche Regel
Neue Module dürfen keine eigenen Desktop-/Mobile-Layouts definieren. Erlaubt sind nur:

```css
.tcp-module--example {
  --module-accent: ...;
  --module-accent-t: ...;
  --module-accent-b: ...;
}
```

Nicht erlaubt in Modul-CSS:

- `position: relative` zur optischen Verschiebung von Cards
- `top`, `transform`, negative Margins zur Layoutkorrektur
- eigene Desktop-Grids
- eigene Mobile-Bottom-Abstände
- eigene Ergebniszeilenhöhen

### Standard-Markup für neue Module

```html
<div id="tab-example" class="tab-panel tcp-module tcp-module--example">
  <div class="tab-inner tcp-layout">
    <div class="tcp-col tcp-col--left">
      <section class="gc tcp-card">...</section>
    </div>
    <div class="tcp-col tcp-col--right">
      <section class="out-card tcp-card tcp-result-card">...</section>
    </div>
  </div>
</div>
```

---

## Ergänzung Phase 7 — V7-Klammer

Ab Phase 7 gilt zusätzlich:

```html
<body class="tc-app tc-ui-v7">
```

Neue App-UI-Regeln müssen unter dieser Klammer liegen:

```css
body.tc-app.tc-ui-v7 .tcp-card { ... }
```

### Verbindliche Regel
Neue Module dürfen keine eigenen Desktop-/Mobile-Layouts definieren. Erlaubt sind nur:

```css
.tcp-module--example {
  --module-accent: ...;
  --module-accent-t: ...;
  --module-accent-b: ...;
}
```

Nicht erlaubt in Modul-CSS:

- `position: relative` zur optischen Verschiebung von Cards
- `top`, `transform`, negative Margins zur Layoutkorrektur
- eigene Desktop-Grids
- eigene Mobile-Bottom-Abstände
- eigene Ergebniszeilenhöhen

### Standard-Markup für neue Module

```html
<div id="tab-example" class="tab-panel tcp-module tcp-module--example">
  <div class="tab-inner tcp-layout">
    <div class="tcp-col tcp-col--left">
      <section class="gc tcp-card">...</section>
    </div>
    <div class="tcp-col tcp-col--right">
      <section class="out-card tcp-card tcp-result-card">...</section>
    </div>
  </div>
</div>
```

## Phase 8 Ergänzung
Aktuelle App-Klammer: `body.tc-app.tc-ui-v8`. Alle zentralen App-Regeln müssen darunter gekapselt werden. `layout.css` bleibt PDF/Print vorbehalten; neue Modul-Layouts verwenden keine eigenen Media Queries für Desktop/Mobile, sondern `tcp-layout` und `tcp-card`/`tcp-result-row`.

## Phase 9 Ergänzung – stabiler UI-Vertrag

Aktive App-Klammer: `body.tc-app.tc-ui-v8.tc-ui-v9`. `tc-ui-v9` ist die führende Kaskadenschicht. Neue Module nutzen nur `tcp-module`, `tcp-layout`, `tcp-col`, `tcp-card` und `tcp-result-row`. Modulbezogene Abweichungen erfolgen ausschließlich über `--module-accent`, `--module-accent-t` und `--module-accent-b`.

## Phase 10 Ergänzung

- `body.tc-app.tc-ui-v10` ist die aktuelle harte Kaskadenklammer. Frühere `tc-ui-v*` Klassen bleiben nur zur Rückwärtskompatibilität erhalten.
- Neue Module verwenden ausschließlich `.tcp-module`, `.tcp-layout--2col` oder `.tcp-layout--3col`, `.tcp-card`, `.tcp-result-row` und eine Akzentklasse.
- App-UI-Regeln gehören in `style.css`; PDF-Regeln bleiben in `layout.css`/PDF-spezifischen Exportpfaden.
- Mobile Navigation darf nicht vom Inhaltsgrid abhängig sein; sie ist immer fixed und über die App-Klammer geschützt.

## Phase 11 Ergänzung

Neue Module verwenden ausschließlich `tcp-module`, `tcp-layout`, `tcp-card`, `tcp-result-row` und eine Modul-Akzentklasse. Abweichende Abstände, Feldhöhen oder Desktop/Mobile-Raster sind nicht im Modul zu definieren.

## Phase 12 Ergänzung

Ab Phase 12 gilt `tc-ui-v12` als aktive UI-Kaskade. Neue Module dürfen keine eigenen Desktop-/Mobile-Raster definieren. Erlaubt sind ausschließlich Modul-Akzentwerte über `--module-accent` und fachliche Sonderzustände, nicht aber globale Abstände, Header-Offsets oder Bottom-Navigation-Positionen.

## Phase 13 Ergänzung
Aktive UI-Klammer: `body.tc-app.tc-ui-v13`.

Neue Module müssen weiterhin diese Struktur verwenden:

```html
<section class="tcp-module tcp-module--air">
  <div class="tcp-layout tcp-layout--2col">
    <div class="tcp-col tcp-col--input">...</div>
    <div class="tcp-col tcp-col--result">...</div>
  </div>
</section>
```

Modulbezogene CSS-Regeln dürfen nur Akzentfarben oder fachliche Sonderfälle definieren. Raster, Abstände, Card-Styling, Eingabefelder, Ergebniszeilen und Mobile-Verhalten gehören ausschließlich in die zentrale UI-Schicht.
