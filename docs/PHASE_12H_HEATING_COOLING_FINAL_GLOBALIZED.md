# Phase 12H – Heizung/Kälte final globalisiert

Dieser Stand finalisiert Heizung/Kälte als Referenzmodul für die restliche Modulmigration.

## Abschlusskriterien

- Initialer Mount darf das Modul vollständig rendern.
- Nach dem Initial-Mount laufen Änderungen über dynamische Render-Inseln.
- `mode`, `calcTarget`, Medium, Rohrsystem und Einheiten werden über den zentralen Store geführt.
- Saved Entries laden ihren Zustand in den Store und bauen die Eingabe-Cards nicht neu auf.
- Ergebnis- und Rohrbereiche sind vom Eingabebereich entkoppelt.
- Mobile und Desktop nutzen dieselbe Event-Pipeline.

## Verbleibende globale Aufgabe

Der Modulstandard ist damit anhand Heizung/Kälte belastbar. Die übrigen Module werden nun nicht mehr gepatcht, sondern nach demselben Muster neu migriert.
