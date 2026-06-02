# Phase 17B · Schmutzwasser Plattformsteuerung

## Ziel

Schmutzwasser wurde als zweites Referenzmodul nach Regenwasser in die zentrale Plattformsteuerung migriert. Damit validiert die Plattform jetzt nicht nur ein Flächen-/Regenmodell, sondern auch ein Verbraucher-/Listenmodell mit dynamischen Entwässerungsgegenständen.

## Umsetzung

- `js/modules/wastewater/index.js` ist auf `createPlatformModule(...)` reduziert.
- Eingaben laufen über das zentrale Schema-Rendering.
- Ergebnisse laufen über das zentrale Result-Model und den Plattform-Renderer.
- Speichern, Laden, Aktualisieren und Löschen laufen über den zentralen Saved-Record-Controller.
- Entwässerungsgegenstände laufen über neue Plattform-Collection-Actions.
- Eigene DOM-Listener, eigene Mount-Logik und eigene HTML-Ergebniskarten wurden aus dem Modul entfernt.

## Neue Plattform-Bausteine

- `FIELD_TYPES.ACTION`
- `FIELD_TYPES.COLLECTION`
- zentrale Collection-Bindings in `platform/moduleRuntime`

## Modul-Restverantwortung

Schmutzwasser enthält jetzt im Wesentlichen:

- Fachschema
- Tabellen / Lookups
- Berechnung
- Result-Datenmodell
- fachliche Controller-Patches für Collection- und Saved-Record-Daten

## Qualitätstor

- `npm test` erfolgreich
- neue Regression: `tests/wastewater-phase17b-platform-control.test.mjs`
- keine `data-wastewater` Hooks im Modul
- kein eigener Result-Renderer im Modul
- keine eigene Mount-Logik im Modul
