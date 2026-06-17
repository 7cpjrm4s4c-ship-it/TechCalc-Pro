# Phase 36H – LineSection Single-Action Fix

## Ausgangslage
36G bestätigte: Regenwasser und Entwässerung besitzen keine konkurrierenden Saved-Record-Pfade mehr.
Trotzdem benötigen Markieren und Accordion weiterhin Doppelklicks.

## Fix
- Direkte Verarbeitung nur noch über `pointerdown`.
- Dedupe-Key ohne `event.type`.
- Zentral registrierte Actions laufen durch denselben `handleLineAction`.
- Späterer `click` wird unterdrückt, wenn dieselbe `action:id`-Kombination bereits verarbeitet wurde.
