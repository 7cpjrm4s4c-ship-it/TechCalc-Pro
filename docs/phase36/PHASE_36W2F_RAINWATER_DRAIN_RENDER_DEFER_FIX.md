# Phase 36W.2F – Rainwater Drain Render-Defer Fix

## Problem
Nach 36W.2D funktionierten Notentwässerung und Regenfläche korrekt, der Dacheinlauf aber weiterhin nicht.

## Ursache
Der Dacheinlauf-Select war der einzige der drei Lookup-Selects mit `render:'defer'`.

## Fix
In `js/modules/rainwater/schema.js` wurde bei `drainSize` entfernt:

```js
render:'defer'
```

Der Dacheinlauf folgt damit demselben Live-Render-Pfad wie `emergencyType` und `areaType`.

## Erwartetes Verhalten
Beim Wechsel von DN 50, DN 70, DN 100, DN 150 aktualisieren sich unmittelbar:

- DN manuell
- Abflusswert
- Anstauhöhe
- Ergebnis-/Hydraulikwerte
