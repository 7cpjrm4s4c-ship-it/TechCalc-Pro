# Phase 36U.2B – Wastewater CSS Consolidation

## Ziel
Doppelte und konkurrierende Schmutzwasser-Collection-Regeln konsolidieren.

## Umsetzung
- konkurrierende `.wastewater-fixture-row--editable` / `.tc-collection-row.tc-consumer-row--editable` Grid-Regeln entfernt
- alte fixe Quantity-/Button-Breiten entfernt
- zentralen globalen Collection-Row-Contract ergänzt
- `.wastewater-subselect { gap: 8px; }` auf `var(--tc-gap)` umgestellt

## Zentraler Contract
```css
:root {
  --tc-collection-quantity-width: 96px;
  --tc-collection-action-width: 42px;
  --tc-collection-action-height: 34px;
}
```

## Nicht geändert
- Keine JavaScript-Änderungen
- Keine View-Struktur-Änderungen
- Keine Collection-Action-Verträge
- Keine Berechnungslogik
