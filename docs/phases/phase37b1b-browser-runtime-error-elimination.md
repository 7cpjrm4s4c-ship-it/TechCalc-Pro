# Phase 37B.1B — Browser Runtime Error Elimination

## Ziel

Die nach 37B.1A im Browser sichtbaren Console-Fehler werden gezielt geschlossen:

- `PlatformFocusManager is not defined` in `eventPipeline.js`
- `NotFoundError: Failed to set the innerHTML property on Element` im Trinkwasser-Dynamic-Renderer

## Änderungen

### Event Pipeline

`eventPipeline.js` nutzt jetzt den expliziten Import `preserveFocusDuring` aus `focusManager.js`.
Damit ist die zentrale Keyboard-Refresh-Strecke nicht mehr von einer nicht vorhandenen globalen `PlatformFocusManager`-Referenz abhängig.

### Trinkwasser Dynamic Renderer

`setIslandInner()` wurde gegen stale Dynamic-Island-Anker gehärtet:

- keine Writes auf nicht verbundene Islands
- kein Write, wenn der Root die Island nicht mehr enthält
- bekannter Detached-Node-`NotFoundError` wird abgefangen
- unbekannte Fehler werden weiterhin geworfen

## Erwartung im Browser

Nach Deployment dieser Phase sollten die relevanten Console-Fehler verschwinden:

- 0 `PlatformFocusManager is not defined`
- 0 Dynamic-Renderer `innerHTML` Detached-Node Exceptions

Analytics-Blocker und Browser-Meta-Warnings bleiben nicht release-relevant.
