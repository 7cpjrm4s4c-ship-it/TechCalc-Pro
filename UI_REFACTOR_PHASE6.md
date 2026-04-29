# TechCalc Pro — UI Refactoring Phase 6

## Ziel
Phase 6 konsolidiert die zentrale UI-Schicht und verschiebt die App weiter weg von modulbezogenen Korrekturregeln. Die Legacy-CSS-Dateien bleiben noch geladen, verlieren aber im App-Scope stärker an Gestaltungshoheit.

## Umgesetzt

### 1. Stärkerer App-Scope
`body.tc-app` ist jetzt die verbindliche Kaskadengrenze für App-UI. Zentrale Regeln wirken nur innerhalb der App und kollidieren weniger mit PDF-/Print-Layout.

### 2. Verbindlicher Layout-Vertrag erweitert
Ergänzt in `style.css`:

- `.tcp-layout`
- `.tcp-col`
- `.tcp-stack`
- `.tcp-grid-2`, `.tcp-grid-3`, `.tcp-grid-4`
- `.tcp-control-row`
- `.tcp-select-compact`
- `.tcp-round-btn`
- `.tcp-sign-btn`
- `.tcp-separator-row`
- `.tcp-result-metric`, `.tcp-result-label`, `.tcp-result-number`, `.tcp-result-unit`
- `.tcp-state-box`

Damit sind die bisherigen wiederkehrenden Inline-Muster als zentrale UI-Sprache abbildbar.

### 3. Desktop/Mobile klarer getrennt
Desktop nutzt für Modul-Tabs mit `.tcp-col` strikt ein zweispaltiges Raster. Mobile wird automatisch zur einspaltigen Stack-Darstellung. Neue Module benötigen keine eigenen Breakpoints.

### 4. Legacy bleibt nur Fallback
`layout.css` und `components.css` werden noch nicht entfernt, weil sie weiterhin ältere Moduldetails tragen. Phase 6 stellt aber klar: neue oder refactorte Bereiche sollen ausschließlich `tcp-*` verwenden.

### 5. Print/PDF-Schutz nachgezogen
Navigation, Install-Banner, Toasts und Screen-only-Elemente werden im Print-Kontext sicher ausgeblendet. App-Layoutregeln werden für den Druck zurückgenommen.

## Prüfhinweise
Bitte visuell prüfen:

1. Desktop: gleiche obere Abstände in Lüftung, h,x, Trinkwasser, MAG, Entwässerung.
2. Mobile: Bottom-Pill bleibt unten und überlagert keine Ergebnisfelder.
3. Einheiten: Eingabe-/Ergebnisblock bleibt zentriert und skaliert korrekt.
4. PDF: Header, Tabs und Install-Banner erscheinen nicht im Export.
5. Neue Modulstruktur: `.tcp-module > .tcp-layout > .tcp-col` erzeugt ohne Sonderregeln das gewünschte Layout.

## Nächster sinnvoller Schritt
Phase 7 sollte gezielt `layout.css` und `components.css` auf tatsächlich noch benötigte Selektoren reduzieren. Danach kann die Legacy-Brücke entfernt werden.
