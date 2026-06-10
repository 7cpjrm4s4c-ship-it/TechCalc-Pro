# Phase 26C.2 — h,x Single Render Pipeline

## Ziel

Die h,x-Diagramm-Ausgabe wird über eine zentrale Render-Pipeline orchestriert. Ergebnisbereich, Prozessauswahl, Saved Records und SVG-Diagramm werden aus demselben ViewModel-/State-Snapshot aktualisiert.

## Änderungen

- `js/modules/hx-diagram/renderPipeline.js` eingeführt.
- Zentrale Entry Points ergänzt:
  - `createHxRenderModel()`
  - `renderResults()`
  - `renderDiagram()`
  - `renderProcessSelection()`
  - `renderSavedProcesses()`
  - `renderDynamicSections()`
- `view.js` rendert nur noch stabile DOM-Inseln mit `data-hx-dynamic`.
- `dynamicRenderer.js` delegiert vollständig an `renderDynamicSections()`.
- `platform:field:*`, `hx:*`, `line:*` und `saved:*` laufen jetzt durch dieselbe h,x-Pipeline.

## Architekturwirkung

Vorher:

```text
Field / Process / Saved Action
  -> teils Full Render
  -> teils Dynamic Renderer ohne DOM-Patch
  -> Diagramm konnte stale bleiben
```

Nachher:

```text
State Snapshot
  -> createHxRenderModel()
  -> renderProcessSelection()
  -> renderResults()
  -> renderDiagram()
  -> optional renderSavedProcesses()
```

Damit ist die Live-Diagramm-Aktualisierung nicht mehr von einem separaten Full-Render abhängig.

## Validierung

- `npm run test:imports`
- `npm run test:hx-diagram-phase26b1`
- `npm run test:hx-diagram-phase26b2`
- `npm run test:hx-diagram-phase26b2a`
- `npm run test:hx-diagram-phase26b3`
- `npm run test:hx-diagram-phase26b3a2`
- `npm run test:hx-diagram-phase26b3a3`
- `npm run test:hx-diagram-phase26c1`
- `npm run test:hx-diagram-phase26c2`
