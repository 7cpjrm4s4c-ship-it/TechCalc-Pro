# Phase 37C.4B – Settings Accordion Body Visibility Fix

## Ziel
Geöffnete Settings-Accordions müssen ihre Inhalte sichtbar rendern und innerhalb des Settings-Drawers scrollbar bleiben.

## Änderungen
- Settings-Submenus erhalten einen synchronisierten `.is-open`-State zusätzlich zum nativen `open`-Attribut.
- Accordion-Body wird bei `open`/`.is-open` explizit sichtbar gesetzt.
- Geöffnete Submenus werden nicht mehr durch `overflow:hidden` oder feste Höhen abgeschnitten.
- Drawer-Scroll aus 37C.4A bleibt unverändert.

## Validierung
- `test:phase37c4b`
- `build`
- `test:phase37c4a`
- `test:module-smoke`
