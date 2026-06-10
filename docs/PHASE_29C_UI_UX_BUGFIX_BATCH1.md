# Phase 29C - UI/UX Bugfix Batch 1

## Ziel

Phase 29C schliesst die P1-Findings aus der UI/UX-Modulpruefung 29B.

Betroffene Risikoflaechen:

- h,x Diagramm: Scroll-Stabilitaet bei Saved Processes
- Regenwasser: Fokus-/Scroll-Stabilitaet, Saved Records, Live Rendering
- Entwaesserung: Fokus-/Scroll-Stabilitaet, Saved Records, Live Rendering

## Umsetzung

### Platform Saved Records

Die generischen Saved-Record-Aktionen in `js/platform/moduleRuntime/index.js` laufen nun fuer Save, Update, Load, Deselect, Delete und Toggle ueber `preserveSavedRecordMutation()`.

### Dynamic Rendering

Schema-basierte Dynamic Islands und Segment-Re-Renders laufen ueber `preservePlatformUx()`.

Der Wrapper kombiniert:

- `PlatformScrollManager.runWithoutScrollJump()`
- `PlatformFocusManager.preserveFocusDuring()`

Dadurch bleiben Viewport, aktives Feld und Caret ueber Re-Renders erhalten.

### Line Section Controller

`js/platform/lineSectionController/index.js` schuetzt Persist-, Load-, Deselect- und Toggle-Pfade ebenfalls ueber Scroll-/Focus-Manager. Davon profitiert insbesondere das h,x-Modul mit seinen gespeicherten Prozessen.

## Ergebnis

- P0: keine
- P1 offen: keine
- Score: 5.00 / 5
- Grade: A

Naechster Schritt: Phase 29D - P2 Cleanup.
