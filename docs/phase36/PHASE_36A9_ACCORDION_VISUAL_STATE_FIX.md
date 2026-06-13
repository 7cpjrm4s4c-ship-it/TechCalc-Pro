# Phase 36A.9 – Accordion Visual-State Fix

## Problem
Der Debug-Trace zeigte, dass `expandedId` bereits auf die Datensatz-ID gesetzt sein kann, während die Card optisch noch geschlossen ist. Ein State-basierter Toggle schließt dann beim ersten Tipp statt zu öffnen.

## Fix
`lineSectionController.toggle()` verwendet jetzt den tatsächlich sichtbaren DOM-Zustand der Card-Body:
- Body sichtbar -> schließen
- Body nicht sichtbar -> öffnen

Zusätzlich wird die DOM-Klasse `is-collapsed` sofort aktualisiert, bevor der State persistiert wird.

## Erwartung
Accordion öffnet/schließt mit einem Tipp, auch wenn State und UI vorher auseinanderlaufen.
