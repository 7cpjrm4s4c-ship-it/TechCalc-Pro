# Phase 36W.2H – Rainwater Active Draft Precedence

## Problem
Der Dacheinlauf-Select wurde auch nach direktem Commit nicht in Anzeige und Berechnung wirksam.

## Ursache
In `calculate()` wurde bei gesetztem `activeSurfaceId` immer zuerst der gespeicherte Surface-Datensatz aus `persistedSurfaces` verwendet:

```js
const selectedSurface = state.activeSurfaceId
  ? persistedSurfaces.find(...)
  : draftSurface
```

Damit wurden Live-Änderungen im Editor-State ignoriert, solange eine gespeicherte Fläche aktiv markiert war. Der geänderte `drainSize` lag im Draft, die Berechnung las aber den alten gespeicherten Datensatz.

## Fix
Der aktuelle Draft erhält Vorrang:

```js
const selectedSurface = draftSurface
  || active persisted surface
  || last persisted surface
  || null;
```

## Erwartung
Live-Änderungen an:

- Dacheinlauf / Hoftopf
- Abflusswert
- Anstauhöhe

wirken sofort in Berechnung und Ergebnisanzeige, auch wenn eine gespeicherte Fläche aktiv markiert ist.
