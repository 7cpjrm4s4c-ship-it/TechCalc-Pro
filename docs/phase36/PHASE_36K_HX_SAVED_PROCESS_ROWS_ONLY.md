# Phase 36K – h,x Saved-Process Rows-only Update

## Problem
Im h,x-Diagramm trat noch ein Scrollsprung auf:
- bei erster Markierung eines gespeicherten Prozesses
- beim Löschen eines gespeicherten Prozesses

## Fix
Die äußere Saved-Process-Card bleibt gemountet.
Bei saved-structural Actions wird nur noch die innere Row-Liste aktualisiert:

```js
hxProcessController.renderRows(snapshot)
```

Zusätzlich bleiben die Controls über `syncSavedProcessControls()` synchron.

## Erwartung
- keine Scrollsprünge bei erster Markierung
- keine Scrollsprünge beim Löschen
- globaler `lineSectionController` bleibt unangetastet
