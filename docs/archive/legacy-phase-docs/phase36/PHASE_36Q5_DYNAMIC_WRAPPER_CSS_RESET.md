# Phase 36Q.5 – Dynamic Wrapper CSS Reset

## Basis
36R

## Änderung
Reiner CSS-Fix in `css/components.css`.

### Vollständiger Wrapper-Reset
Alle tatsächlich genutzten Regenwasser-/Schmutzwasser-Dynamic-Wrapper werden explizit als Block-Elemente geführt:

```css
[data-rw-dynamic="form"],
[data-rw-dynamic="result"],
[data-ww-dynamic="usage"],
[data-ww-dynamic="line-fields"],
[data-ww-dynamic="fixture-inputs"],
[data-ww-dynamic="fixtures"],
[data-ww-dynamic="additional-flows"],
[data-ww-dynamic="result"] {
  display: block;
  min-width: 0;
}
```

### Bereinigung
Alte tote Selektoren entfernt:

```css
[data-rainwater-dynamic]
[data-wastewater-dynamic]
```

## Nicht geändert
- Keine JavaScript-Änderungen
- Keine View-Struktur-Änderungen
- Keine Saved-Record-Änderungen
- Keine h,x-/Trinkwasser-Navigation geändert
