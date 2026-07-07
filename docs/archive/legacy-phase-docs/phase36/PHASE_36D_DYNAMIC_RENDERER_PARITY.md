# Phase 36D – DynamicRenderer-Parität zu Heizung

## Ziel
Regenwasser und Schmutzwasser folgen weiter dem Heizung-Muster:

```text
index.js
  -> createLineSectionController()
  -> createView(... lineSectionController ...)
  -> create...DynamicRenderer(... lineSectionController, ...dynamicRenderers)
  -> createPlatformModule({ view, bind, dynamicUpdate, isDynamicAction })
```

## Änderungen
- Neue zentrale Renderer in `platform/dynamicRenderer/index.js`:
  - `createRainwaterDynamicRenderer`
  - `createWastewaterDynamicRenderer`
- `updateRainwaterDynamic()` aus dem Modul-Controller entfernt.
- `updateWastewaterDynamic()` aus dem Modul-Controller entfernt.
- Views liefern `dynamicRenderers` zurück wie Heizung.
- `index.js` orchestriert View + DynamicRenderer wie Heizung.
