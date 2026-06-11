# Phase 28B.4 - Dynamic Input Focus Hardening

## Ziel

Phase 28B.4 haertet dynamische Eingabefelder gegen Fokusverlust nach Re-Rendern.

Betroffene Risikobereiche:

- h,x-Diagramm
- WRG / Mischluft
- Trinkwasser
- dynamische Render Islands
- Saved-Record- und Moduswechsel mit Feldlisten-Neuaufbau

## Umsetzung

### PlatformFocusManager

Ergaenzt wurden zentrale APIs:

- `captureActiveField(root)`
- `restoreCapturedField(root, snapshot)`
- `preserveFocusDuring(root, mutate)`

Die Wiederherstellung nutzt:

1. stabilen `data-field` Key
2. Index-Fallback innerhalb der aktuellen Plattformfelder
3. Caret-/Selection-Restore fuer Textfelder
4. `preventScroll`
5. Select-Reopen-Guard

### Dynamic Renderer Integration

Dynamische DOM-Ersetzungen werden jetzt fokuserhaltend ausgefuehrt in:

- `js/modules/hx-diagram/renderPipeline.js`
- `js/modules/heat-recovery/dynamicRenderer.js`
- `js/modules/drinking-water/dynamicRenderer.js`

Damit bleibt die Fokusnavigation aus 28B.2/28B.3 auch bei dynamisch neu aufgebauten Eingabeinseln stabil.

## Nicht geaendert

- keine fachliche Berechnungslogik
- keine Saved-Record-Semantik
- keine Scroll-Service-Semantik
- keine Layout-/View-Struktur

## Validierung

- `npm run audit:dynamic-input-focus`
- `npm run test:platform-focus-phase28b4`
- `npm run test:imports`
