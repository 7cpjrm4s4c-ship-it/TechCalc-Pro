# Phase 17C.9 - SavedRecord-Vertrag wie Heizung/Kälte

## Ziel

Regenwasser und Schmutzwasser verwenden fuer gespeicherte Eintraege denselben Interaktionsvertrag wie das funktionierende Modul Heizung/Kälte.

## Ursache

Die bisherigen Plattform-Fixes haben den SavedRecord-Pfad mehrfach ueber die zentrale Event-Pipeline und spaeter ueber Bridge-/Context-Mechanismen abgefangen. Dadurch konnten Markieren, Bearbeiten, Accordion und Loeschen je nach Event-Reihenfolge blockiert werden.

## Umsetzung

- `platform/moduleRuntime` bindet SavedRecords jetzt ueber einen direkten Root-Capture-Listener wie Heizung/Kälte.
- Die Attribute bleiben exakt im Heizung/Kälte-Stil:
  - `data-line-select`
  - `data-line-toggle`
  - `data-line-delete`
- Regenwasser und Schmutzwasser enthalten keine lokalen SavedRecord-Patches.
- Die alte SavedRecord-Bridge wurde entfernt.
- Der zentrale SavedRecord-Context wird nicht mehr als Event-Interceptor verwendet.
- Save, Update, Load, Deselect, Toggle und Delete schreiben direkt in den Store ueber den zentralen Reducer.

## Regenwasser-Switch

Der Berechnungsbereich wird weiterhin ueber die Plattform-Segmentsteuerung verarbeitet. Nach dem State-Patch wird ein synchroner `flushNow()` ausgefuehrt, danach folgen Microtask- und Timeout-Fallbacks fuer mobile Browser. Dadurch werden die Eingabebezeichnungen fuer `r(5,5)` / `r(5,2)` sofort neu aufgebaut.

## Regression

Neu:

- `tests/reference-modules-phase17c9-heating-saved-contract.test.mjs`

Erweitert:

- `scripts/quality-gate.mjs`

## Erwartetes Verhalten

- Schmutzwasser: gespeicherte Eintraege lassen sich markieren, bearbeiten, auf-/zuklappen und loeschen.
- Regenwasser: gespeicherte Eintraege lassen sich markieren, bearbeiten, auf-/zuklappen und loeschen.
- Regenwasser: Wechsel Dachflaeche/Grundstuecksflaeche aktualisiert die Regenspende-Beschriftung sofort.
