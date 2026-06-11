# Phase 17A.6 – Rainwater Platform-Only Reference

## Ziel

Regenwasser wurde als Referenzmodul weiter entkernt. Das Modul beschreibt nur noch Fachschema, Lookup-Optionen, Berechnung, Ergebnisdaten und fachliche State-Patches. Die Plattform steuert Darstellung, Saved-Record-UI, Schema-Sonderkomponenten, Gruppenaktionen, Actions und Mounting.

## Umsetzung

### Plattform-Schema erweitert

`js/core/formSchema.js` und `js/core/schemaRenderer.js` unterstützen jetzt zusätzliche deklarative Feldtypen:

- `FIELD_TYPES.NOTICE` für Hinweis-/Empty-State-Darstellung
- `FIELD_TYPES.STATS` für kompakte Inline-Kennwerte
- `group.actions` für Links und Gruppenaktionen innerhalb von Schema-Cards

Damit liegen Mini-HTML-Templates wie Hinweisboxen, Inline-Stats und KOSTRA-Link nicht mehr im Regenwasser-Modul.

### Regenwasser-Schema entkernt

`js/modules/rainwater/schema.js` enthält keine modulinterne HTML-Renderlogik mehr für:

- Notentwässerungs-Hinweis
- Abflussbeiwerte `Cs` / `Cm`
- KOSTRA/OpenKo-Link

Diese Darstellungen werden vollständig vom zentralen Schema-Renderer erzeugt.

### Controller weiter neutralisiert

`js/modules/rainwater/controller.js` nutzt nur noch Plattform-Namespaces und Plattform-Defaults:

- Segment-Aktion: `platform:segment:surfaceMode`
- Lookup-Hydration: `platform:lookup-hydration`
- Saved-Record-Attribute werden nicht mehr im Modul deklariert
- Pre-Save/Pre-Update-Actions fallen auf Runtime-Defaults zurück

Fachlich verbleiben nur noch Patches für Moduswechsel, Lookup-Werte, Snapshot/Hydration und Editor-Reset.

### Saved Records als Datenmodell

`js/modules/rainwater/results.js` liefert weiterhin Saved-Record-Daten, aber keine eigenen Attribute oder dynamischen Regenwasser-DOM-Hooks mehr. Die Plattform rendert und verdrahtet die Liste über Defaults.

## Qualitätssicherung

Neue Regression:

- `tests/rainwater-phase17a6-platform-control.test.mjs`

Geprüft wird unter anderem:

- keine `FIELD_TYPES.CUSTOM`-Nutzung im Regenwasser-Schema
- keine `inlineStats`-/`afterHtml`-/Mini-HTML-Renderlogik im Regenwasser-Schema
- zentrale `NOTICE`-/`STATS`-Renderer vorhanden
- zentrale Gruppenaktionen vorhanden
- keine `rainwater:`-Actions oder Saved-Record-Attribut-Deklarationen im Regenwasser-Controller
- keine `data-rainwater`-Hooks im Saved-Record-Datenmodell

`npm test` erfolgreich.
