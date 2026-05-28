# Phase 12I – Heizung/Kälte Final Stabilization

Basis: Phase 12H. Diese Phase enthält ausschließlich die dokumentierten Restfehler-Fixes ohne weitere Architekturänderungen.

## Behoben

- m³/h-Eingaben bleiben als Anzeige-/UI-Wert stabil. Beispiel: `25` m³/h bleibt `25` und wird intern erst für die Berechnung in kg/h konvertiert.
- Gespeicherte Leitungsabschnitte werden bei mobilen Touch-/Click-Doppelereignissen nicht mehr doppelt angelegt.
- Der Auf-/Zuklappzustand gespeicherter Einträge wird im Store geführt und über den zentralen Saved-Record-Renderer wiederhergestellt.

## Technische Umsetzung

- `formatMassFlowInput()` formatiert den gespeicherten UI-Wert und führt keine zweite m³/h → kg/h → m³/h Umrechnung aus.
- `activeCalculationState()` bleibt die einzige Stelle, die m³/h für die Berechnung nach kg/h normalisiert.
- `buildLineSectionRecord()` speichert Raw-Input-State und separaten Calculation-State.
- `eventPipeline` dedupliziert Pointer-/Touch-Actions bereits vor der Action-Ausführung.
- `renderSavedRecordList()` unterstützt `expandedId`, damit Accordion-Zustände store-first bleiben.
