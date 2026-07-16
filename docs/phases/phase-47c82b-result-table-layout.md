# Phase 47C.8.2B – Einheitliche Tabellen-Layouts

## Ziel

Alle Ergebnisgruppen verwenden denselben zentralen Tabellenvertrag. Fachlogik, Ergebniswerte und Reihenfolge bleiben unverändert.

## Zentraler Contract

- einheitliche Mindestzeilenhöhe über `--tc-result-row-min-height`
- einheitliches vertikales Padding über `--tc-result-row-padding-block`
- identische Label-/Wertspalten über `--tc-result-label-column`
- identische Trennlinien über `--tc-result-row-divider`
- rechtsbündige Werte mit tabellarischen Ziffern
- Einheiten bleiben beim Zahlenwert
- erste und letzte Zeile vermeiden doppelte Außenabstände
- mobile Darstellung wechselt auf eine überlagerungsfreie Einspaltenstruktur

## Spezialisierte Ergebnisgruppen

Die Ergebnisgruppen „Planerische Interpretation“ und „Nachweisstatus“ behalten ihre freigegebene feste Labelspalte von 200 px. Sie nutzen weiterhin dieselben Zeilenhöhen, Innenabstände, Trennlinien und Wertausrichtungen des zentralen Contracts.

## Abnahme

- alle Ergebnislisten werden durch den zentralen Result Renderer als `result-list` und `result-row` ausgegeben
- keine neue Modul-Sonderkomponente
- keine Änderung an Berechnung oder Result Model
- Desktop und Mobile besitzen deterministische Tabellengeometrien
- Regressionstest ist im Gate `npm run test:flooding` registriert
