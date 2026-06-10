# Phase 17C – Referenzmodule Bugfix-Stabilisierung

## Ziel

Regenwasser und Schmutzwasser sind die ersten Plattform-Referenzmodule. Phase 17C stabilisiert deshalb gemeinsame Fehlerklassen zentral in der Plattform, bevor weitere Module migriert werden.

## Umgesetzt

### Zentrale Zahlen-Normalisierung

`platform/moduleRuntime` erzeugt jetzt einen normalisierenden State-Adapter. Module deklarieren nur noch `controller.normalizeFields`; die Plattform normalisiert diese Felder vor jedem `state.set`, `state.update` und `state.replace`.

Damit werden deutsche Eingaben wie `2.500` oder `1.250` nicht mehr als Dezimalwerte fehlinterpretiert, sondern als `2500` beziehungsweise `1250` verarbeitet.

### Regenwasser

Das Regenwasser-Modul nutzt jetzt denselben Plattformmechanismus über:

```js
normalizeFields: [...surfaceNumericFields]
```

Damit werden Flächengrößen, Regenspenden, Ablaufleistungen und Notentwässerungswerte zentral behandelt.

### Schmutzwasser

Schmutzwasser nutzt weiterhin:

```js
normalizeFields: [...numericFields]
```

Die Normalisierung wird nun tatsächlich von der Plattform-Runtime angewendet.

## Regression

Neue Regression:

```text
tests/reference-modules-phase17c-bugfix.test.mjs
```

Prüft:

- Regenwasser `areaSize = 2.500` bleibt rechnerisch `2500 m²`
- Regenwasser Dezimalkomma bleibt erhalten
- Schmutzwasser `pipeLengthM = 1.250` wird `1250`
- Schmutzwasser Dezimalkomma bleibt erhalten
- beide Referenzmodule deklarieren ihre numerischen Felder für die Plattform

## Ergebnis

`npm test` erfolgreich.

