# Phase 36A.2 – Schmutzwasser Controller/View/ViewModel Migration

## Ziel
Schmutzwasser wurde vom alten `results + savedRecords` Renderpfad auf das Controller/View/ViewModel-Muster der Referenzmodule umgestellt.

## Änderungen
- `view.js` neu erstellt.
- `viewModel.js` neu erstellt.
- `index.js` verwendet jetzt `view`, `bind`, `dynamicUpdate` und `isDynamicAction`.
- `results.savedRecords()` entfernt.
- `wastewaterSavedController` bleibt Single Source of Truth für gespeicherte Berechnungen.
- Collection-Actions für Entwässerungsgegenstände werden im Custom-Bind-Pfad registriert.

## Erwarteter Effekt
- Kein konkurrierender Saved-Record-Renderer mehr.
- Speichern, Auswahl und Accordion laufen über `createLineSectionController`.
- Gegenstand hinzufügen bleibt über den zentralen Collection-Handler funktionsfähig.
