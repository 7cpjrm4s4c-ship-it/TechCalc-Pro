# Phase 11A - Plattformkern finalisieren

Phase 11A beendet den bisherigen Hybrid-Ansatz schrittweise. Module sollen nicht mehr direkt DOM-Zustände als Wahrheit nutzen, sondern über einen zentralen Datenfluss laufen.

## Eingezogen

- `js/core/centralStore.js`
  - zentraler Store mit Revisionen, Action-Metadaten und Modulregistrierung
  - `getAppStateSnapshot()` als Grundlage für spätere App-Health-/Debug-Auswertung

- `js/core/eventPipeline.js`
  - ein zentraler Eventpfad für `input`, `change`, `blur`, `Enter`, Segment-Switches und Surface-Confirm
  - Selects werden sofort committet, damit Stammdaten wie Medium und Rohrmaterial unmittelbar in die Berechnung laufen
  - Inputs berechnen bei `blur` oder `Enter`, ohne Speichern zu erzwingen

- `js/core/state.js`
  - `createModuleState()` basiert jetzt auf dem zentralen Store

- `js/core/renderer.js`
  - `bindCommonInputs()` delegiert an die zentrale Event-Pipeline

## Architekturregel ab Phase 11A

Ein Modul darf fachliche Berechnung, Stammdaten und Result-Mapping liefern. Eingabe-, Change-, Blur-, Enter- und Segment-Handling gehören nicht mehr in Module.

## Noch offen für 11B

- modulinterne Event-Adapter aus Heizung/Kälte, Trinkwasser, Regenwasser usw. entfernen
- Saved-Record-Auswahl vollständig über eine zentrale Selection-Pipeline führen
- Renderbereiche granularisieren, damit nicht jeder State-Wechsel das gesamte Modul neu rendert
