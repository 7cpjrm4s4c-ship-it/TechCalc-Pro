# Phase 42E.3 – Keyboard Regression Guard

## Basis

`techcalc-pro-1.3.2-dev.36-phase42e2-legacy-keyboard-removal`

## Ziel

Nach Phase 42E.1 und 42E.2 wird der zentrale Keyboard-/Focus-Vertrag dauerhaft gegen Regressionen abgesichert. Die Phase führt keine neue Tastaturlogik ein, sondern prüft statisch, dass keine modulinternen Keyboard-Pfade erneut entstehen.

## Bestätigter Vertrag

Zulässige zentrale Keyboard-Pfade:

- `js/core/eventPipeline.js`
- `js/core/focusManager.js`
- `js/core/stateBinding.js`
- `js/core/savedRecords.js`
- `js/platform/shell/settingsController.js`

Nicht zulässig in Modulen:

- eigene `keydown`-, `keypress`- oder `keyup`-Listener
- direkte `KeyboardEvent.event.key`-Navigation
- direkte Imports von `handlePlatformFieldNavigation`
- lokale Enter-/Tab-Reihenfolgen

## Implementierte Absicherung

Neu:

- `scripts/audit-keyboard-contract-phase42e3.mjs`
- npm-Script `audit:keyboard-contract`
- Integration-Gate erweitert

Der Audit prüft:

- keine lokalen Keyboard-Listener außerhalb des zentralen Vertrags
- keine `event.key`-Nutzung außerhalb zentraler Keyboard-Dateien
- kein direkter `handlePlatformFieldNavigation`-Import in Modulen oder Runtime-Sonderpfaden
- zentrale Event-Pipeline enthält weiterhin `data-collection-input`-Commit und `Tab`/`Enter`-Navigation
- zentraler Focus-Graph enthält Saved-Cards und explizite `data-platform-focus`-Elemente

## Bewusst verbleibende Ausnahmen

Folgende `.key`-Vorkommen bleiben erlaubt, weil sie keine KeyboardEvent-Navigation abbilden, sondern Dedupe-State-Keys:

- `js/modules/hx-diagram/controller.js`
- `js/modules/wastewater/controller.js`
- `js/platform/moduleRuntime/index.js`

Diese Ausnahmen dürfen nicht für neue Keyboard-Logik verwendet werden.

## Regression

Geprüfte Gates:

- `npm run audit:keyboard-contract`
- `npm test`
- `npm run test:integration`
- `npm run build`

Alle Gates: grün.
