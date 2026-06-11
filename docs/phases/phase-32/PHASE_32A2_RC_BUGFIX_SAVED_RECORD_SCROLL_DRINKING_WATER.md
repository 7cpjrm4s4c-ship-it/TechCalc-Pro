# Phase 32A.2 - RC Bugfix: Saved Records, Scroll, Trinkwasser

## Ziel

Zweiter Release-Candidate-Bugfix-Batch fuer 1.3.0-rc.1. Schwerpunkt sind die aus der Pragmatrix gemeldeten P1/P2-Cluster:

- gespeicherte Inhalte reagieren erst nach einem zweiten Klick
- Scrollspruenge beim Loeschen/Speichern gespeicherter Inhalte
- Trinkwasser-Zusammenstellung enthaelt Entwurfswerte
- Trinkwasser-Auswahl oeffnet den Bearbeitungsdialog zu aggressiv

## Aenderungen

### Event Pipeline

- `field:blur` rendert nicht mehr strukturveraendernd, wenn bereits eine gespeicherte Aktion per `pointerdown`/`touchstart` vorbereitet wurde.
- Dadurch werden Saved-Record-Klicks nicht mehr durch einen Blur-Render des vorher fokussierten Eingabefeldes verschluckt.
- Die normale Blur-Berechnung bleibt ohne laufende Aktion erhalten.

### Saved Record Scroll Stabilitaet

- Plattform-Saved-Record-Loeschen und Toggle verwenden jetzt den angeklickten Datensatz als Scroll-Anker.
- Legacy-/Facade-Saved-Record-Loeschen und Toggle wurden auf dieselbe Anchor-Strategie gehoben.
- Ziel: Loeschen von Regenwasser-/Trinkwasser-/vergleichbaren Records ohne sichtbaren Ruecksprung.

### Trinkwasser

- Die ViewModel-Standardberechnung nutzt keine Entwurfswerte mehr fuer die Ergebnis-/Zusammenstellungsansicht.
- Damit erscheinen nur gespeicherte Nutzungseinheiten und gespeicherte Einzelverbraucher in der Zusammenstellung.
- Das Markieren gespeicherter Trinkwasser-Eintraege erzwingt nicht mehr automatisch das Oeffnen des Zusammenstellen-Dialogs.

## Abgedeckte RC-Bugs

- Schmutzwasser: Saved Record Auswahl benoetigt Doppelklick
- Regenwasser: Saved Record Auswahl benoetigt Doppelklick
- Regenwasser: Scrollsprung beim Loeschen
- Trinkwasser: Markieren oeffnet zusaetzlich Zusammenstellungsfenster
- Trinkwasser: nur gespeicherte Verbraucher in Zusammenstellung
- Trinkwasser Mobile: Scrollstabilitaet beim Speichern/Interagieren weiter gehaertet

## Quality Gate

- `npm run build` OK
- `npm run audit:imports` OK
- `npm test` OK

## Release-Status

Runtime-Aenderung mit niedriger Architekturbreite. Keine neue Feature-Migration, keine neue Plattformabstraktion.
