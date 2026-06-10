# Phase 17C.6 – SavedRecord Root-Cause Fix

## Befund

Die Referenzmodule Regenwasser und Schmutzwasser enthielten keine alten modulnahen `data-saved-*`-Bindings mehr. Die verbliebene Störung lag in der Plattformschicht: ein zusätzlicher SavedRecord-Capture-Patch in `moduleRuntime` konkurrierte mit der zentralen `eventPipeline`. Da die zentrale Pipeline früher gebunden wird und Events per `stopImmediatePropagation()` beenden kann, war dieser Patch faktisch nicht belastbar.

## Umsetzung

- SavedRecord-Actions werden jetzt direkt in der zentralen `eventPipeline` als strukturelle Plattformaktionen aufgelöst.
- Die Pipeline greift für `saved:*` immer auf `root.__tcPlatformSavedRecordContext.handlers` des aktuell gemounteten Moduls zu.
- Der konkurrierende SavedRecord-Capture-Patch wurde aus `moduleRuntime` entfernt.
- Regenwasser und Schmutzwasser bleiben frei von eigenen SavedRecord-Attributen oder Sonderbindings.

## Erwartetes Verhalten

- Klick/Tap auf gespeicherte Einträge markiert und lädt den Eintrag.
- Accordion-Toggle funktioniert wieder über `saved:toggle`.
- Löschen funktioniert wieder über `saved:delete`.
- Aktualisieren wird nach aktivem geladenem Eintrag freigeschaltet.

## Regression

Neue Regression: `tests/reference-modules-phase17c6-saved-record-root-cause.test.mjs`.
