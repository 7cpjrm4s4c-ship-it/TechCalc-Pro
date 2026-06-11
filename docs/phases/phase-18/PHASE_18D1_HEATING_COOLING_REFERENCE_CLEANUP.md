# Phase 18D.1 – Heizung/Kälte Referenzbereinigung

## Ziel

Heizung/Kälte bleibt auf dem stabilen Plattform-Mount aus Phase 18D, aber die verbliebene View-/Dynamic-Callback-Komposition wird aus dem Modul-Index herausgelöst.

## Änderungen

- Neuer Adapter `js/modules/heating-cooling/view.js` für die geordnete Soll-UI.
- `index.js` reduziert sich auf Plattformverkabelung, LineSectionController und Runtime-Adapter.
- Ergebnis-/Rohr-/Medium-/Input-Rendercallbacks liegen zusammen mit der View-Komposition.
- Keine Legacy-DOM-Helfer (`setInner`, `setInputValue`, `updateSegment`, etc.) im Modul-Index.

## Architekturstand

Heizung/Kälte folgt damit weiter dem Plattformvertrag: Mount, Dynamic-Islands, Result-Rendering und Leitungsabschnitte werden zentral gesteuert; fachliche Zustandsableitung bleibt im Modul-Controller.
