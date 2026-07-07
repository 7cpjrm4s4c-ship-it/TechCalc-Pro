# Keyboard Contract

Status: verbindlich ab Phase 42E.1/42E.2

## Ziel

Tab-, Shift+Tab-, Enter- und Shift+Enter-Navigation werden zentral gesteuert. Kein Modul darf eine eigene Tastatur-Navigationslogik etablieren.

## Single Source of Truth

- `js/core/eventPipeline.js`
- `js/core/focusManager.js`

## Regeln

1. Module registrieren Eingabefelder und interaktive Elemente ueber DOM-Vertraege, nicht ueber eigene Keyboard-Handler.
2. `keydown`, `keypress`, `keyup` fuer Formularnavigation sind ausserhalb des zentralen Vertrags nicht zulaessig.
3. Enter committed Feldwerte und navigiert zum naechsten Element.
4. Shift+Enter navigiert zum vorherigen Element.
5. Tab und Shift+Tab folgen dem zentralen Focus-Graph.
6. Speichern-/Aktualisieren-Controls, Saved-Cards, Segment Controls und Collection-Inputs sind Teil des zentralen Focus-Graph.
7. Collection-Inputs werden zentral ueber die Event-Pipeline committed.

## Ausnahmen

Ausnahmen muessen dokumentiert und durch einen Audit abgesichert werden. Eine Ausnahme darf keine parallele Tab-/Enter-Reihenfolge erzeugen.
