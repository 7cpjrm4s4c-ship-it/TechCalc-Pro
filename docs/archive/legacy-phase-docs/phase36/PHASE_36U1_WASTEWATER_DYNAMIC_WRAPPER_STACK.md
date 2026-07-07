# Phase 36U.1 – Wastewater Dynamic Wrapper Stack

## Ziel
Die erfolgreiche Regenwasser-Korrektur aus 36T.6 wird auf Schmutzwasser übertragen.

## Problem
Schmutzwasser nutzt mehrere dynamische Wrapper:

- `data-ww-dynamic="usage"`
- `data-ww-dynamic="line-fields"`
- `data-ww-dynamic="fixture-inputs"`
- `data-ww-dynamic="fixtures"`
- `data-ww-dynamic="additional-flows"`
- `data-ww-dynamic="result"`

Diese Wrapper enthalten generierte Layout-Fragmente, waren selbst aber keine Stack-Container. Dadurch konnte der globale Abstand innerhalb dynamisch gerenderter Bereiche inkonsistent wirken.

## Fix
Alle genannten Dynamic-Wrapper verwenden jetzt globale Plattform-Primitive:

```html
<div class="tc-stack" data-ww-dynamic="...">...</div>
```

## Wichtig
- Keine neuen CSS-Sonderregeln
- Keine Berechnungslogik geändert
- Keine Saved-Record-Pfade geändert
- Keine Collection-Action-Verträge geändert

## Hinweis
Bestehende `wastewater-*` CSS-Ausnahmen bleiben in 36U.1 bewusst unverändert. Diese werden in der folgenden Phase 36U.2 separat auditiert und schrittweise entfernt.
