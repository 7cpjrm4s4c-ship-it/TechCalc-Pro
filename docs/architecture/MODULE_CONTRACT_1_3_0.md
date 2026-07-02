# TechCalc Pro Modulvertrag 1.3.2-dev.1

## Ziel

Ab 1.3.2-dev.1 ist die App die Plattform. Module liefern fachliche Beschreibung und Berechnungslogik, aber keine eigenen UI-Regeln.

## Verbindliche Modulstruktur

```txt
js/modules/<module>/
  config.js      // Metadaten, Sichtbarkeit, Plattform-Capabilities
  state.js       // Initialstate und State-Instanz
  schema.js      // Formschema fuer zentrale Renderer
  logic.js       // reine Berechnungslogik
  index.js       // Adapter/Mount, waehrend der Migration moeglichst schlank
```

## Moduldefinition

```js
export default {
  config,
  schema,
  state,
  calculate,
  results,
  mount
};
```

Legacy-Module duerfen temporaer noch `mount` und eigenes View-Markup enthalten. Neue Module duerfen das nicht mehr.

## Was ein Modul nicht mehr selbst machen darf

- CSS-Klassen fuer eigenes Layout definieren
- eigene Button-, Card-, Form- oder Result-Komponenten bauen
- deutsche Zahlenlogik selbst parsen
- Scroll-Fixes lokal implementieren
- Saved-Record-Listen selbst neu erfinden
- DOM-Events ausserhalb der Plattform-Controller dauerhaft duplizieren

## Zentrale App-Schichten

- `moduleDefinition.js`: Vertrag, Capabilities, Migrationstatus
- `formSchema.js`: Feldtypen, Gruppen, zentrale Formular- und Result-Renderer
- `schemaModuleMount.js`: generischer Mount fuer schema-basierte Module
- `numberService.js`: deutsche Zahlenlogik
- `scrollManager.js`: Scroll-Stabilitaet
- `savedCalculationController.js`: Speichern/Aktualisieren/Laden/Loeschen
- `uiSystem.js` und `.tc-*`: Design-System

## Migrationstatus

- `legacy-adapter`: Modul laeuft stabil, nutzt aber noch eigenes View-Markup
- `phase-2-centralized`: zentrale Zahl-/Scroll-/Saved-Record-Regeln angebunden
- `schema-ready`: Modul besitzt Schema und kann auf generischen Renderer migriert werden
- `platform-native`: Modul nutzt keinen eigenen UI-Renderer mehr

## Phase-4-Stand

Regenwasser und Schmutzwasser besitzen jetzt erste `schema.js` Dateien und exportieren diese im Moduladapter. Das bestehende UI bleibt aktiv, aber die fachlichen Eingabestrukturen sind erstmals maschinenlesbar und zentral validierbar.
