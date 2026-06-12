# Phase 34B - Components CSS Rebuild

## Ziel

`css/components.css` wurde von einem historisch gewachsenen Patch-Stack zu einer kompakten, globalen Komponentenbasis zurückgebaut.

## Ergebnis

- `components.css` von 5027 auf 747 Zeilen reduziert.
- `!important` in `components.css` von 30 auf 0 reduziert.
- Doppelte Selektoren in `components.css` entfernt.
- Globale Primitives zentralisiert:
  - `.card` / `.tc-card`
  - `.field` / `.tc-field`
  - `.control` / `.tc-control`
  - `.segmented`
  - `.result-row`
  - `.inline-stat`
  - `.saved-record-card`
  - `.settings-panel`
  - `.tc-collection-row`
- Modul-spezifische Layout-Ausnahmen nach `css/modules.css` isoliert.
- Vorheriger Stand archiviert unter `docs/audits/css/components-phase34a-before-rebuild.css`.

## Architekturentscheidung

`components.css` enthält nur noch wiederverwendbare UI-Komponenten. Modulklassen wie `hx-*`, `wrg-*`, `pipe-*`, `wastewater-*`, `rainwater-*` und `buffer-*` werden in `modules.css` geführt, solange sie nicht vollständig in `tc-*` Primitives migriert sind.

## Quality Gate

- `npm run build` OK
- `npm run audit:imports` OK
- `npm run audit:css` OK
- `npm run test:phase34b` OK
- `npm test` OK

## Hinweis

Die Phase beseitigt strukturelle CSS-Schulden, ersetzt aber keinen visuellen manuellen Browser-Retest. Nach diesem Rebuild sollte Phase 34C als modulweiser UI-Retest gegen die 10px-Abstandslogik folgen.
