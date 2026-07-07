# Phase 36T.6 – Rainwater Dynamic Wrapper Stack

## Problem
Nach 36T.5 waren die inneren Abstände etwas besser, aber die Abstände zwischen den einzelnen Regenwasser-Teilcards blieben falsch.

## Ursache
Die äußeren Spalten nutzen `stack()`, aber der komplette Regenwasser-Formbereich steckt in einem einzigen Wrapper:

```html
<div data-rw-dynamic="form">...</div>
```

Dieser Wrapper enthält mehrere Cards, war selbst aber kein Stack. Dadurch konnte der globale Spalten-Gap nur zwischen `form-wrapper` und Speicher-Card wirken, nicht zwischen den Cards innerhalb des Form-Wrappers.

Dasselbe gilt für:

```html
<div data-rw-dynamic="result">...</div>
```

## Fix
Die Dynamic-Wrapper verwenden jetzt globale Plattform-Primitive:

```html
<div class="tc-stack" data-rw-dynamic="form">...</div>
<div class="tc-stack" data-rw-dynamic="result">...</div>
```

## Wichtig
- Keine Rainwater-CSS-Sonderregel
- Keine neue Modul-Ausnahme
- Keine Berechnungslogik geändert
- Kein Saved-Record-Pfad geändert

Der Fix folgt dem Plattformstandard: Wrapper, die mehrere Cards enthalten, müssen selbst ein Stack sein.
