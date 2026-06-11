# Phase 14A – Regenwasser Globalisierung

Basis: Phase 13E mit stabilen Referenzmodulen Heizung/Kälte und Lüftung.

## Ziel

Regenwasser wird schrittweise auf denselben globalen Bedienstandard gebracht:

- zentrale Event-Pipeline statt lokaler Save-/Select-/Delete-Handler
- Store-first Saved Entries
- Auswahl und Accordion-State getrennt
- Flächenliste und Flächenergebnisse über zentrale Actions
- deutsche Zahleneingabe bleibt über `numberService`/`canonicalGermanNumberInput` stabil
- UI-Zustände werden nicht in Saved Snapshots persistiert

## Umgesetzt

- `registerCentralActions()` in `js/modules/rainwater/index.js` angebunden
- Berechnung speichern/aktualisieren läuft über `rainwater:save` und `rainwater:update`
- Flächen speichern/aktualisieren/auswählen/löschen läuft über `rainwater:surface-*`
- Saved Entries nutzen die zentralen `saved:*` Actions
- `expandedCalculationId` und `expandedSurfaceResultId` als expliziter Store-State ergänzt
- Accordion öffnet nicht automatisch durch Auswahl
- UI-State wird beim Speichern aus Snapshots entfernt
- Regressionstest `rainwater-global-standard.test.mjs` ergänzt

## Nächste Prüfung am Gerät

- Dachfläche hinzufügen, auswählen, aktualisieren, löschen
- Grundstücksfläche hinzufügen, auswählen, aktualisieren, löschen
- Berechnung speichern, laden, aktualisieren, löschen
- Saved-Details nur per Pfeil öffnen/schließen
- deutsche Flächeneingaben wie `2.500`, `2.500,5`, `2,5` prüfen
