# Phase 36U.2C – Wastewater Legacy Class Cleanup

## Ziel
Schmutzwasser soll stärker auf globale Plattform-Primitive zurückgeführt werden.

## Markup geändert
In `js/modules/wastewater/view.js` wurden Legacy-Klassen entfernt:

- `wastewater-fixtures`
- `wastewater-fixture-row`
- `wastewater-fixture-row--editable`

Die Fixture-Liste nutzt jetzt nur noch globale Klassen:

```html
tc-consumer-list
tc-consumer-row
tc-collection-row
tc-consumer-row--editable
tc-collection-row__content
tc-quantity-field
mini-button
```

## CSS bereinigt
Entfernt wurden Legacy-Regeln für:

- `wastewater-fixture*`
- `wastewater-compact*`
- `wastewater-line-hints`
- doppelte Quantity-/Mini-Edit-Feldregeln für Drinking-Water/Wastewater

Der editable Collection-Row-Contract wurde in `components.css` als globale Plattformregel abgesichert.

## Nicht geändert
- Keine Berechnungslogik
- Keine Collection-Action-Verträge
- Keine Saved-Record-Pfade
- Keine Result-Renderer-Logik

## Folgephase
36U.2D sollte die verbleibenden echten Schmutzwasser-Ausnahmen prüfen:
- `wastewater-subselect`
- `wastewater-line-selector`
- `data-ww-dynamic`
- `module-view[data-module='wastewater']`
