# Phase 42E.1 – Central Keyboard Navigation Contract

## Basis

- Ausgangsbasis: `techcalc-pro-1.3.2-dev.36-phase42d-reference-contract-migration`
- Ziel: zentrale Desktop-Keyboard-Navigation ohne modulinterne Sonderlogik als primären Navigationspfad.

## Entscheidung

Die zentrale Focus-Engine bleibt die Quelle der Wahrheit. Module dürfen keine eigene Tab-/Enter-Navigation etablieren. Lokale Handler dürfen nur fachliche Werte committen, müssen danach aber in den zentralen Focus-Graph zurückführen.

## Vertrag

- `Tab` navigiert zum nächsten Element des zentralen Focus-Graphen.
- `Shift+Tab` navigiert zum vorherigen Element des zentralen Focus-Graphen.
- `Enter` auf Eingabefeldern übernimmt den Wert und navigiert weiter.
- `Shift+Enter` auf Eingabefeldern navigiert rückwärts.
- Save-/Update-Buttons, Segment Controls, Saved Cards und explizite `data-platform-focus`-Elemente gehören zum Focus-Graphen.
- Der Focus-Graph wrappt innerhalb des Modulkontexts, damit kein Dead-End im Speichern-Panel entsteht.

## Technische Umsetzung

- `focusManager.js` erweitert den zentralen Keyboard-Focus-Graphen.
- `eventPipeline.js` akzeptiert neben Inputs/Selects/Textareas auch zentrale Action-/Segment-/Saved-Controls für Tab-Navigation.
- Collection-Commit-Handler in `formActions.js`, `platform/moduleRuntime/index.js` und `wastewater/controller.js` führen nach Enter-Commit zurück in die zentrale Navigation.
- Es wurden keine neuen CSS-Hotfix-Dateien angelegt.

## Regression

Geprüfte Gates:

- Fast-Gate: grün
- Integration-Gate: grün
- Build/Syntax: grün

## Offene Folgephase

Phase 42E.2 soll verbliebene lokale Keyboard-Handler inventarisieren und nur dort entfernen, wo sie nicht mehr als fachlicher Commit-Adapter benötigt werden.
