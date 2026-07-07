# Phase 36A.5 – LineSection Click Replay + Card Spacing Fix

## Problem
Nach 36A.4 blieb die Doppelklick-Symptomatik in Schmutzwasser/Regenwasser bestehen.
Ursache: Der direkte `pointerdown`-Handler verarbeitete `saved:load`/`saved:toggle`, danach konnte der zentrale `click`-Pfad dieselbe Aktion erneut ausführen.

Zusätzlich wurden nach der Custom-View-Migration in einzelnen Modulen die globalen Card-Abstände nicht mehr konsequent eingehalten.

## Fix
- LineSectionController:
  - Cross-Event-Dedupe für dieselbe `action:id`-Kombination ergänzt.
  - Zentral registrierte Actions laufen jetzt ebenfalls durch `handleLineAction()`.
  - Späterer `click` wird nach bereits verarbeitetem `pointerdown` unterdrückt.
- Spacing:
  - Custom-View-Spalten mit `tc-module-column` markiert.
  - Globaler 10px-Abstand für Card-/Stack-Kombinationen ergänzt.

## Erwartung
- Ein Klick markiert gespeicherte Einträge stabil.
- Ein Klick öffnet/schließt Accordion stabil.
- Card-Abstände folgen wieder dem 10px-Standard.
