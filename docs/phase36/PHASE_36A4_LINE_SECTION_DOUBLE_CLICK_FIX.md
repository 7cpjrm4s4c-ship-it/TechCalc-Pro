# Phase 36A.4 – LineSectionController Double-Click Fix

## Problem
Schmutzwasser und Regenwasser zeigten identisch:
- gespeicherten Eintrag erst nach Doppelklick stabil markieren
- Accordion öffnet und schließt beim ersten Klick wieder

## Ursache
`lineSectionController` hat dieselbe Aktion über mehrere direkte Eventquellen verarbeitet:
- `pointerdown`
- `mousedown`
- `touchstart`

Zusätzlich enthielt der Dedupe-Key den Eventtyp. Dadurch wurden `pointerdown` und `mousedown` als unterschiedliche Aktionen behandelt.

## Fix
- direkte Bindung auf `pointerdown` reduziert
- Dedupe-Key von `${action}:${id}:${event.type}` auf `${action}:${id}` reduziert

## Erwartung
Ein Klick löst `saved:load` oder `saved:toggle` nur noch einmal aus.
