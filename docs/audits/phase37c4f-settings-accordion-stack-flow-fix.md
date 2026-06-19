# Phase 37C.4F — Settings Accordion Stack Flow Fix

## Ziel

Die Regression aus 37C.4E wurde gezielt korrigiert: geöffnete Settings-Accordion-Inhalte müssen im normalen Dokumentfluss liegen und nachfolgende Accordion-Cards nach unten schieben, statt unter ihnen zu liegen.

## Änderung

- `.settings-panel__body` nutzt wieder normalen Block-Flow statt Grid-Flow für die Accordion-Liste.
- `.settings-submenu` bleibt ein normaler Block im Dokumentfluss.
- `.settings-submenu__content` wurde von Layer-/Overlay-Verhalten auf `position: static` zurückgeführt.
- Geöffnete Inhalte werden als `display: block` gerendert.
- Accordion-Abstände werden über normale Sibling-Margins gesteuert.
- Keine Modul- oder App-Logik geändert.

## Abnahmekriterien

- Geöffnete Settings-Accordion-Inhalte sind sichtbar.
- Nachfolgende Accordion-Headers werden durch den Body nach unten geschoben.
- Keine überlagernden Chevrons oder Textschichten.
- Settings Drawer bleibt scrollbar.

## Guard

- `test:phase37c4f`
