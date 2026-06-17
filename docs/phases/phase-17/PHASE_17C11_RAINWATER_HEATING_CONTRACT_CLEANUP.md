# Phase 17C.11 - Regenwasser SavedRecord / Dynamic Update Cleanup

## Ziel

Regenwasser wird beim Speichern und beim Wechsel Dachflaeche / Grundstuecksflaeche auf denselben stabilen Vertrag gebracht, der bei Heizung/Kaelte und Schmutzwasser funktioniert.

## Ursache

Regenwasser hatte noch zwei alte Sonderpfade:

- eigene flache `surfaceRecordSnapshot()`-Struktur statt Plattform-State-Record `{ name, state, result }`
- eigener DOM-Patch fuer `surfaceMode` (`patchSurfaceModeDom`) statt reinem Schema-Rebuild

Dadurch sah der Speicherbereich zwar korrekt aus, aber der gespeicherte Eintrag lief nicht ueber denselben Record-Vertrag wie die funktionierenden Module. Der Switch setzte den State, benoetigte aber teilweise eine weitere Eingabe, bis die sichtbaren Felder neu aufgebaut wurden.

## Umsetzung

- `controller.js`
  - `surfaceRecordSnapshot()` nutzt jetzt `createStateSnapshot()`
  - `hydrate()` nutzt jetzt `hydrateStateRecord()`
  - `patchSurfaceModeDom` entfernt
  - `segments.fields.surfaceMode.domPatch` entfernt

- `logic.js`
  - `surfaceRows()` akzeptiert jetzt neue Plattform-Records mit `item.state`
  - Rueckwaertskompatibilitaet fuer alte flache Surface-Records bleibt erhalten

- Tests
  - Neue Regression `rainwater-phase17c11-heating-contract.test.mjs`
  - Quality Gate erweitert

## Ergebnis

- Regenwasser-Speichern nutzt denselben Record-Vertrag wie Schmutzwasser/Heizung-Kaelte
- Switch Dachflaeche / Grundstuecksflaeche laeuft ohne Modul-DOM-Patch ueber State + Schema-Rebuild
- keine konkurrierenden `saved:add` / `saved:update` / `data-saved-*` Pfade in Regenwasser/Schmutzwasser
