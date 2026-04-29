# TechCalc Pro — UI Refactoring Stufe 1

## Geändert
- Neue zentrale App-UI-Datei `style.css` erstellt.
- `index.html` lädt jetzt `style.css` statt `styles.css`.
- Tab-Panels erhalten Modulklassen wie `tcp-module--air`, `tcp-module--unit`, `tcp-module--hx`.
- Inline-`display:none` an Tab-Panels entfernt.
- `app.js` steuert aktive Tabs jetzt über `.is-active` und `aria-hidden`, nicht mehr über modulabhängiges Inline-`display`.
- Desktop-/Mobile-Grundlayout zentralisiert:
  - einheitlicher Header-Abstand
  - einheitliche Zwei-Spalten-Grids ab 900 px
  - identische Spalten-Oberkanten
  - mobile Stack-Darstellung
- Ergebniszeilen und Mini-Aktionsbuttons zentral vereinheitlicht.
- h,x-Karten optisch an die bestehende App-Kartenlogik angenähert.

## Noch bewusst nicht vollständig entfernt
- `layout.css` bleibt als Legacy-/Kompatibilitätsschicht aktiv, da dort noch viele Modulregeln und PDF-nahe Regeln liegen.
- `styles.css` bleibt als alte Datei im Paket erhalten, wird aber nicht mehr von `index.html` geladen.
- Inline-Styles innerhalb einzelner Modul-Inhalte sind noch vorhanden und sollten in Stufe 2 komponentisiert werden.

## Nächste Refactoring-Stufe
1. Inline-Styles in Lüftung und Einheiten in Klassen überführen.
2. `layout.css` in echte PDF-Datei bereinigen.
3. Modul-Wrapper konsequent auf generische Klassen `tcp-layout`, `tcp-col`, `tcp-card`, `tcp-result-row` umstellen.
4. h,x, WRG, Trinkwasser, MAG und Entwässerung an dieselbe Struktur angleichen.
