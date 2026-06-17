# Phase 19B.2C – Lüftung Saved-Record-Island

## Ziel

Die Lüftungs-Saved-Records bleiben fachlich Leitungsabschnitte, dürfen aber im DOM und in der Dynamic-Update-Strecke nicht mehr über einen Heizung/Kälte-spezifischen Selektor adressiert werden.

## Umsetzung

- `createLineSectionController` besitzt jetzt einen neutralen `dynamicDataAttr`-Vertrag.
- Lüftung setzt `dynamicDataAttr: 'data-line-dynamic'`.
- Lüftung aktualisiert die Leitungsabschnittsliste über `[data-line-dynamic="line-sections"]`.
- Der Controller rendert vorerst zusätzlich `data-hc-dynamic`, damit Heizung/Kälte unverändert stabil bleibt.
- Das Lüftungsmodul registriert weiterhin keine eigenen Saved-Record-Actions, erzeugt keine IDs direkt und manipuliert keine Listen mit `replaceRecord` oder `removeRecord`.

## Ergebnis

Phase 19B.2C entfernt den ersten Heizung/Kälte-Sonderpfad aus der Lüftungs-Saved-Record-Insel, ohne die Referenzmodule zu brechen. Die eigentliche Speicherung bleibt vollständig beim zentralen `lineSectionController`.

## Regression

Neu:

- `tests/ventilation-phase19b2c-saved-record-island.test.mjs`

Bestanden:

- vollständiges Quality Gate
