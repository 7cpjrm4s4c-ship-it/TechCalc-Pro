# Phase 36F – Finale Saved-Record-Pfad-Parität

## Änderungen
- Regenwasser: `bindRainwaterPlatform` aus `controller.js` entfernt; Bind erfolgt wie Heizung direkt in `index.js`.
- Schmutzwasser: Saved-Record-Bind erfolgt wie Heizung direkt in `index.js`; nur Collection-Bind bleibt als zusätzliche Domain-Funktion.
- `update...Dynamic()` und `isDynamic...Action()` stehen jetzt wie bei Heizung im `index.js`.
- View, DynamicRenderer, Bind und `createPlatformModule` verwenden dieselbe `lineSectionController`-Instanz.

## Zielpfad
`index.js -> createLineSectionController -> createView -> createDynamicRenderer -> bind -> dynamicUpdate`
