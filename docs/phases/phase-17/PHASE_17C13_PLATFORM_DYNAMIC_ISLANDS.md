# Phase 17C.13 — Platform Dynamic Islands

## Ziel

Der Berechnungsbereich-Switch im Regenwasser-Modul darf keine modulinterne DOM-Sonderlogik verwenden. Schema-abhängige Labels, Sichtbarkeiten und Resultate werden zentral durch die Plattform aktualisiert.

## Umsetzung

- `moduleRenderer` kapselt Formular und Ergebnis/Speichern als zentrale Dynamic Islands:
  - `data-platform-dynamic="form"`
  - `data-platform-dynamic="result-saved"`
- `moduleRuntime` besitzt `updateDynamicIslands()`.
- Segment-Commits lösen unmittelbar nach `state.set()` einen zentralen Island-Rebuild aus.
- Regenwasser bleibt frei von `domPatch`, `querySelector` und Label-Patching.

## Wirkung

Der Switch `Dachfläche` / `Grundstücksfläche` nutzt denselben Grundmechanismus wie Heizung/Kälte: State zuerst, danach gezielter dynamischer UI-Rebuild. Dadurch werden `Regenspende r(5,5)` und `Regenspende r(5,2)` ohne weitere Eingabe aktualisiert.
