# Phase 26C.3 - h,x View Purification

## Ziel

Die h,x-View wurde auf Shell-, Layout- und Dynamic-Island-Komposition reduziert. Form-Control-Markup, Prozessauswahl und fachliche Renderer bleiben außerhalb der View.

## Änderungen

- `formRenderer.js` neu eingeführt.
- `view.js` bereinigt:
  - keine einzelnen Form-Control-Renderer mehr,
  - keine Prozessauswahl-Logik mehr,
  - keine Diagramm-/SVG-Logik,
  - keine Saved-Record-Logik.
- `view.js` komponiert nur noch:
  - Modul-Shell,
  - linke/rechte h,x-Spalte,
  - Dynamic Slots für Resultate, Saved Records und Diagramm.
- `config.migrationStatus` auf `phase-26c3-view-purification` gesetzt.

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
- `npm run test:hx-diagram-phase26c3`

## Ergebnis

Phase 26C.3 schließt die View-Purification ab. Der h,x-Renderingpfad ist jetzt in Controller, ViewModel, FormRenderer, ResultRenderer, DiagramRenderer und RenderPipeline getrennt.
