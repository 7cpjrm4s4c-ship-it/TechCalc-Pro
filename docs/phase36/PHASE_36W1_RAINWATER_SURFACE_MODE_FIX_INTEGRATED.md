# Phase 36W.1 – Rainwater Surface-Mode Fix Integrated

## Basis
36V.3

## Problem
Der vorbereitete Fix für den Wechsel `Dachfläche ↔ Grundstücksfläche` war noch nicht im aktuellen Projektstand enthalten.

## Änderung
In `js/platform/dynamicRenderer/index.js` wurde `createRainwaterDynamicRenderer()` erweitert:

- `surfaceModeChanged` erkennt Wechsel über Cache und `meta.changed`.
- Das Formular-Island wird bei `surfaceModeChanged` neu gerendert.
- `surfaceMode` wird im `root.__tcRainwaterDynamic` Cache gespeichert.

## Geänderte Datei
- `js/platform/dynamicRenderer/index.js`

## Nicht geändert
- keine View-Struktur
- keine CSS-Regeln
- keine Saved-Record-Pfade
- keine Berechnungslogik
