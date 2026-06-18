# Phase 37C – App-Shell Decomposition

## 37C.1 – Responsibility Map

`app.js` wurde in Verantwortungsbereiche zerlegt. Die Extraktionsreihenfolge wurde auf risikoarme Shell-Controller gelegt.

## 37C.2 – Theme Controller Extraction

Theme-Initialisierung, Theme-Persistenz und Theme-Umschaltung wurden nach `js/platform/shell/themeController.js` ausgelagert.

## 37C.2A–37C.2F – Regression Stabilisierung

Die mobile Trinkwasser-Scroll-Regression wurde über Surface-No-Op-Unterdrückung stabilisiert. Zusätzlich wurden Kupfer-Dimensionen DN65–DN100 korrigiert.

## 37C.3 – Settings Controller Extraction

Die Settings-Drawer-Logik wurde aus `js/core/app.js` nach `js/platform/shell/settingsController.js` extrahiert.

Umfang:

- Settings öffnen/schließen
- Page-Scroll-Lock für Drawer
- Submenu-Persistenz
- Außenklick/Escape-Schließen
- iOS/Safari Touchmove-Guard
- PDF-Preload beim Öffnen

Ziel: App-Shell weiter entflechten, ohne Runtime-Verhalten zu ändern.
