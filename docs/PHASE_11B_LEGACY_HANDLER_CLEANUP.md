# Phase 11B – Legacy Handler Cleanup

Ziel dieser Phase ist die Entkopplung der neuen Plattformlogik von alten Modul-Handlern.

## Umgesetzt

- `bindSavedCalculationActions` verwendet jetzt Root-Delegation statt Button-spezifischer Listener pro Render.
- Saved-Calculation-Aktionen laufen damit über einen stabilen zentralen Handler pro Modul-Root.
- Neues `platformLifecycle`-Hilfsmodul für künftige `bindOnce`-Migrationen.
- Neues Audit `audit-legacy-event-handlers.mjs` zeigt verbliebene modulinterne Event-Handler transparent an.

## Wichtig

Phase 11B entfernt noch nicht jeden Modul-Handler hart. Das wäre aktuell riskant, weil einige Module fachliche Sub-Collections besitzen. Stattdessen wird die Konfliktfläche reduziert und sichtbar gemacht.

Nächster Schritt ist Phase 11C:

- zentrale State-Adapter für Lookup-Felder wie Medium, Rohrmaterial und Stammdaten
- zentrale Segment-/Switch-Definitionen
- zentrale Save-/Load-Controller für alle Record-Typen, nicht nur `savedCalculations`
