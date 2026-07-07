# Phase 36Q.1 – Remove Dynamic Display Contents

## Änderung
Der Phase-36P-Eingriff wurde entfernt:

```css
[data-rw-dynamic],
[data-ww-dynamic] {
  display: contents;
}
```

Der zugehörige Sonderblock für einzelne Dynamic-Wrapper wurde ebenfalls entfernt.

## Grund
`display: contents` entfernt die Dynamic-Wrapper aus dem Layout-Baum. Dadurch können globale Stack-/Card-Abstände nicht mehr konsistent greifen.

## Nicht geändert
- Keine View-Änderungen
- Keine Result-Renderer-Änderungen
- Keine Saved-Record-Änderungen
- Kein Eingriff in `lineSectionController`
