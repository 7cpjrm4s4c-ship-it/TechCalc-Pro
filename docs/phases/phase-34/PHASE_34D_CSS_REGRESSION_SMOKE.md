# Phase 34D – CSS Regression Smoke

## Ziel

Nach dem Rebuild von `components.css` und der Isolation von `modules.css` wird geprüft, ob der neue globale Komponentenlayer releasefähig bleibt.

## Prüfgegenstand

- CSS-Ladereihenfolge: `tokens.css` -> `layout.css` -> `components.css` -> `modules.css`
- 10px-Geometrievertrag in `tokens.css`
- globale Komponenten in `components.css`
- `modules.css` nur als Exception-Layer
- alle 11 Module weiterhin vorhanden
- keine `!important`-Overrides in `components.css`/`modules.css`
- Größenbudget nach Rebuild

## Ergebnis

| Check | Ergebnis |
|---|---:|
| Module | 11/11 |
| `components.css` | < 1000 Zeilen |
| `modules.css` | < 300 Zeilen |
| `!important` in `components.css`/`modules.css` | 0 |
| CSS-Ladereihenfolge | OK |
| Globale Komponenten | OK |
| Module-Exception-Layer | OK |

## Artefakte

- `scripts/audit-css-regression-smoke-phase34d.mjs`
- `tests/phase34d-css-regression-smoke.test.mjs`
- `docs/audits/css/phase34d-css-regression-smoke.json`

## Entscheidung

Phase 34D bestätigt den technischen CSS-Regressionsstand nach 34B/34C. Der nächste sinnvolle Schritt ist eine manuelle visuelle Modulprüfung gegen die 10px-Abstandslogik, da statische Tests keine pixelgenaue Bewertung der tatsächlichen Browserdarstellung ersetzen.
