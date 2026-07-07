# Phase 36N – h,x Scroll Freeze

## Fix
Bei h,x Saved-Process-Aktionen (`line:`, `saved:`, `hx:line:`) wird der aktuelle Scrollzustand über den gesamten Dynamic-Render eingefroren und über mehrere Frames wiederhergestellt.

Zusätzlich wird der h,x-spezifische `saved:delete` Override abgesichert.

## Nicht verändert
- globaler `lineSectionController`
- Save-/Update-/Accordion-Logik
- Diagramm-Berechnung
