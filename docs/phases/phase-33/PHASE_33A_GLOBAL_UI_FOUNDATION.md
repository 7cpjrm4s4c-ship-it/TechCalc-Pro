# Phase 33A – Global UI Foundation

## Ziel

Phase 33A behandelt die UI-Probleme nicht als einzelne Modul-Bugs, sondern als zentralen Design-System-Defekt. Die geometrischen UI-Grundregeln werden global festgelegt und müssen für alle Module gelten.

## Entscheidung

Alle Module verwenden ab dieser Phase dieselbe 10px-Abstandslogik:

- Abstand zwischen Cards: 10px
- Abstand innerhalb von Cards: 10px
- Abstand zwischen Feldern und Controls: 10px
- Ergebnislisten, Saved-Record-Listen und dynamische Inseln: 10px

Cards, Inputs, Selects, Buttons, Toggles, Ergebniszeilen und Saved-Record-Cards werden über zentrale Tokens und zentrale Komponentenregeln gesteuert.

## Zentrale Steuerdateien

- `css/tokens.css`
- `css/components.css`

## Neue Tokens

- `--tc-gap: 10px`
- `--tc-card-padding: 10px`
- `--tc-control-height: 50px`
- `--tc-control-padding-x: 10px`
- `--tc-radius-base`
- `--tc-radius-card`
- `--tc-radius-pill`

Die bestehenden Alias-Tokens `--ui-gap`, `--card-gap`, `--field-gap`, `--section-gap` verweisen nun auf `--tc-gap`.

## Architekturregel

Modul-spezifische Abweichungen bei Card-Geometrie, Feldabständen, Control-Höhen oder Radius sind ab Phase 33 nicht mehr zulässig. Eine spätere Änderung des Radius oder der Grundabstände erfolgt zentral über `css/tokens.css`.

## Test

Ergänzt wurde:

- `tests/phase33-global-ui-foundation.test.mjs`
- npm Script: `npm run test:phase33-ui`

Der Test verifiziert die zentralen Tokens und den globalen UI-Contract.

## Status

- `npm run build`: OK
- `npm run audit:imports`: OK
- `npm run test:phase33-ui`: OK
- `npm test`: gestartet, lief in der Tool-Umgebung in den Timeout; bis zum Timeout waren die ausgeführten Regressionen grün.
