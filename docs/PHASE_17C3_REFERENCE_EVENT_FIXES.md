# Phase 17C.3 – Referenzmodule Event-/Saved-Record-Fix

## Ziel

Regenwasser und Schmutzwasser nutzen wieder ausschließlich die zentrale Plattform-Action-Pipeline für gespeicherte Einträge. Die in 17C.2 eingeführte direkte Pointer-Bindung wurde entfernt, weil sie bei wiederverwendeten Module-Roots stale Closures halten konnte und dadurch Auswahl, Accordion und Löschen blockierte.

## Änderungen

- `platform/moduleRuntime`
  - entfernt direkte SavedRecord-Pointer-Bindung
  - `saved:load`, `saved:toggle`, `saved:delete` laufen wieder über `data-tc-action`
  - Segment-Umschaltung nutzt weiterhin synchronen Scheduler-Flush
  - zusätzlich Microtask-Flush für schemaabhängige Umschalter wie Regenwasser `surfaceMode`

- `core/savedRecords`
  - bleibt zentrale Quelle für SavedRecord-Markup mit `data-tc-action`

## Betroffene Bugs

- Schmutzwasser: gespeicherte Einträge lassen sich wieder markieren und bearbeiten
- Schmutzwasser: Accordion und Löschen wieder aktiv
- Regenwasser: gespeicherte Einträge lassen sich wieder markieren und bearbeiten
- Regenwasser: Accordion und Löschen wieder aktiv
- Regenwasser: Berechnungsbereich Dachfläche/Grundstücksfläche triggert sofortigen Schema-Re-Render

## Regression

Neu:

- `tests/reference-modules-phase17c3-saved-and-switch.test.mjs`

Erweitert:

- `tests/reference-modules-phase17c2-reference-fixes.test.mjs`

`npm test` erfolgreich.
