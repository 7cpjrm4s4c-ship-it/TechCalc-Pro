# Phase 43E.1 – Workspace Outer Frame Cleanup

## Ziel

Der übergeordnete blaue Rahmen um den gesamten Modul-/Workspace-Bereich wird in Light und Dark entfernt.

## Ursache

Der Rahmen lag nicht auf einzelnen Cards, sondern auf einem Layout-Container oberhalb der Cards. Diese Container sind reine Layout-Primitiven und dürfen gemäß Theme-/Module-Contract keine eigene visuelle Hierarchie erzeugen.

## Änderung

Folgende Container werden final rahmenlos gestellt:

- `.app-main`
- `.module-view`
- `.module-content`
- `.tc-grid`
- `.grid-12`

Dabei werden nur Rahmen, Outline und Shadow dieser Layout-Container entfernt. Card-Rahmen, Control-Fokus und Navigation bleiben unverändert.

## Ergebnis

- Kein blauer Workspace-Außenrahmen im Light Theme.
- Kein blauer Workspace-Außenrahmen im Dark/System Theme.
- Komponentenrahmen und Fokuszustände bleiben erhalten.
- Keine Runtime- oder Moduländerung.
