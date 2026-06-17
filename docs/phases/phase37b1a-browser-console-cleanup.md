# Phase 37B.1A — Browser Console Cleanup

## Ziel

Phase 37B.1A schliesst die ersten realen Browser-Runtime-Befunde aus der Netlify/Edge-Konsole nach Phase 37B.1.

Zielzustand:

- kein `ReferenceError: cssEscape is not defined` mehr im Viewport-/Renderer-Pfad
- kein ungefangener DOM-Replacement-Race bei dynamischen Drinking-Water-Islands
- keine Feature-Aenderung, nur Runtime-Hardening

## Befund

Die Browser-Konsole zeigte reproduzierbar:

- `Uncaught ReferenceError: cssEscape is not defined` in `js/core/renderer.js`
- `Failed to set the 'innerHTML' property on 'Element': The node to be removed is no longer a child of this node` in `js/core/domUpdate.js`

Die Fehler betrafen insbesondere:

- `getStableSelector()`
- `getAnchorSnapshot()`
- `snapshotViewport()`
- `safeReplaceContent()`
- Drinking-Water Dynamic Refresh

## Umsetzung

### 1. Renderer cssEscape Guard

`js/core/renderer.js` definiert jetzt eine lokale `cssEscape()` Utility.

Verhalten:

- nutzt `window.CSS.escape`, wenn im Browser vorhanden
- nutzt einen Fallback fuer nicht native Umgebungen
- stabilisiert Selektoren fuer Viewport-/Scroll-Snapshots

Damit ist der direkte ReferenceError geschlossen.

### 2. safeReplaceContent Reentrancy Guard

`js/core/domUpdate.js` wurde gegen Browser-Races gehaertet:

- skippt entfernte Roots (`root.isConnected === false`)
- verhindert reentrant replacements mit `__tcReplacingContent`
- faengt den beobachteten Browser-DOM-Race gezielt ab
- laesst alle nicht erwarteten Fehler weiter eskalieren

Wichtig: Der Catch ist absichtlich eng auf `NotFoundError` bzw. die beobachtete Meldung `no longer a child` begrenzt.

## Validierung

Ausgefuehrt:

```bash
npm run test:phase37b1a
npm run build
npm run test:phase37b1
npm run test:module-smoke
```

Ergebnis:

- Build: ok
- Phase 37B.1A Guard: ok
- Phase 37B.1 Preflight: ok / environment-blocked fuer vollstaendiges Playwright
- Module Smoke: 11/11 pass

## Bewertung

Phase 37B.1A ist ein P1 Runtime-Hardening. Die App-Logik wurde nicht veraendert. Der Fix adressiert direkt die vom Browser gemeldeten Fehlerpfade.

Nach Deployment muss die Netlify/Edge-Konsole erneut geprueft werden. Ziel:

- 0 `cssEscape` ReferenceErrors
- 0 `innerHTML` NotFound DOM Exceptions
