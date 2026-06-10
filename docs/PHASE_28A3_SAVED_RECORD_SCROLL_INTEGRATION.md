# Phase 28A.3 - Saved Records Scroll Integration

## Ziel

Saved-Record-Interaktionen werden zentral ueber den `PlatformScrollManager` gegen Scrollspruenge abgesichert.

## Umfang

Betroffene Interaktionen:

- Record laden / auswaehlen
- Record abwaehlen / Edit-Mode-Clear
- Record loeschen
- Record aktualisieren
- Record expandieren / kollabieren

## Umsetzung

- `preserveSavedRecordMutation()` im `js/core/scrollManager.js` ergaenzt.
- `js/core/savedRecords.js` von direktem `preserveViewport()` auf den Scroll-Service umgestellt.
- DOM-basierte Toggle-Aktionen werden mit Scroll-Snapshot ausgefuehrt.
- Controller-basierte `toggle-expanded`-Aktionen werden ebenfalls ueber den Saved-Record-Scrollvertrag gefuehrt.

## Nicht geaendert

- Keine fachliche Saved-Record-Logik geaendert.
- Keine Renderer-Semantik geaendert.
- Keine neuen Modul-Sonderfaelle eingefuehrt.

## Validierung

- `npm run audit:scroll-saved-records`
- `npm run test:platform-scroll-phase28a3`
- Syntaxcheck der geaenderten Core-Dateien
