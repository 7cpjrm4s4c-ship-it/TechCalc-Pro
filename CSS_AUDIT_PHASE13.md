# CSS Audit – Phase 13

## Status
Phase 13 setzt eine neue finale UI-Klammer `body.tc-app.tc-ui-v13` über den vorhandenen Stand. Damit werden ältere Legacy-Regeln weiterhin als Fallback akzeptiert, aber die aktive Darstellung orientiert sich an der zentralen v13-Schicht.

## Zentralisierte Bereiche
- Shell-Abstände zum Header
- Desktop-Zwei-/Drei-Spalten-Raster
- Mobile Ein-Spalten-Darstellung
- Card-Padding und Card-Radius
- Eingabefeldhöhe und Fokus-Ring
- Ergebniszeilenhöhe und Label/Wert-Ausrichtung
- Modul-Akzentvariablen
- Mobile Bottom-Navigation
- Print/PDF-Schutz

## Offene Punkte für Phase 14
- Dead-Code-Entfernung in Alt-CSS-Schichten.
- Entscheidung, ob `styles.css` und `components.css` vollständig in `style.css` integriert werden.
- Letzte manuelle Prüfung auf Inline-Styles in `index.html`.
- Finaler Vergleich Desktop/Mobile pro Modul.
