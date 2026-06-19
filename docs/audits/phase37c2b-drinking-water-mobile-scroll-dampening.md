# Phase 37C.2B — Drinking-Water Mobile Scroll Restore Dampening

## Ziel

Mobile-only Scroll-Rücksprünge im Trinkwasser-Modul nach 37C.2A entschärfen, ohne die ThemeController-Extraktion zurückzunehmen.

## Befund

Das Trinkwasser-Modul nutzte aggressivere Scroll-Restore-Parameter als die übrigen Module (`frames: 12/14` und Delays bis `800/820 ms`). Auf Mobilgeräten konnte dieser verzögerte Restore während einer aktiven Fingerbewegung die Scrollposition wieder auf den Ausgangszustand setzen.

## Änderung

- `scrollManager.runWithoutScrollJump()` erhält die optionale Guard-Option `skipDuringActiveTouch`.
- Der ScrollManager erkennt aktive `touchstart`/`touchmove`-Phasen und unterdrückt Restore-Schreibzugriffe während aktiver Touch-Interaktion.
- Trinkwasser nutzt reduzierte Restore-Parameter: `frames: 2`, `delays: [0, 40, 100]`.
- Alle Trinkwasser-Restore-Pfade optieren in `skipDuringActiveTouch: true` ein.

## Scope

Keine Fachlogikänderung, keine Theme-Rücknahme, keine Änderung an anderen Modul-Controllern.

## Guard

`test:phase37c2b` prüft die reduzierten Trinkwasser-Restore-Parameter und den aktiven Touch-Guard im ScrollManager.
