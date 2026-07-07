# Phase 36Q.5A – FocusManager Details Auto-Open

## Problem
Im Trinkwasser-Modul liegen Eingabefelder teilweise in geschlossenen `<details>` / Accordion-Bereichen.
Der zentrale `focusManager` filterte diese Felder als unsichtbar heraus. Dadurch wurden sie bei Tab/Enter übersprungen.

## Fix
`focusManager.js` wurde erweitert:

- Plattformfelder in geschlossenen `<details>` werden in die Navigationsliste aufgenommen.
- Vor dem Fokussieren wird das zugehörige `<details>` automatisch geöffnet.
- Explizit versteckte Felder (`hidden`, `aria-hidden`) bleiben ausgeschlossen.
- `summary`-Elemente werden nicht fälschlich als geschlossener Details-Inhalt behandelt.

## Betroffen
- Trinkwasser: Tab/Enter kann nun in Accordion-Felder hinein navigieren.
- Andere Module profitieren, sofern sie Accordion-Felder mit `data-field` verwenden.

## Nicht geändert
- Keine CSS-Änderungen
- Keine Modulcontroller-Änderungen
- Keine Saved-Record-Änderungen
