# Phase 28A.1 - Scroll Audit & Scroll Manager Design

## Ziel

Phase 28A.1 inventarisiert alle plattformweiten Scroll- und fokusnahen Scroll-Risiken. Diese Phase aendert keine Runtime-Logik. Sie legt den Zielvertrag fuer Phase 28A.2 fest.

## Ergebnis

- P0: keine
- P1: direkte Modul-Scrollschreibzugriffe kapseln
- P2: Fokusaufrufe ohne `preventScroll` fuer Phase 28B vormerken
- P2: Hash-/Deep-Link-Navigation gegen unbeabsichtigte Scrollspruenge absichern

## Erzeugte Artefakte

- `scripts/audit-scroll-infrastructure-phase28a1.mjs`
- `tests/platform-scroll-audit-phase28a1.test.mjs`
- `platform-scroll-audit-phase28a1.json`

## Zielvertrag fuer 28A.2

Der bestehende `js/core/scrollManager.js` wird in Phase 28A.2 zum expliziten `PlatformScrollManager` erweitert.

Geplante API:

```js
capturePosition(scope = window)
restorePosition(snapshot, options)
freeze(reason)
unfreeze(token)
runWithoutScrollJump(action, options)
preserveSavedRecordScroll(action, options)
preserveModuleSwitchScroll(action, options)
```

## Akzeptanzkriterien 28A.2

- Record-Auswahl verursacht keinen Scrollsprung.
- Record-Abwahl verursacht keinen Scrollsprung.
- Live-Render bleibt scrollstabil.
- Modulwechsel kann eine definierte Scrollstrategie anwenden.
- Direkte Scrollschreibzugriffe in Modulen sind inventarisiert oder gekapselt.
