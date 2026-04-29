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
