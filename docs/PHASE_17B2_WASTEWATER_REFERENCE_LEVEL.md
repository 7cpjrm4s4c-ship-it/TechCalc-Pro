# Phase 17B.2 – Schmutzwasser auf Referenzniveau

Ziel: Das Schmutzwasser-Modul wird nach Regenwasser als zweites Referenzmodul auf Plattformsteuerung gehoben. Das Modul soll nur noch Fachschema, Tabellen, Berechnung, Fachzustand und Ergebnisdaten liefern. Plattformcode steuert Rendering, Collection-Markup, Saved-Record-Mutationen und Ergebnis-Mounting.

## Änderungen

- `js/modules/wastewater/lineModel.js` ergänzt.
  - Leitungsfamilie, Lüftungsstatus und Line-Type-Auflösung liegen nicht mehr im Runtime-Controller.
- `js/platform/collectionModel/` ergänzt.
  - Generische Collection-Helfer für Upsert, Patch by ID und Delete by ID.
- `js/platform/savedRecordModel/` ergänzt.
  - Generische Snapshot- und Hydration-Helfer für gespeicherte Datensätze.
- `js/core/schemaRenderer.js` erweitert.
  - Schema-Felder erhalten jetzt Plattform-Kontext inklusive berechnetem `result`.
- `js/platform/moduleRenderer/index.js` erweitert.
  - Berechnungsergebnis wird an den Schema-Renderer durchgereicht.
- `js/platform/collectionRenderer/index.js` erweitert.
  - Collection-Items können nun aus dem Ergebnis-Kontext dargestellt werden, mit Fallback auf State-Collections.
- `js/modules/wastewater/schema.js` entkoppelt.
  - Keine Abhängigkeit mehr auf `controller.js`.
  - Keine eigenständige `calculate()`-Ausführung für Collection-Anzeige.
- `js/modules/wastewater/controller.js` reduziert.
  - Collection-Mutationen und Saved-Record-Snapshot/Hydration nutzen Plattform-Helfer.

## Architekturwirkung

Schmutzwasser nähert sich damit dem Regenwasser-Referenzstand an:

- Modul beschreibt Fachmodell und Fachentscheidungen.
- Plattform steuert UI-/UX-Mechanik.
- Collection-Rendering ist Plattformstandard.
- Saved-Record-Handling ist Plattformstandard.
- Ergebnisdaten werden nicht als modulnahe HTML-Struktur behandelt.

## Regression

Neue Regression:

- `tests/wastewater-phase17b2-reference-level.test.mjs`

Die Regression prüft:

- kein Schema-Import aus `controller.js`
- keine eigene Berechnung im Schema für Collection-Darstellung
- Result-Kontext im Schema-Renderer
- Plattform-Collection-Mutationen
- Plattform-Saved-Record-Model
- keine `wastewater-*`, `dw-consumer`, `platform:wastewater` oder `collection:fixtures:add` Ausgabe

## Status

`npm test` erfolgreich.
