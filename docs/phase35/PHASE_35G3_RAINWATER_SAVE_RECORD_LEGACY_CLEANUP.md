# Phase 35G.3 – Regenwasser SaveRecord Legacy Cleanup

## Bereinigt
- `index.js`: `savedRecords` Import/Export entfernt.
- `results.js`: Legacy-`savedRecords()` Funktion entfernt.
- `controller.js`: Legacy-`savedRecords` Block entfernt.

## Verbleibender Speicherpfad
- `rainwaterSavedController`
- `createLineSectionController`
- `bindRainwaterPlatform(root)`

## Zulässiger Restmarker
- `logic.js` verwendet `activeSurfaceId` nur zur Ergebnis-Selektion. Das ist kein konkurrierender SaveRecord-Pfad.

Status: **Clean**

Keine konkurrierenden Legacy-SaveRecord-Reste gefunden.