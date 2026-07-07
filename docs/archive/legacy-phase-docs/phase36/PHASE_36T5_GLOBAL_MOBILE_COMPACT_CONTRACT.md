# Phase 36T.5 – Global Mobile Compact Contract

## Ziel
Die äußeren Card-Abstände sind korrekt. Die verbleibenden zu großen Abstände entstehen innerhalb dichter Formular- und Ergebnis-Cards, besonders mobil.

## Umsetzung
Globaler Mobile-Compact-Contract in `css/components.css`:

- `.field`, `.tc-field`, `.settings-field`: reduzierter Label-Control-Abstand
- `.form-grid`, `.tc-fields`, `.card__body`, `.result-card__body`: kompakterer interner Grid-Gap
- `.result-list`, `.tc-result-list`: kompakterer Zeilen-Gap
- `.result-row`: `min-height: 0`, kompakterer Gap, `padding: 0`
- `.main-result`, `.inline-stat`, `.tc-result-item`: kompakteres Padding

## Wichtig
Kein Regenwasser-Sonderfix. Die Regel ist global und gilt für alle Module am Mobile-Breakpoint.

## Nicht geändert
- keine JavaScript-Änderungen
- keine View-Struktur-Änderungen
- keine Saved-Record-Pfade
- keine Berechnungslogik
