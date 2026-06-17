# Phase 17B.1 - Schmutzwasser Platform Collections

## Ziel

Schmutzwasser wird nach Phase 17B weiter entkernt. Die Erfassung und Darstellung der Entwässerungsgegenstaende dient als zweiter Plattform-Referenzfall neben Regenwasser.

## Umsetzung

- Neue Plattformschicht `js/platform/collectionRenderer/`
- `FIELD_TYPES.COLLECTION` rendert nicht mehr im Core-Schema-Renderer selbst, sondern delegiert an die Plattform-Collection-Komponente
- Schmutzwasser-Action `fixtureAdd` beschreibt nur noch die fachliche Collection `fixtures`
- Die Runtime stellt generische Aktionen bereit:
  - `platform:collection:add`
  - `platform:collection:delete`
- Modulgebundene Action-Namen wie `collection:fixtures:add` wurden aus Schmutzwasser entfernt
- Modulgebundene Lookup-Keys wie `platform:wastewater:lookup` wurden entfernt
- Legacy-Klassen wie `dw-consumer-list` / `dw-consumer-row` wurden aus dem Collection-Renderer entfernt

## Architekturentscheidung

Schmutzwasser liefert weiterhin fachliche Funktionen:

- Auswahl- und Lookup-Daten
- Fachliche Validierung und Normalisierung
- Berechnung
- Result- und Saved-Record-Datenmodelle
- Collection-Mutationen auf Datenebene

Die Plattform entscheidet:

- Collection-Markup
- Collection-Aktionsnamen
- Add/Delete-Binding
- Input-/Commit-Verhalten
- CSS-Klassen
- Renderstruktur

## Regression

Neue Regression:

- `tests/wastewater-phase17b1-platform-collections.test.mjs`

Die Quality-Gate-Pipeline wurde erweitert und erfolgreich ausgefuehrt.
