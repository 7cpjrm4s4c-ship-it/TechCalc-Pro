# Phase 14H – Regenwasser Final Globalization

## Ziel
Regenwasser wird auf den globalen Modulstandard der Referenzmodule Heizung/Kälte und Lüftung gebracht.

## Umgesetzt
- App-Root bereinigt beim Modulwechsel stale Event-Pipelines und Modul-Aktionshandler.
- Regenwasser nutzt den globalen Save/List/Edit/Delete/Accordion Workflow für Flächen.
- Die Dachflächen-/Grundstücksflächen-Card enthält nur noch Flächenart und Fläche.
- Bezeichnung, Speichern, Aktualisieren und gespeicherte Flächen liegen im zentralen Speicher-Dialog.
- Keine gespeicherte Fläche wird ohne aktiven Save-Befehl erzeugt.
- Ergebnis-Card zeigt die aktuelle Eingabe oder die selektierte gespeicherte Fläche.
- Dacheinlauf-/Hoftopf-Auswahl hydratisiert Abflusswert und Anstauhöhe.
- Notentwässerungsart hydratisiert die passenden Eingabefelder.
- Dachfläche/Grundstücksfläche Switch setzt den Store konsistent zurück.
- KOSTRA-Link bleibt als globale Action-Link UI erhalten.

## Qualitätsprüfung
- `npm test` erfolgreich.
- ZIP muss genau einen Projektordner enthalten.
