# Phase 45C.2 – Legacy Saved Records Migration

## Analyse

Nach 45C.1 wurden Legacy-Eingabewerte aus dem früheren kombinierten WRG/Mischluft-Modul korrekt in das neue Modul `mixed-air` übernommen. In der Praxis zeigte sich jedoch, dass gespeicherte Legacy-Datensätze weiterhin in der WRG-Liste erscheinen konnten, wenn der alte Datensatz keinen belastbaren Modus-Label enthielt.

## Design Review

Referenz bleibt der Splitting-Contract: WRG-Records verbleiben in `heat-recovery`, Mischluft-Records werden in `mixed-air` übernommen. Für Legacy-Datensätze ist nicht nur das Feld `mode`, sondern auch die fachliche Feldstruktur entscheidend.

## Implementierung

Die Legacy-Erkennung wurde erweitert:

- `mode: Mischluft`, `mode: mixing` und `mode: mix` bleiben gültige Erkennungsmerkmale.
- Zusätzlich werden Mischluft-Felder wie `mixingOutdoor*` und `mixingRecirc*` in `inputState`, `state` oder direkt im Record als stabiler Discriminator genutzt.
- WRG-Records ohne Mischluft-Felder verbleiben in `savedRltDevices`.
- Mischluft-Records werden nach `savedMixedAirStates` migriert.

## Regression

Ergänzt wurde ein Test für Legacy-Saved-Records ohne Modus-Label:

- alte WRG/Mischluft-Projektstruktur laden,
- Mischluft-Inputs nach `mixed-air` übernehmen,
- Mischluft-Saved-Record aus WRG entfernen,
- WRG-Saved-Record beibehalten,
- anschließende Serialisierung getrennt prüfen.

## Ergebnis

45C.2 schließt die Projektlebenszyklus-Migration für gespeicherte Legacy-Einträge ab. Der Split trennt jetzt aktive Eingaben und gespeicherte Records konsistent.
