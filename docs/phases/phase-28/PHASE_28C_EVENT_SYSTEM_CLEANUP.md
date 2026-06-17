# Phase 28C - Event System Cleanup

## Ziel

Phase 28C härtet das plattformweite Event-System. Globale Listener werden inventarisierbar, Event-Scopes erhalten einen einheitlichen Cleanup-Vertrag und Delegation läuft über dieselbe zentrale Infrastruktur.

## Änderungen

- `js/core/eventManager.js` eingeführt
- `trackGlobalEventListener()` für globale App-Listener eingeführt
- `createEventScope()` für Lifecycle-Cleanup eingeführt
- `eventDelegation.js` an den Event Manager angebunden
- Audit-Script `scripts/audit-event-system-phase28c.mjs` ergänzt
- Test `tests/platform-event-system-phase28c.test.mjs` ergänzt

## Architekturvertrag

Neue Event-Pfade sollen bevorzugt über eine dieser APIs laufen:

```js
on(target, eventName, handler, options)
createEventScope(name)
trackGlobalEventListener(target, eventName, handler, options)
```

Direkte `window.addEventListener()` und `document.addEventListener()` sind nur noch für bewusst begründete Legacy- oder Browser-Sonderfälle zulässig.

## Ergebnis

- P0: keine
- P1: keine
- P2: verbleibende Legacy-DOM-Listener in späteren Cleanup-Phasen weiter standardisieren
- Score: 4.82 / 5
- Grade: A
