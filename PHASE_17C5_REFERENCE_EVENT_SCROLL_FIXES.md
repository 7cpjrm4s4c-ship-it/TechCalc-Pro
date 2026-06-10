# Phase 17C.5 – Reference Event + Scroll Boundary Fixes

## Ziel

Die wiederkehrenden Fehler in Regenwasser und Schmutzwasser wurden nicht mehr als Modulfehler behandelt, sondern als Plattformfehler:

- gespeicherte Einträge konnten nicht geladen/markiert werden
- Accordion und Löschen liefen nach Navigation/Rerender nicht zuverlässig
- Segment-Switches konnten mit veralteter Modulbindung arbeiten
- nach strukturellen Rerendern konnte der Viewport unter das Modulende laufen

## Ursache

Die Plattform bindet Capture-Listener einmalig auf dem wiederverwendeten App-Root. Diese Listener hatten teilweise Closures auf das zuerst gemountete Modul. Nach Wechsel zwischen Referenzmodulen konnten SavedRecord- und Segment-Aktionen deshalb gegen veraltete Handler/States laufen.

## Umsetzung

### moduleRuntime

- `root.__tcPlatformSavedRecordContext` speichert immer die aktuellen SavedRecord-Handler und den aktuellen State.
- der einmalige Capture-Listener liest diesen Context pro Event neu aus.
- `root.__tcPlatformSegmentContext` speichert die aktuelle Segment-Commit-Funktion.
- Segment-Capture nutzt ebenfalls den aktuellen Context statt veralteter Closures.

### renderCoordinator

- neuer zentraler Scroll-Clamp nach DOM-Replacement.
- strukturelle Rerender werden nachträglich auf das reale Dokumentende begrenzt.
- Clamping läuft stabil über Frame/Timeout, damit mobile Browser nach Layout-Änderungen nicht unter den letzten Modulinhalt scrollen.

## Regression

Neu:

- `tests/reference-modules-phase17c5-event-scroll.test.mjs`

Abgesichert wird:

- SavedRecord-Capture nutzt aktuellen Modul-Context
- Segment-Capture nutzt aktuellen Modul-Context
- Renderer clamppt Viewport nach strukturellem Rerender

## Ergebnis

Regenwasser und Schmutzwasser behalten ihre entkernte Referenzstruktur. Die Fixes liegen zentral in der Plattform und gelten damit auch für alle weiteren zu migrierenden Module.
