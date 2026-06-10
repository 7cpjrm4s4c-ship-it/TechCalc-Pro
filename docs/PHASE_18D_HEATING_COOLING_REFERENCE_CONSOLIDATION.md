# Phase 18D - Heizung/Kälte Referenz-Konsolidierung

Phase 18D konsolidiert Heizung/Kälte nach der erfolgreichen Plattform-Migration.
Der Fokus liegt nicht auf einer neuen UI-Struktur, sondern auf der Entkernung
verbliebener Modul-Altlasten.

## Umsetzung

- Fachliche Zustandsableitung und Eingabe-/Leitungsabschnitt-Hydration wurden aus
  `modules/heating-cooling/index.js` nach `modules/heating-cooling/controller.js`
  ausgelagert.
- `index.js` bleibt als Plattform-Adapter für View, DynamicRenderer und
  LineSectionController erhalten.
- Der Modul-Mount bleibt vollständig in `platform/moduleRuntime`.
- Ergebnisdarstellung bleibt über `platform/resultRenderer`.
- Leitungsabschnitte bleiben über `platform/lineSectionController`.
- Dynamische Updates bleiben über `platform/dynamicRenderer`.

## Zielzustand

Heizung/Kälte ist damit als drittes Referenzmodul konsolidiert. Das Modul enthält
nur noch fachliche Adapter und Datenmodelle; UI-/UX-Verantwortung liegt in der
Plattform.
