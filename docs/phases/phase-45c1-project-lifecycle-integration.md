# Phase 45C.1 – Project Lifecycle Integration Fix

## Analyse

Nach dem Modulsplitting war das neue Modul `mixed-air` fachlich nutzbar, aber nicht vollständig in den Projektlebenszyklus eingebunden. Sichtbare Symptome waren ein fehlender Speicherdialog im Mischluft-Modul und unvollständige Übernahme von Mischluftdaten aus älteren Projektständen.

## Design Review

Referenz ist das bestehende Speicher-/Ladeverhalten der übrigen Module mit gespeicherten Zuständen. `mixed-air` erhält eine eigene Saved-Record-Struktur, bleibt aber rechnerisch getrennt von `heat-recovery`. Alte WRG/Mischluft-Projektdaten werden beim Laden einmalig getrennt: WRG-Daten bleiben in `heat-recovery`, Mischluft-Eingaben und Mischluft-Saved-Records wandern nach `mixed-air`.

## Implementierung

- Mischluft-State um `activeMixedAirId`, `activeMixedAirName`, `expandedMixedAirId` und `savedMixedAirStates` erweitert.
- Speicherdialog `Mischluft speichern` ergänzt.
- Saved-Record-Controller für Mischluft ergänzt.
- Projektmigration um Legacy-Aliase `wrg`, `wrg-mixed-air`, `mixedAir` und `mixed-air-calculation` erweitert.
- Legacy-Mischluft-Saved-Records aus alten WRG-Gerätelisten werden in `savedMixedAirStates` übernommen.

## Regression

Geprüft wurden Speicherdialog, Record-Erzeugung, Record-Hydration, Legacy-Projektmigration und Exportpersistenz von `mixed-air`. Der neue Regressionstest ist Teil des Fast-Test-Gates.

## Dokumentation

Diese Phase schließt die Implementierungslücke aus 45C und bereitet Phase 45D als reine Regression/Abnahme vor.
