# Phase 17C.7 – SavedRecord Root Cause / Heizung-Kälte Parität

## Befund

Regenwasser und Schmutzwasser enthielten keine alten modulnahen SavedRecord-Patches mehr. Die alte Sonderlogik lag nicht in den beiden Modulen, sondern im neuen Plattformpfad: gespeicherte Einträge wurden ausschließlich über die generische `data-tc-action`-Delegation behandelt. Bei verschachtelten SavedRecord-Karten konnte dadurch die Card-Aktion `saved:load` mit den Button-Aktionen `saved:toggle` und `saved:delete` konkurrieren.

Heizung/Kälte funktioniert stabil, weil dort die drei SavedRecord-Strukturaktionen explizit und direkt gebunden sind:

- `saved:load`
- `saved:toggle`
- `saved:delete`

## Fix

Die Plattform hat nun denselben stabilen Vertrag, aber zentral:

- `platform/moduleRuntime` erstellt pro aktivem Modul eine aktuelle `SavedRecordEventBridge`.
- `core/eventPipeline` gibt `saved:load`, `saved:toggle` und `saved:delete` zuerst an diese Bridge.
- Die Bridge verhindert, dass ein Klick auf Toggle/Delete als Card-Load interpretiert wird.
- iOS Pointer-/Touch-/Click-Duplikate werden zentral dedupliziert.

## Architekturentscheidung

Keine Rückkehr zu Modul-Sonderregeln. Regenwasser und Schmutzwasser bleiben patchfrei; die Stabilisierung liegt ausschließlich in Plattform und Pipeline.
