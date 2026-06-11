# Phase 18B.3 – Heizung/Kälte Dynamic Renderer

## Ziel

Die Dynamic-Island-Mechanik des Moduls Heizung/Kälte wurde aus dem Modul in eine zentrale Plattformkomponente verschoben.

## Umsetzung

- neuer Ordner `js/platform/dynamicRenderer/`
- neue Factory `createHeatingCoolingDynamicRenderer()`
- DOM-Island-Helfer zentralisiert:
  - `setInner()`
  - `setSelectValue()`
  - `setInputValue()`
  - `updateCardAccent()`
  - `setCardTitle()`
  - `updateSegment()`
- `modules/heating-cooling/index.js` delegiert Dynamic Updates an den Plattform-Renderer
- bestehender `mountHeatingCooling()` bleibt als Adapter bis Phase 18B.4 erhalten

## Ergebnis

Heizung/Kälte enthält weiterhin die fachliche Zustandsableitung, aber nicht mehr die eigene Dynamic-Renderer-Infrastruktur.
