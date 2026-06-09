# TechCalc Pro 1.3.0 - Phase 26B.2

## h,x-Diagramm

- Saved-Record-Dialog auf Plattform-Line-Section-Controller migriert.
- `savedProcesses` und `expandedProcessId` eingeführt.
- Legacy-Feld `processes` bleibt für Restore alter Projekte kompatibel.
- Alte `data-hx-select-process` / `data-hx-remove-process` Listenlogik entfernt.
- Speichern, Aktualisieren, Laden, Löschen und Aufklappen laufen über zentrale Saved-Record-Actions.
- Neuer Regressionstest `test:hx-diagram-phase26b2` ergänzt.
