# Phase 36T.3 – Rainwater Zero CSS Exceptions

## Ziel
Regenwasser soll denselben CSS-Status wie die Referenzmodule erreichen: keine eigenen Layout-Ausnahmen in `modules.css` oder `components.css`.

## Umsetzung
- Restliche Rainwater-Selector-/Kommentarspuren in `css/modules.css` entfernt.
- Sicherheitsbereinigung für `[data-rw-dynamic...]` in `css/components.css`.
- Prüfung auf `.rainwater-*`, `[data-rw-dynamic]` und `data-module='rainwater'` in CSS.
- Regenwasser-JS auf verbliebene `rainwater-*` Markup-Klassen geprüft und bereinigt, falls vorhanden.

## Ergebnis
Regenwasser nutzt nur noch globale Plattform-Primitive:
- `renderModuleShell`
- `span-6`
- `stack()`
- `card()`
- `renderResultModel`
- `lineSectionController.renderCard`

## Nicht geändert
- Keine Berechnungslogik
- Keine Saved-Record-Pfade
- Keine State-Struktur
