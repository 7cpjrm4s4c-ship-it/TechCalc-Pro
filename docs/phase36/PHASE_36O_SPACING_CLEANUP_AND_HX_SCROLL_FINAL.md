# Phase 36O – Spacing Cleanup + finaler h,x Scroll-Fix

## Basis
`techcalc-pro-1.3.2-dev.1-rc.1-phase36n-hx-scroll-freeze.zip`

## h,x Scroll-Fix
Saved-Aktionen aktualisieren nur noch Saved-Controls und Saved-Rows. Prozessauswahl, Ergebnisblock und Diagramm werden bei Saved-Aktionen nicht mehr neu gerendert.

## Regenwasser / Schmutzwasser Spacing
- `tc-module-column` aus Views entfernt
- alte modulbezogene Spacing-Sonderregeln entfernt
- globaler 10px-Spacing-Standard in `components.css` ergänzt

## Geänderte CSS-Dateien
- `css/components.css`
- `css/layout.css`
- `css/tokens.css`
