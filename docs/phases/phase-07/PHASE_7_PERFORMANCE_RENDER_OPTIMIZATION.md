# Phase 7 – Performance und Render-Optimierung

## Ziel

Phase 7 reduziert unnötige Re-Renders, DOM-Schreibzugriffe, Scroll-Korrekturen und CSS-Spezifitäts-Overrides. Die Plattform soll Eingaben, gespeicherte Inhalte und Modulwechsel stabiler behandeln, ohne dass einzelne Module eigene Workarounds benötigen.

## Neue zentrale Bausteine

- `js/core/renderScheduler.js`
  - bündelt State-Änderungen pro Animation Frame
  - verhindert Render-Stürme bei schnellen Eingaben oder mehreren State-Patches
  - stellt `flushNow` für Initial-Render bereit

- `js/core/domUpdate.js`
  - `safeReplaceContent` ersetzt HTML nur, wenn sich der Inhalt tatsächlich geändert hat
  - erhält Fokus und Cursorposition bei stabilen Eingabefeldern
  - reduziert unnötige DOM-Neuaufbauten

- `js/core/eventDelegation.js`
  - zentrale Event-Delegation für künftige Modulmigrationen
  - reduziert viele Einzel-Listener in dynamischen Listen

## Umgesetzte Änderungen

- `mountModule` nutzt jetzt den zentralen `renderScheduler`.
- Full-Render werden über `safeReplaceContent` stabilisiert.
- Scroll-Restore wurde von aggressiven Mehrfachkorrekturen auf kurze, gezielte Korrekturen reduziert.
- Trinkwasser und h,x wurden von direkten Modul-`innerHTML`-Writes auf `safeReplaceContent` umgestellt.
- Module haben laut Audit keine direkten DOM-Full-Writes mehr.
- `!important` in CSS wurde deutlich reduziert.

## Quality Gates

Neue Audits:

```bash
npm run audit:important
npm run audit:render
```

`npm test` prüft jetzt zusätzlich:

- Budget für `!important`
- direkte DOM-Schreibzugriffe in Modulen
- bestehende Plattform-, Modulvertrag- und Number-Service-Regressionen

## Ergebnis Phase 7

- Direkte Modul-DOM-Writes: `0`
- `!important`-Budget: unter Limit
- Quality Gate: erfolgreich

## Noch offen

Die nächsten Performance-Schritte sollten nicht blind weiter optimieren, sondern gezielt per Test/Profiling erfolgen:

1. Trinkwasser vollständig auf Event-Delegation migrieren.
2. Doppelte CSS-Selektoren konsolidieren.
3. Legacy-Modulklassen weiter durch `.tc-*` ersetzen.
4. Größere Listen perspektivisch virtuell oder inkrementell rendern.
