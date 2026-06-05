# Phase 18C.2 – Select Focus Nav Guard

## Problem
Nach Auswahl des Rohrwerkstoffs in Heizung/Kälte verschwand die Mobile Nav Pill. Die Navigation war nicht durch den Pipe-Recommendation-Renderer entfernt, sondern wurde durch die globale CSS-Regel `body.tc-keyboard-open .module-nav` ausgeblendet.

## Ursache
`select[data-field]` war im Keyboard-Focus-Selector enthalten. Native Select-Picker auf iOS öffnen jedoch keine Software-Tastatur. Beim pipeSystemId-Select blieb `tc-keyboard-open` nach dem Commit stehen, wodurch die Nav Pill ausgeblendet wurde.

## Fix
- Keyboard-Focus-Erkennung begrenzt auf `input[data-field]` und `textarea[data-field]`.
- Select-Commits entfernen `tc-keyboard-open` defensiv.

## Ergebnis
Rohrwerkstoff-Auswahl aktualisiert weiterhin die Pipe-Recommendation, ohne die globale Navigation auszublenden.
