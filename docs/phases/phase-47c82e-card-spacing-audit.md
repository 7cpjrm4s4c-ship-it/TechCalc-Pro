# Phase 47C.8.2E – Card-Spacing-Audit

## Ziel

Ein durchgängiger vertikaler Rhythmus für Card-Titel, Card-Inhalte, Geschwister-Cards und verschachtelte Ergebnisgruppen.

## Zentraler Contract

- `--tc-card-title-gap`: Abstand zwischen Card-Titel und Card-Inhalt
- `--tc-card-content-gap`: Abstand zwischen unabhängigen Inhaltsblöcken innerhalb einer Card
- `--tc-card-stack-gap`: Abstand zwischen eigenständigen Cards

Alle drei Werte werden zentral in `css/components-polish.css` definiert.

## Verschachtelte Ergebnisgruppen

`result-group` verwendet ein Grid mit dem zentralen Card-Stack-Abstand. Damit gelten dieselben Abstände:

- zwischen Ergebnistabelle und erster Unter-Card,
- zwischen zwei Unter-Cards,
- zwischen den Unter-Cards der DWA-A-117-Anwendungsprüfung.

Margin-basierte Sonderabstände wurden entfernt.

## Regression Gate

`tests/flooding-verification-phase47c82e-card-spacing.test.mjs` prüft:

- die drei zentralen Spacing-Tokens,
- die Anwendung des Titel- und Inhaltsabstands,
- den globalen Abstand zwischen Geschwister-Cards,
- den Grid-basierten Abstand verschachtelter Ergebnisgruppen,
- das Verbot des früheren `card + card`-Margin-Overrides.

Die Phase verändert keine Fachlogik, Berechnung oder Ergebniswerte.
