# Phase 36W.2G – Rainwater Drain Direct Commit

## Problem
Auch nach Entfernung von `render:'defer'` wurde der geänderte Dacheinlauf weder in der Anzeige noch in der Berechnung berücksichtigt.

## Konsequenz
Der Fehler liegt vor dem Renderer: Der tatsächliche Select-Wert von `data-field="drainSize"` wird im generischen Pfad nicht zuverlässig als vollständiger Dacheinlauf-Patch wirksam.

## Fix
In `js/modules/rainwater/index.js` wurde ein direkter Capture-Handler ergänzt:

```js
root.addEventListener('change', event => {
  const field = event.target?.closest?.('[data-field="drainSize"]');
  if (!field || !root.contains(field)) return;

  const patch = drainLookupPatchFromValue(field.value || 'DN 100');
  state.set(patch, { action: 'rainwater:drainSize:direct-change', notify: true });
}, true);
```

Der Patch wird direkt aus `roofDrainTable` aufgebaut und setzt:

- `drainSize`
- `drainSizeManual`
- `drainCapacity`
- `drainHead`

## Zusätzlich abgesichert
- `render:'defer'` bleibt bei `drainSize` entfernt.
- `hydrateDomFields` bleibt entfernt.
