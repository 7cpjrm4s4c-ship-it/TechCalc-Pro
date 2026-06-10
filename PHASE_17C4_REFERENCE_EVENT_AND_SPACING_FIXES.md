# Phase 17C.4 – Reference Event and Spacing Fixes

## Ziel

Die offenen Referenzmodul-Bugs in Regenwasser und Schmutzwasser werden zentral in der Plattformschicht korrigiert:

- gespeicherte Einträge markieren, laden, aufklappen und löschen
- Regenwasser-Berechnungsbereich rendert Regenspende-Beschriftung sofort
- Card-Abstände nach der Plattformmigration wieder stabil

## Umsetzung

### Plattform-Events

`platform/moduleRuntime` besitzt jetzt capture-level Fallbacks für strukturelle Controls:

- Segment-Schalter
- Saved-Record-Karten
- Saved-Record-Toggle
- Saved-Record-Delete

Diese Fallbacks verwenden weiterhin dieselben zentralen Action-Handler. Es entsteht keine modulnahe Sonderlogik und keine zweite Fachlogik.

### Regenwasser-Switch

Der Berechnungsbereich ist ein struktureller Schemawechsel. Deshalb erzwingt die Runtime jetzt ein synchrones Rendern. Regenwasser deklariert zusätzlich einen minimalen `domPatch`, damit mobile Browser keine stale Labels anzeigen.

### Plattform-Abstände

Der globale Plattform-Layoutvertrag wurde wieder explizit gesetzt:

- `.module-content` als Grid
- `.span-*` als vertikale Stacks
- `.tc-stack` als vertikaler Stack
- zentrale Card-Gaps über `--ui-gap`

## Prüfung

`npm test` erfolgreich.
