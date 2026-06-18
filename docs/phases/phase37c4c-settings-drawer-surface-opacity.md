# Phase 37C.4C – Settings Drawer Surface Opacity Fix

## Ziel

Nach Phase 37C.4B waren die Settings-Accordion-Bodies wieder sichtbar, der Drawer-Hintergrund war auf Mobile jedoch zu transparent. Inhalte aus dem Modul dahinter konnten optisch durchscheinen und sich mit Settings-Texten überlagern.

## Anpassungen

- Settings Drawer erhält eine nahezu opake, eigene Surface-Ebene.
- `backdrop-filter` wurde für den Drawer deaktiviert.
- Settings-Submenus und Submenu-Inhalte verwenden opake `rgb(...)`-Surfaces statt stark transparenter `rgba(...)`-Flächen.
- Release-Note- und Settings-Info-Cards wurden auf dieselbe Surface-Logik gehärtet.
- Scroll-/Accordion-Logik bleibt unverändert.

## Validierung

- `npm run build`
- `npm run test:phase37c4c`
- `npm run test:phase37c4b`
- `npm run test:module-smoke`

## Ergebnis

Der Settings Drawer ist visuell vom Modulinhalt entkoppelt. Geöffnete Accordion-Inhalte bleiben lesbar, ohne dass der darunterliegende App-Inhalt durchscheint.
