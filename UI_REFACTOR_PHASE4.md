# TechCalc Pro — UI Refactoring Phase 4

## Ziel
Phase 4 reduziert weitere Legacy-Sonderregeln im Markup und macht die `tcp-*` Klassen zur verbindlichen UX/UI-Sprache für neue und bestehende Module.

## Umgesetzt

### 1. Zentrale UI-Vertragsklassen ergänzt
Neue zentrale Klassen in `style.css`:

- `.tcp-card--compact`
- `.tcp-card--flush`
- `.tcp-card--spaced`
- `.tcp-card--spaced-sm`
- `.tcp-input-group--compact`
- `.tcp-input-group--spaced`
- `.tcp-result-card`
- `.tcp-result-grid`

Damit werden wiederkehrende Inline-Styles schrittweise durch semantische Klassen ersetzt.

### 2. Markup weiter normalisiert
In `index.html` wurden mehrere wiederkehrende Inline-Styles entfernt und durch zentrale Klassen ersetzt:

- `padding:14px 16px` → `.tcp-card--compact`
- `padding:0;overflow:hidden` → `.tcp-card--flush`
- `margin-bottom:0` bei Eingabegruppen → `.tcp-input-group--compact`
- `margin-top:var(--gap)` → `.tcp-input-group--spaced` / `.tcp-card--spaced`
- Ergebniscontainer erhalten `.tcp-result-card`

### 3. MAG und Entwässerung stärker an zentrale Card-Sprache angebunden
Spezialkarten wie `gc-mag`, `gc-ew`, `ew-total-card` und Ergebnisbereiche sind nun zusätzlich an `.tcp-card` beziehungsweise `.tcp-result-card` gekoppelt.

### 4. Desktop/Mobile-Verhalten abgesichert
Die zentrale Layout-Schicht erzwingt für `.tcp-layout` und `.tcp-col` konsistente Breiten, Spaltenabstände, Stapelabstände und Mobile-Flex-Verhalten.

## Ergebnis
Neue Module sollen ab jetzt nur noch diese Struktur verwenden:

```html
<div class="tab-panel tcp-module tcp-module--...">
  <div class="tab-inner tcp-layout">
    <div class="tcp-col tcp-col--left">
      <div class="tcp-card">...</div>
    </div>
    <div class="tcp-col tcp-col--right">
      <div class="tcp-card tcp-result-card">...</div>
    </div>
  </div>
</div>
```

Modulspezifische Anpassungen dürfen nur noch über `--module-accent` oder klar begründete Fachkomponenten erfolgen.

## Noch offen für Phase 5

- Restliche Inline-Styles in `index.html` weiter reduzieren.
- `layout.css` endgültig auf PDF-Verwendung beschneiden.
- Alte Klassen wie `.gc-h`, `.gc-c`, `.gc-mag`, `.gc-ew` fachlich prüfen und entweder mappen oder entfernen.
- `styles.css` und `components.css` auf reine Legacy-/Fachkomponenten reduzieren.
