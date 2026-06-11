# Phase 17A.3 - Rainwater Result Renderer

## Ziel

Regenwasser trennt die Ergebnisdarstellung von der Fachlogik. Das Modul liefert nur noch ein Ergebnis-Datenmodell; die Plattform entscheidet ueber Cards, Gruppen, Tabellen, Hinweise, Abstaende und responsive Darstellung.

## Umsetzung

- Neue Plattformschicht `js/platform/resultRenderer/` eingefuehrt.
- Plattform-API ergaenzt:
  - `renderResultCard()`
  - `renderResultGroup()`
  - `renderResultTable()`
  - `renderNoticeCard()`
  - `renderResultModel()`
- `js/core/resultRenderer.js` bleibt als Kompatibilitaets-Fassade fuer bestehende Tests und spaetere Modul-Migrationen erhalten.
- Regenwasser importiert den Renderer direkt aus der Plattformschicht.
- `js/modules/rainwater/results.js` liefert mit `results()` ein reines Datenmodell aus `primary`, `groups`, `notices` und `calculations`.
- Hydraulische Kennwerte, Notentwaesserung und Normhinweise liegen nicht mehr als Card-/HTML-Struktur im Regenwasser-Modul.

## Ergebnis

Regenwasser besteht bei der Ergebnisdarstellung nur noch aus Fachlabels, Kennwerten und Gruppendaten. Layout, Card-Struktur und Notice-Rendering liegen zentral in der Plattform und koennen anschliessend fuer Schmutzwasser, Rohr, Druck, Puffer und WRG/Mischluft verwendet werden.

## Qualitaet

- `npm test` erfolgreich.
- Suche in `js/modules/rainwater` nach `renderResult`, `resultCard`, `noticeCard` liefert nur noch den Plattform-Renderer-Aufruf in `index.js`.
