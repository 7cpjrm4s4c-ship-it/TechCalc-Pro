# Phase 42E.2 – Legacy Keyboard Handler Removal

## Basis

`techcalc-pro-1.3.2-dev.36-phase42e1-keyboard-navigation-contract`

## Ziel

Der in Phase 42E.1 definierte zentrale Keyboard-/Focus-Vertrag bleibt die einzige Quelle für Tab-, Shift-Tab-, Enter- und Shift-Enter-Navigation. Modulinterne oder plattformnahe Legacy-Handler dürfen diesen Vertrag nicht mehr umgehen.

## Änderungen

### Zentraler Vertrag erweitert

`js/core/eventPipeline.js`

- Collection-Inputs mit `data-collection-input` werden beim Enter zentral committed.
- Die Navigation bleibt weiterhin über `handlePlatformFieldNavigation()` im zentralen Event-Pipeline-Pfad.
- Collection-Commit nutzt den vorhandenen `root.__tcPlatformCollectionContext` und erzeugt keine neue Infrastruktur.

### Legacy-Handler entfernt

`js/modules/drinking-water/controller.js`

- lokaler `keydown`-Handler im Navigation-Persistence-Guard entfernt.
- Fokus-/Keyboard-Release bleibt über `focusout`, `blur`, `change` und `visualViewport` erhalten.

`js/modules/wastewater/controller.js`

- lokaler Collection-`keydown`-Handler entfernt.
- Schmutzwasser-Collection-Kontext wird auf den zentralen `__tcPlatformCollectionContext` gespiegelt.
- ungenutzter direkter `handlePlatformFieldNavigation`-Import entfernt.

`js/platform/moduleRuntime/index.js`

- plattformnaher Collection-`keydown`-Handler entfernt.
- Collection-Enter wird nicht mehr parallel in `moduleRuntime` und `eventPipeline` verarbeitet.
- ungenutzter `handlePlatformFieldNavigation`-Import entfernt.

`js/core/formActions.js`

- Legacy-Enter-Handler in `bindLiveCollectionInput()` entfernt.
- ungenutzter `handlePlatformFieldNavigation`-Import entfernt.

## Verbleibende zentrale Keyboard-Pfade

- `js/core/eventPipeline.js` – primärer Keyboard-Vertrag
- `js/core/stateBinding.js` – Fallback für Legacy-/Manual-Mounts ohne zentrale Pipeline
- `js/core/savedRecords.js` – scoped Saved-Record-Aktivierung
- `js/platform/shell/settingsController.js` – globaler Settings-Shortcut / Shell-Verhalten

Diese Pfade sind keine Modul-Sonderlogik.

## Regression

- `npm test` grün
- `npm run test:integration` grün
- `npm run build` grün

