# Phase 12G – Heizung/Kälte Globalisierung

Basis: Phase 12F.

Ziel dieser Phase ist die weitere Entkopplung von Eingabe-, Ergebnis- und Saved-Record-Bereichen. Das Modul bleibt nach dem Initial-Render gemountet; spätere Aktionen aktualisieren nur benannte dynamische Inseln.

## Umsetzung

- Saved-Selection bleibt store-first und hydratisiert den Modul-State.
- Save-/Update-Buttons werden dynamisch aktualisiert, ohne die Eingabe-Cards neu zu rendern.
- Segment-/Select-/Field-Aktionen laufen über die zentrale Event-Pipeline.
- Der Ergebnisbereich bleibt vom Eingabebereich entkoppelt.
- Mobile Touch- und Desktop-Click-Pfade nutzen denselben zentralen Commit-Pfad.

## Harte Regel

Kein Legacy-Patch und kein Full-Render nach normalen Interaktionen. Ein Full-Render ist nur beim Initial-Mount zulässig.
