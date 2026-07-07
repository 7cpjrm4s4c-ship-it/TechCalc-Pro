# Phase 36A.8 – Saved Record State/UI Sync Fix

## Problem
Debug Card zeigte:
- Beim ersten Tipp auf einen gespeicherten Eintrag war `activeId` bereits gleich der Datensatz-ID.
- Der Controller führte deshalb `line:deselect` aus, obwohl die UI optisch nicht markiert war.

## Fix
- Klick auf einen bereits aktiven Datensatz löst kein Deselect mehr aus.
- Stattdessen wird der Datensatz erneut als aktiv synchronisiert (`line:refresh-active`).
- Accordion Toggle orientiert sich am sichtbaren DOM-Zustand (`aria-expanded` / `is-collapsed`) statt ausschließlich am State.
- Dadurch wird ein State/UI-Drift beim ersten Tipp korrigiert statt verstärkt.

## Erwartung
- Markieren funktioniert mit einfachem Tipp.
- Accordion öffnet/schließt mit einfachem Tipp.
- Kein Einfluss auf Speichern/Löschen.
