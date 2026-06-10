# Phase 14D – Regenwasser Global UX Consolidation

Ziel: Regenwasser weiter an die globalen UI-/UX-Regeln anbinden und lokale Sonderklassen reduzieren.

## Änderungen

- Regenflächen-Listen verwenden zentrale `tc-consumer-*` Klassen statt Modul-/Altpräfixe.
- Ergebnislisten, Warnungen und Formeln verwenden nur noch zentrale `tc-*` Klassen.
- Der lokale Outside-Click-Clear wurde entfernt, damit zufällige Screen-Taps keinen Editor-Reset und keinen Full-Render auslösen.
- Die doppelte/dormante Speicher-Card wurde aus dem Modulcode entfernt; der primäre Workflow ist jetzt die zentrale Regenflächen-Liste.
- Dachfläche/Grundstücksfläche bleibt store-first über den zentralen Segment-Pfad gekoppelt.

## Regel

Regenwasser darf für UX/UI keine eigenen CSS-Klassen mehr einführen. Fachliche Adapter bleiben erlaubt, solange Events und Saved-Record-Aktionen über die zentrale Pipeline laufen.
