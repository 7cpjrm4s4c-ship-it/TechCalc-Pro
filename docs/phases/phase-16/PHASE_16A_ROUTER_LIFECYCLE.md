# Phase 16A – Router & Lifecycle Konsolidierung

Phase 16A verschiebt den eigentlichen Modulwechsel in eine zentrale Runtime.
Der Router entscheidet nur noch, welches Modul aktiv werden soll. Die Runtime
führt den verbindlichen Lifecycle aus:

1. `beforeUnmount`
2. `unmount`
3. `prepareMount`
4. `mount`
5. `afterMount`

Damit wird der Modulwechsel von UI-Markierung, Hash/History und einzelnen
Modul-Renderern entkoppelt. Module dürfen weiterhin ihre bestehende `mount()`
Funktion liefern, werden aber zentral in denselben Ablauf gezwungen.

## Zielzustand

Module sollen perspektivisch keine eigenen Router-, Navigation- oder Mount-
Sonderpfade mehr besitzen. Die App übernimmt:

- Router
- Navigation
- Lifecycle
- Loading-State
- Cleanup
- DOM-Cache-Reset
- Mount-Timeout
- Nav-Aktualisierung nach erfolgreichem Mount

## Übergangsregel

Legacy-Module bleiben lauffähig, werden aber durch die zentrale Runtime
normalisiert. Beim späteren Modulumbau kann derselbe Lifecycle-Vertrag genutzt
werden, ohne neue Sonderregeln pro Modul einzuführen.
