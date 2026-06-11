# Phase 31A.1 – menuFallback Runtime Review

## Entscheidung

`js/core/menuFallback.js` wurde entfernt.

## Begründung

Die Datei war ein historischer IIFE-Fallback für das Einstellungsmenü. Sie wurde weder in `index.html` geladen noch von der modularen App importiert. Die produktive Menülogik befindet sich vollständig in `js/core/app.js`.

## Prüfung

Geprüfte Runtime-Anker:

- `#settingsButton`
- `#settingsPanel`
- `#closeSettings`

Diese werden weiterhin aktiv durch `js/core/app.js` verwaltet.

## Release-Risiko

Niedrig. Die entfernte Datei war nicht Teil der aktiven Runtime.

## Folgeaktion

Die Runtime-Review-Kandidatenlisten in den Cleanup-/Baseline-Audits wurden bereinigt, damit `menuFallback.js` nicht erneut als bewusst behaltene Runtime-Datei geführt wird.
