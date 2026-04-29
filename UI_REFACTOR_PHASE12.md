# UI Refactor Phase 12

## Ziel
Phase 12 konsolidiert den zentralen `tc-ui-v12` UI-Vertrag als robuste Weiterführung von Phase 11.

## Änderungen
- Neue Kaskadenschicht `tc-ui-v12` im `body`.
- Zentrale Shell-Abstände für Header, Desktop und Mobile.
- Einheitliche Card-, Grid-, Input- und Result-Rhythmik.
- Modul-Akzente zentral erweitert: Heizung/Kälte, Lüftung/WRG, Einheiten, h,x, Trinkwasser, MAG, Entwässerung.
- Mobile Bottom-Navigation gegen Layout-Verschiebungen gehärtet.
- Print/PDF-Ausblendungen nochmals zentral abgesichert.

## Erwartete Wirkung
Neue Module sollen nur noch die Vertragsklassen `tcp-module`, `tcp-layout`, `tcp-card`, `tcp-result-row` und eine Modul-Akzentklasse benötigen. Separate Layout-Abstimmungen pro Modul werden weiter reduziert.
