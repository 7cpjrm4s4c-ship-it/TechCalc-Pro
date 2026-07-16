# Phase 47C.7F – Regressionstestpaket

## Ziel

Phase 47C.7F bündelt sämtliche automatisierten Tests des Überflutungsnachweises in einem verbindlichen Modul-Gate. Das Gate verhindert, dass spätere Änderungen einzelne Fachpfade unbemerkt entkoppeln.

## Verbindlicher Aufruf

```bash
npm run test:flooding
```

Der vollständige Build-Verify-Pfad führt das Gate ebenfalls aus:

```bash
npm run build:verify
```

Zusätzlich ist es Bestandteil von `npm run test:integration`.

## Abgedeckte Bereiche

- Flächenverwaltung und State v2
- Projektpersistenz
- Regenwerte und automatische Regendauer
- Leitungs- und Abflussnachweis
- DIN 1986-100 Gleichungen (20) und (21)
- DWA-A 117 Berechnungskern
- DWA-A-117-Anwendungsprüfung
- automatische Faktoren fz und fA
- automatische Übernahme von r(D,2)
- Dauerstufenvergleich
- gemeinsames Bemessungsvolumen
- Regenwasser-Snapshot-Upsert
- zentrale Result-Priorisierung
- Diagnosemodell
- planerische Interpretation
- fachliche Plausibilitätsprüfung
- plattformkonforme UI-Verträge

## Cross-Layer-Regression

`flooding-verification-phase47c7f-regression-gate.test.mjs` prüft zusätzlich den vollständigen Pfad:

1. Eingabe-State
2. Calculation Adapter
3. DIN- und DWA-Ergebnisse
4. Combined Storage Model
5. Result Model
6. Diagnose und Plausibilitätsstatus

Dabei werden deterministische Wiederholbarkeit, Aktualisierung nach Flächenänderungen, konsistente Fehlerfortpflanzung und der Vorrang projektspezifischer DWA-Regenspenden geprüft.

## Gate-Regel

Ein fehlgeschlagener Test im Modul-Gate blockiert Integration und Build-Verifikation. Einzeltests dürfen nicht aus dem Register entfernt werden, ohne Contract-, Audit- und Phasendokumentation anzupassen.

## Abgrenzung

Manuelle Browser-, Offline-, PDF- und behördliche Fachabnahmen bleiben zusätzliche Quality Gates. Das automatisierte Regressionstestpaket ersetzt diese Abnahmen nicht.
