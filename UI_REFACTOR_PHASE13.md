# TechCalc Pro UI Refactor – Phase 13

## Ziel
Finale Bereinigung vor dem Production-Hardening. Phase 13 stabilisiert den zentralen UI-Vertrag weiter und macht die App-Struktur bereit für die abschließende Audit-/Release-Runde.

## Änderungen
- Neue Kaskadenschicht `tc-ui-v13` ergänzt.
- `index.html` auf `tc-ui-v13` erweitert.
- Zentrale Modulcontainer für Heizung/Kälte, Lüftung, Einheiten, h,x, Trinkwasser, MAG und Entwässerung weiter vereinheitlicht.
- Einheitliche Spalten-, Card-, Input- und Result-Regeln nochmals gehärtet.
- Desktop-Grid und Mobile-Stacking auf verbindliche `tcp-*`-Regeln fokussiert.
- Bottom-Navigation auf Mobile gegen Transform-/Positionierungsdrift abgesichert.
- Print/PDF-Ausblendung für App-Navigation und Overlays weiter abgesichert.

## Wichtig
Diese Phase ist bewusst konservativ: bestehende Modul-Logik bleibt unverändert. Es wurden keine Berechnungsfunktionen refactored, sondern ausschließlich UI-Vertrag, CSS-Kaskade und Paketstruktur stabilisiert.
