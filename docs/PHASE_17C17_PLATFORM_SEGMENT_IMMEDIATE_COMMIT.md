# Phase 17C.17 - Platform Segment Immediate Commit

## Ziel

Segment-Umschaltungen in Plattform-Modulen muessen sofort in den Store geschrieben werden. Der Mobile-Safari-Fehler im Regenwasser-Modul zeigte, dass der Scroll-Stabilizer `preserveScroll()` den initialen Segment-Commit verzoegern kann. Dadurch wurde die Segment-UI optisch beruehrt, aber `surfaceMode` blieb bis zur naechsten Eingabe auf dem alten Wert.

## Root Cause

`bindSegments()` behandelte Segment-Actions wie normale Eingaben:

```js
preserveScroll(() => state.set(patch, { action, notify: true }));
```

Fuer schema-strukturelle Segment-Actions ist das zu spaet. Segmentwechsel koennen Labels, `visibleWhen`, Select-Inhalte und ganze Cards veraendern.

## Umsetzung

`platform:segment:*` und `segment:select` committen jetzt direkt:

```js
if (action.startsWith('platform:segment:') || action === 'segment:select') {
  state.set(patch, { action, notify: true });
} else {
  preserveScroll(() => state.set(patch, { action, notify: true }));
}
```

## Wirkung

- Regenwasser: Dachflaeche/Grundstuecksflaeche schaltet sofort `r(5,5)`/`r(5,2)` und Dacheinlauf/Hoftopf um.
- Schmutzwasser: Segment-/Select-nahe Strukturwechsel bleiben store-first kompatibel.
- Zukuenftige Plattformmodule erhalten denselben Segmentvertrag.
- Normale Eingaben behalten den Scroll-Schutz.

## Debug

Die temporaere Debug-Card und alle `console.log`-Pruefungen wurden nicht uebernommen.
