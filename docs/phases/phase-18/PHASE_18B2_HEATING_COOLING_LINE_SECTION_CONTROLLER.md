# Phase 18B.2 – Heizung/Kälte Line-Section Controller

## Ziel

Heizung/Kälte bleibt während der Migration stabil, verliert aber weitere Modul-eigene Plattformlogik. Die Leitungsabschnitt-Verwaltung wird aus dem Modul heraus in einen zentralen Plattform-Controller verschoben.

## Umsetzung

Neu:

```text
js/platform/lineSectionController/index.js
```

Der Controller übernimmt generisch:

- Rendern der Leitungsabschnitt-Card
- Rendern der gespeicherten Einträge
- `line:save`
- `line:update`
- `saved:load`
- `saved:toggle`
- `saved:delete`
- Store-first Persistenz
- Save-/Update-Button-Zustände
- Accordion-Zustand
- Import-/Export-kompatibles Lesen/Schreiben der Liste

Das Heizung/Kälte-Modul liefert nur noch fachliche Adapter:

- Erzeugung eines Leitungsabschnitt-Records
- Hydration eines gespeicherten Records zurück in den Modul-State
- Statistikzeilen eines gespeicherten Eintrags
- aktuelles Berechnungsergebnis

## Ergebnis

Der stabile eigene Mount von Heizung/Kälte bleibt erhalten. Die Saved-Record-/LineSection-Bedienlogik ist jedoch nicht mehr im Modul gebunden, sondern plattformseitig gekapselt. Das bereitet Phase 18B.3 vor, in der Dynamic-Islands weiter zentralisiert werden.

## Regression

`npm test` erfolgreich.
