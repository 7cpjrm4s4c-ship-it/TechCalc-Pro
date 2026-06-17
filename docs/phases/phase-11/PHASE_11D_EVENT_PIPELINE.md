# Phase 11D – Zentrale Event-Pipeline

Phase 11D reduziert den Hybrid-Zustand zwischen alter Modul-Logik und neuer Plattform-Logik weiter. Der zentrale Eventpfad ist jetzt die primäre Schreibstrecke fuer Eingaben, Selects, Switches und zentrale Aktionen.

## Ziel

- Ein Datenfluss fuer UI-Aktionen.
- Selects und Stammdaten-Auswahlen committen sofort.
- `blur` und `Enter` starten Berechnung ohne Surface-Klick.
- Segment-/Switch-Controls laufen ueber `segment:select`.
- Saved-Record-Elemente tragen zentrale Action-Marker.
- Der alte `stateBinding`-Fallback deaktiviert sich, sobald die zentrale Pipeline aktiv ist.

## Geaenderte Kernbereiche

- `js/core/eventPipeline.js`
  - zentrale Value-Ermittlung fuer Input, Select, Checkbox und Radio
  - `registerCentralActions()` vorbereitet
  - `tc:commit` Lifecycle-Event
  - sofortiges Rendern bei `blur` und `Enter`
  - zentrale Segment-Action

- `js/core/stateBinding.js`
  - Fallback bleibt erhalten
  - steht zurueck, wenn `bindCentralEventPipeline()` aktiv ist

- `js/core/renderer.js`
  - Segmentbuttons tragen `data-tc-action="segment"`

- `js/core/savedRecords.js`
  - Saved Load/Toggle/Delete tragen zentrale `data-tc-action` Marker

## Wichtige Regel

Module sollen keine parallelen Eventpfade mehr aufbauen. Fachliche Sonderlogik darf nur noch als Adapter an zentrale Aktionen angeschlossen werden. Ziel fuer Phase 11E ist, die verbliebenen Moduladapter in zentrale Action-Handler zu ueberfuehren.
