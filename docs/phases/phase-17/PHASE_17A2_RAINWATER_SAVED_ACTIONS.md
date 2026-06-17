# Phase 17A.2 - Rainwater Saved Actions

Regenwasser wurde weiter vom Modul-Sonderpfad entkoppelt.

## Änderungen

- `createSavedRecordActions()` als zentrale Action-Fabrik im `savedRecordController` ergänzt.
- Regenwasser nutzt für Speichern, Aktualisieren, Laden, Löschen und Accordion jetzt `saved:add`, `saved:update`, `saved:load`, `saved:delete`, `saved:toggle`.
- Modulinterne Aktionsnamen wie `rainwater:surface-add` wurden entfernt.
- Regenwasser nutzt globale Saved-Record-Attribute `data-saved-load`, `data-saved-toggle`, `data-saved-delete`.
- Snapshot-/Hydration-Logik bleibt im Modul, die Ausführung liegt in der Plattform.

## Ziel

Regenwasser liefert Fachlogik und Mapping; Save-/Update-/Select-/Delete-/Accordion-Verhalten liegt in der Plattform.
