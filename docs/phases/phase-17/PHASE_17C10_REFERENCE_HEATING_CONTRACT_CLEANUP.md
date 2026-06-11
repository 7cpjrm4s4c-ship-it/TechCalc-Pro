# Phase 17C.10 - Referenzmodule auf Heizung/Kälte-Vertrag bereinigt

## Ziel

Regenwasser und Schmutzwasser verwenden fuer gespeicherte Eintraege exakt den stabilen Interaktionsvertrag aus Heizung/Kaelte:

- `line:save`
- `line:update`
- `saved:load`
- `saved:toggle`
- `saved:delete`
- `data-line-save`
- `data-line-update`
- `data-line-select`
- `data-line-toggle`
- `data-line-delete`

Der bisherige parallele Plattformpfad mit eigenen SavedRecord-Capture-/Bridge-Konzepten wurde entfernt, damit Speichern, Markieren, Bearbeiten, Accordion und Loeschen nicht mehr durch konkurrierende Eventpfade blockiert werden.

## Aenderungen

- `platform/moduleRuntime` registriert Saved Records wieder als zentrale Action-Map wie Heizung/Kälte.
- `line:save` und `line:update` sind jetzt die einzigen Save-/Update-Actions fuer Plattform-SavedRecord-Panels.
- `saved:add` und `saved:update` wurden aus Regenwasser/Schmutzwasser entfernt.
- die alte SavedRecord-Kontext-/Bridge-Aufloesung im Event-Pipeline-Pfad wurde entfernt.
- das SavedRecord-Panel rendert Save-/Update-Buttons mit `data-line-save` und `data-line-update`.
- die alte zusaetzliche Segment-Capture-Logik wurde deaktiviert; der zentrale Event-Pipeline-Pfad steuert Segment-Switches.

## Switch Regenwasser

Der Berechnungsbereich-Switch verwendet weiterhin den Plattform-Segment-Handler, aber ohne konkurrierende Capture-Schicht. Nach dem State-Commit wird der Render-Scheduler sofort geflusht und der bestehende DOM-Patch fuer die Regenspende-Felder ausgefuehrt.

## Regression

- `npm test` erfolgreich.
- bestehende SavedRecord- und Referenzmodul-Regressionen wurden auf den Heizung/Kälte-Vertrag angepasst.
