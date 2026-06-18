# Phase 37C.4D – Settings Accordion Chevron Layer Fix

## Ziel

Die Settings-Accordions sind nach 37C.4B/37C.4C funktional und scrollbar. Auf Mobile konnten jedoch Pfeile geschlossener Accordion-Zeilen optisch durch geöffnete Accordion-Cards durchscheinen.

## Änderung

- Settings-Drawer-Body erhält einen isolierten Stacking Context.
- Settings-Submenus erhalten explizite Layer (`z-index`).
- Offene Settings-Submenus liegen über geschlossenen Geschwisterkarten.
- Accordion-Content liegt über Chevron-Pseudo-Elementen geschlossener Cards.
- Summary-Flächen bleiben opak, damit keine darunterliegenden Pfeile sichtbar werden.
- Offene Cards clippen Inhalte an ihren Rundungen.

## Validierung

- `npm run build`
- `npm run test:phase37c4d`
- `npm run test:phase37c4c`
- `npm run test:phase37c4b`
- `npm run test:phase37c4a`
- `npm run test:module-smoke`

## Runtime-Risiko

Niedrig. Die Änderung betrifft ausschließlich CSS-Layering im Settings Drawer. Keine Modul- oder Berechnungslogik wurde geändert.
