# Phase 36W.2I – Rainwater Drain Precommit Capture

## Problem
Der Root-Handler aus 36W.2G kam zu spät. Die zentrale Root-Pipeline verarbeitet `change` bereits in Capture-Phase und kann dabei rendern, bevor der direkte Dacheinlauf-Patch wirksam wird.

## Fix
Der Dacheinlauf-Patch wird jetzt vor der Root-Pipeline auf `document` in Capture-Phase vorcommitted:

```js
document.addEventListener('input', precommitDrain, true);
document.addEventListener('change', precommitDrain, true);
```

Der Patch wird bewusst mit `notify:false` gesetzt:

```js
state.set(patch, { action: 'rainwater:drainSize:precommit', notify: false });
```

Danach läuft die normale zentrale Pipeline weiter und rendert mit vollständigem State:

- `drainSize`
- `drainSizeManual`
- `drainCapacity`
- `drainHead`

## Erwartung
Dacheinlauf-Wechsel wird jetzt in Anzeige und Berechnung berücksichtigt.
