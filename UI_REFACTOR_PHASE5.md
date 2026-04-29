# TechCalc Pro — UI Refactoring Phase 5

## Ziel
Phase 5 härtet die zentrale UI-Sprache weiter ab. Wiederkehrende Inline-Styles werden in benannte `tcp-*` Primitive überführt und die App-/PDF-Trennung wird expliziter abgesichert.

## Umgesetzt

### 1. Neue zentrale Utility- und Contract-Klassen
Ergänzt in `style.css`:

- `.tcp-card-head`
- `.tcp-grid-2-sm`
- `.tcp-segmented`, `.tcp-segmented--2`
- `.tcp-section-kicker`
- `.tcp-col-kicker`, `.tcp-col-kicker--heat`, `.tcp-col-kicker--cold`
- `.tcp-pad-x`, `.tcp-pad-b-sm`, `.tcp-divider-top`
- `.tcp-flex-1`, `.tcp-line`, `.tcp-nowrap`
- `.tcp-m-0`, `.tcp-mb-2`, `.tcp-mb-3`, `.tcp-mt-2`
- `.tcp-muted`, `.tcp-note`, `.tcp-empty-note`
- `.tcp-mono-strong`, `.tcp-mono-small`
- `.tcp-action-row--stretch`

Damit werden häufige visuelle Einzelentscheidungen aus dem Markup herausgezogen und zentral wartbar.

### 2. HTML weiter bereinigt
In `index.html` wurden mehrere wiederkehrende Inline-Styles durch die neuen `tcp-*` Klassen ersetzt. Besonders betroffen sind wiederkehrende Header-, Grid-, Segment- und Textmuster.

### 3. App-/PDF-Schutz erweitert
In `style.css` ergänzt:

- Screen-Regeln für `pdf-only` / `data-pdf-only`
- Print-Regeln zum Ausblenden von Header, Navigation, Mobile-Pill, Menüs und Floating Actions
- `#app-shell` erhält im Print-Kontext keinen App-Header-Abstand

### 4. UI-Vertrag weiter konkretisiert
Neue Module sollen ab jetzt nur noch über folgende Kernstruktur aufgebaut werden:

```html
<div class="tab-panel tcp-module tcp-module--...">
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

## Weiterhin bewusst nicht vollständig entfernt
`layout.css` und `components.css` enthalten noch Legacy-Regeln und `!important`-Altlasten. Diese werden aktuell noch mitgeführt, damit die App stabil bleibt. Ab Phase 6 kann gezielt begonnen werden, ungenutzte Legacy-Blöcke zu löschen, wenn die aktuelle Phase visuell geprüft wurde.

## Prüfhinweise
Bitte besonders testen:

1. Lüftung: Temperaturkarte und Heiz-/Kühl-Switch.
2. Heizung/Kälte: Desktop-Spalten und Mobile Bottom-Pill.
3. Einheiten: Ergebniszeilen und Zentrierung.
4. PDF-Export: Header/Navigation dürfen nicht im Export erscheinen.
5. Desktop: gleiche Header-Abstände und gleiche Grid-Gaps über Lüftung, h,x, Trinkwasser, MAG, Entwässerung.
