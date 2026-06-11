# Phase 28A.2 – Platform Scroll Service

## Ziel

Phase 28A.2 fuehrt den expliziten PlatformScrollManager-Vertrag ein. Bestehende Scroll-Stabilisierung bleibt kompatibel, wird aber um eine servicefaehige API erweitert.

## Neuer Service-Vertrag

Datei: `js/core/scrollManager.js`

Neue beziehungsweise explizit standardisierte API:

- `capturePosition(scope = window)`
- `restorePosition(snapshot, options)`
- `freeze(reason)`
- `unfreeze(token, options)`
- `isScrollFrozen()`
- `runWithoutScrollJump(action, options)`
- `preserveModuleSwitchScroll(action, options)`
- `PlatformScrollManager`

Bestehende API bleibt erhalten:

- `preserveScroll()`
- `preserveActionScroll()`
- `preserveSavedRecordScroll()`

## Kapselung

Der direkte Modul-Scrollzugriff im Trinkwasser-Controller wurde ueber `runWithoutScrollJump()` gekapselt. Damit befinden sich direkte Scroll-Schreibzugriffe nicht mehr in Modulen, sondern nur noch in Core-Infrastruktur.

## Ergebnis

- P0: keine
- P1: keine
- P2: Focus-Service-Follow-up fuer Phase 28B

Phase 28A.2 ist damit als Scroll-Service-Baseline abgeschlossen.
