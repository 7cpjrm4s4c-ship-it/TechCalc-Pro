# Phase 36A.6 – LineSection Instrumentation + Spacing Normalization

## Debug-Aktivierung

In der Browser-Konsole aktivieren:

```js
window.__TC_DEBUG_LINE_SECTION__ = true
```

Dann Markieren/Accordion testen.

## Erwartung

Pro Klick sollte genau eine Sequenz erscheinen:
- `handle`
- `load:start` oder `toggle:start`
- `load:select` / `load:deselect`
- `handled`

Falls zwei Sequenzen erscheinen, ist der Event-Pfad weiterhin doppelt.
Falls eine Sequenz erscheint und die UI trotzdem zurückspringt, liegt der Fehler im Render-/State-Zyklus.

## Spacing

Regenwasser/Schmutzwasser Spalten wurden mit `tc-module-column` normalisiert.
Globale 10px-Gap-Regeln für Modulspalten wurden ergänzt.
