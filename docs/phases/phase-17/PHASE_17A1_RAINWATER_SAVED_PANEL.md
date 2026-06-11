# Phase 17A.1 – Regenwasser Saved-Panel Decoupling

Regenwasser rendert den Speicherbereich nicht mehr mit lokalem Card-/Button-Markup.

## Verschoben in die Plattform

- `renderSavedRecordPanel()` in `js/core/savedRecords.js`
- einheitlicher Name-Input
- einheitliche Save-/Update-Actions
- einheitlicher Saved-Record-Listencontainer

## Regenwasser liefert nur noch

- Titel des Panels
- Feld-ID und Wert fuer die Bezeichnung
- Actions fuer Save/Update
- gerenderte Liste aus dem globalen Saved-Record-Renderer

Damit wird die Speicher-UX weiter an Heizung/Kälte und Lüftung angeglichen und Modul-Markup reduziert.
