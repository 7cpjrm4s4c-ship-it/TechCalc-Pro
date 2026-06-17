# Phase 36A.10 – Accordion Memory Fix

## Problem
36A.9 zeigte im Debug:
- `expandedId` war bereits die Datensatz-ID.
- Der DOM-Check meldete `visualExpanded=true`.
- Der erste Tipp wurde deshalb als Schließen interpretiert.

## Fix
Der `lineSectionController` führt nun eine per-root Accordion-Memory:
- erster Tipp auf Datensatz ohne User-Open-Memory -> öffnen
- nächster Tipp auf denselben Datensatz -> schließen
- Löschen entfernt die Memory

Damit wird initialer State/UI-Drift nicht mehr als echte User-Öffnung interpretiert.
