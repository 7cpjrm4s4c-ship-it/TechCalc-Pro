# Phase 26C.1 - h,x Diagram Renderer Extraction

## Ziel

Das h,x-SVG-Diagramm wurde aus der View-Schicht extrahiert und in einen dedizierten Diagramm-Renderer verschoben.

## Geänderte Struktur

Neue Datei:

- `js/modules/hx-diagram/diagramRenderer.js`

Aus `view.js` entfernt:

- `buildSegmentPath()`
- `buildStateSegments()`
- `HX_CHART`
- `hxPx()`
- `hxPy()`
- `STATIC_HX_BACKGROUND`
- `renderHxSvg()`
- `chartCard()`

`view.js` komponiert das Diagramm nur noch über:

```js
chartCard(vm.activePath, vm.targetReached)
```

## Architekturwirkung

Vorher:

```text
view.js
  Input-Markup
  Result-Komposition
  Saved-Records-Komposition
  SVG-Diagramm
  h,x-Kurvenlogik
```

Nachher:

```text
view.js
  Input-Markup
  Result-Komposition
  Saved-Records-Komposition
  Diagramm-Slot

diagramRenderer.js
  SVG-Diagramm
  h,x-Kurvenlogik
  Prozesspfad-Segmente
  Diagramm-Card
```

## Stabilitätsziel

Die bestehende Live-Render-Pipeline aus 26B.3A.3 bleibt unverändert:

- Prozesswechsel rendert weiterhin sofort.
- gespeicherter aktiver Prozess erzeugt weiterhin Live-Preview aus aktuellem State.
- Enter-/Tab-Navigation bleibt zentral über die Plattform erhalten.

## Validierung

Ausgeführt:

```bash
npm run test:imports
npm run test:hx-diagram-phase26b1
npm run test:hx-diagram-phase26b2
npm run test:hx-diagram-phase26b3
npm run test:hx-diagram-phase26b3a2
npm run test:hx-diagram-phase26b3a3
npm run test:hx-diagram-phase26c1
```
