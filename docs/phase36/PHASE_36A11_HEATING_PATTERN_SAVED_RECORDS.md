# Phase 36A.11 – Saved Records nach Heizung-Muster

## Änderungen
- Sonderlogik `AccordionOpenMemory` entfernt.
- Accordion-Toggle wieder state-basiert wie Referenz Heizung/Lüftung.
- Regenwasser `updateRainwaterDynamic()` rendert nur noch die innere Row-Insel `[data-platform-dynamic="saved-records"]`, nicht mehr die gesamte Saved-Card.
- Schmutzwasser Collection-Direct-Binding auf eine Eingabequelle reduziert.

## Erwartung
PWA/Home-Screen und Browser verwenden denselben Saved-Record-Pfad wie Heizung/Lüftung.
