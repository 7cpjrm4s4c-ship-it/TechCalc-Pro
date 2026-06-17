# Phase 36Q.4 – Globaler Spacing-Contract

## Problem
Das Layout ist nach 36Q.3 strukturell wieder korrekt, aber die Card-Abstände sind weiterhin uneinheitlich.

## Ursache
Es existierten mehrere konkurrierende Abstandssysteme:

- `--ui-gap`
- `--tc-gap`
- `--section-gap`
- alte Phase-35/36-Overrides

Dadurch konnten Modul-Grid, Card-Body und Stack unterschiedliche Abstände verwenden.

## Fix
- `--tc-gap`, `--ui-gap` und `--section-gap` auf denselben Wert geführt.
- Modul-Spalten (`span-*`) verwenden einheitlich `gap: var(--tc-gap)`.
- `.module-content`, `.module-view`, `.tc-grid` verwenden einheitlich `gap: var(--tc-gap)`.
- `.tc-stack`, `.card__body`, `.tc-card__body`, `.result-card__body` verwenden denselben Gap.
- Regenwasser/Schmutzwasser bekommen keine Sonderabstände, sondern folgen dem globalen Contract.

## Nicht geändert
- View-Struktur aus 36Q.3 bleibt erhalten.
- Berechnungslogik bleibt unverändert.
- Saved-Record-Pfade bleiben unverändert.
