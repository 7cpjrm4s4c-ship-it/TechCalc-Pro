# Phase 17A.5 - Rainwater Platform Control

## Ziel

Regenwasser wird als Referenzmodul weiter entkernt. Das Modul darf nicht mehr selbst entscheiden, wie Mount, Layout, Actions, Saved Records, Lookup-Hydration oder Ergebnisdarstellung ausgeführt werden. Diese Verantwortung liegt in der Plattform.

## Umsetzung

### Neue Plattform-Schicht

`js/platform/moduleRuntime/index.js`

Die Plattform stellt jetzt `createPlatformModule()` bereit. Diese Runtime übernimmt:

- zentralen Mount über `mountModule()`
- View-Aufbau über `renderPlatformModuleView()`
- Berechnung des Result-Snapshots
- Ergebnis-Rendering über den Plattform-Renderer
- Saved-Record-Actions über `createSavedRecordActions()`
- Segment-Actions über zentrale Action-Namen
- Lookup-Hydration über `registerPipelineCommitHandler()`
- Scroll-Stabilisierung über die zentrale Scroll-Schicht

### Regenwasser-Index entkernt

`js/modules/rainwater/index.js` enthält nur noch:

- Config
- Schema
- State
- Calculate
- Results
- Saved-Records-Modell
- Controller-Konfiguration
- `createPlatformModule(...)`

Der Index enthält keine eigene Render-, Mount-, Action- oder DOM-Hydration-Logik mehr.

### Regenwasser-Controller als Fachadapter

`js/modules/rainwater/controller.js` enthält nur noch fachliche Adapter-Daten für die Plattform:

- Patch für Dachfläche/Grundstücksfläche
- Lookup-Patches für Dacheinlauf, Notentwässerung und Flächenart
- Snapshot/Hydrate/Clear-Patches für gespeicherte Flächen
- deklarative Saved-Record-Konfiguration

Die Ausführung dieser Patches erfolgt vollständig in der Plattform-Runtime.

## Referenzstruktur für weitere Module

Das neue Zielbild für Module ist:

```text
modules/<module>/
  config.js       -> Modulmetadaten
  schema.js       -> Eingabemodell
  state.js        -> Initialzustand
  logic.js        -> Fachberechnung
  results.js      -> Ergebnisdatenmodell
  controller.js   -> optionale fachliche Plattform-Adapter
  index.js        -> createPlatformModule({...})
```

## Qualität

`npm test` läuft erfolgreich. Die bestehenden Regenwasser-Regressionstests wurden auf die neue Plattformverantwortung angepasst, damit zukünftige Rückfälle in Modul-eigene Renderer, Mounts oder Actions erkannt werden.
