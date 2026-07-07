# Phase 36S.1 – Result-Row Cascade Fix

## Problem
36Q.5B änderte die frühe Basisregel auf `padding: 0`, blieb aber wirkungslos, weil eine spätere Sammelregel `.result-row` wieder mit `padding: var(--tc-gap)` überschrieben hat.

## Fix
- `.result-row` aus der späteren Sammelregel entfernt.
- Basisregel `.result-row` auf `padding: 0` gesetzt.
- Finaler Schutz ergänzt:

```css
.result-list > .result-row,
.tc-result-list > .result-row {
  padding: 0;
}
```

## Ziel
Der vertikale Abstand zwischen Ergebniszeilen wird nur noch durch `.result-list { gap: var(--tc-gap) }` bestimmt.

## Nicht geändert
- Keine JavaScript-Änderungen
- Keine View-Änderungen
- Keine Modulcontroller-Änderungen
