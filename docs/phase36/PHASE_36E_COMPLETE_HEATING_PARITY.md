# Phase 36E – Abschluss Heizung-Pfad-Parität

## Ziel
Regenwasser und Schmutzwasser folgen dem Heizung/Kälte-Pfad ohne Debug- oder Accordion-Sonderlogik.

## Änderungen
- `lineSectionController` auf Referenzverhalten zurückgeführt.
- Aktiver Eintrag kann wieder per erneutem Klick deselektiert werden.
- Accordion-Toggle ist wieder rein state-basiert.
- Debug Card und `bindDebugPanel` aus Regenwasser/Schmutzwasser entfernt.
- Explizites `dynamicDataAttr` entfernt; Default entspricht Heizung: `data-line-dynamic`.
- Controller-Erzeugung und DynamicRenderer-Orchestrierung bleiben in `index.js`, wie Heizung.
