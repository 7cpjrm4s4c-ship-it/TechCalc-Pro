# Phase 35D – Saved Dialog Parity

## Ziel

Die Speicherdialoge von Druckhaltung, Schmutzwasser und Regenwasser werden nicht mehr als Sonderfälle behandelt. Sie verwenden denselben Line-Section/Saved-Record-Workflow wie die stabilen Referenzmodule Rohr und Pufferspeicher.

## Änderungen

- Druckhaltung auf `createLineSectionController` umgestellt.
- Schmutzwasser-Saved-Record-Handling vom generischen Runtime-Handler entkoppelt und an den Line-Section-Controller gebunden.
- Regenwasser-Saved-Record-Handling vom generischen Runtime-Handler entkoppelt und an den Line-Section-Controller gebunden.
- Plattform-Runtime erlaubt nun einen zusätzlichen Modul-Bind-Hook auch für schema-basierte Plattformmodule.
- `createLineSectionController` unterstützt optionale `subtitle`, `afterCreatePatch` und `afterUpdatePatch` Hooks.
- Regenwasser behält nach dem Speichern das gewünschte Reset-Verhalten des Flächeneditors bei.
- Schmutzwasser- und Regenwasser-Speicherbuttons verwenden weiterhin den sichtbaren zentralen Saved-Record-Panel-Renderer, aber die Aktionen laufen über denselben Controllerpfad wie Rohr/Puffer.

## Verifikation

- `npm run build` OK
- `npm run audit:css` OK
- `npm run test:phase35d` OK
- `npm test` OK

## Retest-Priorität

Manuell prüfen:

1. Druckhaltung: Anlage speichern, auswählen, aktualisieren, löschen.
2. Schmutzwasser: Berechnung speichern, auswählen, aktualisieren, löschen; Gegenstand hinzufügen.
3. Regenwasser: Fläche speichern, auswählen, aktualisieren, löschen.
4. Mobile: erster Tap auf Speichern/Auswählen darf nicht wirkungslos sein.
