# Phase 13A – Ventilation Globalisierung

Basis: Phase 12L mit Heizung/Kälte als Referenzmodul.

## Ziel

Das Modul Lüftung/Ventilation wird nach dem Heizung/Kälte-Standard migriert:

- Store-first State für gespeicherte Leitungsabschnitte
- zentrale Event-Pipeline für Segment, Save, Update, Select, Delete und Toggle
- keine lokalen Click-/Touch-Handler im Modul
- statisches Layout bleibt gemountet
- nur dynamische Inseln werden aktualisiert
- Saved-Selection und Accordion-State bleiben getrennt
- Save/Update-Aktionen werden mobil gegen Doppeltrigger entprellt

## Dynamische Inseln

- `data-vent-dynamic="mode-segment"`
- `data-vent-dynamic="target-segment"`
- `data-vent-dynamic="input-fields"`
- `data-vent-dynamic="result"`
- `data-vent-dynamic="air-stats"`
- `data-vent-dynamic="formula"`
- `data-vent-dynamic="line-sections"`

## Abschlusskriterien

- Eingaben triggern keine Full-Card-Rebuilds.
- Segment-Switches reagieren direkt über die Pipeline.
- Gespeicherte Einträge laden nur den Datensatz.
- Details öffnen/schließen nur über den Pfeil.
- Speichern erzeugt mobil keine doppelten Einträge.
