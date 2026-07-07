# Phase 36I – Saved Record State/DOM Sync Fix

## Problem
Nach Entfernung konkurrierender Saved-Record-Pfade und Single-Action-Eventfix blieb:
- Regenwasser: Markieren und Accordion benötigen Doppelklick
- Entwässerung: Markieren und Accordion benötigen Doppelklick

Das zeigt einen State/UI-Drift:
- State sagt `activeId === id`, aber DOM-Card hat kein `is-active`
- State sagt `expandedId === id`, aber DOM-Card hat `is-collapsed`

## Fix
`lineSectionController` korrigiert nun beim ersten Tap den sichtbaren DOM-Zustand:

### saved:load
- Nur wenn State **und DOM** aktiv sind, wird deselektiert.
- Wenn State aktiv ist, DOM aber nicht, wird erneut selektiert (`line:resync-active`).

### saved:toggle
- Wenn DOM `is-collapsed` hat, wird geöffnet.
- Erst wenn DOM sichtbar offen ist, darf ein Tap schließen.

## Erwartung
- Markieren mit einfachem Klick/Tap
- Accordion mit einfachem Klick/Tap
- Deselektieren weiterhin möglich, wenn der Eintrag sichtbar aktiv ist
