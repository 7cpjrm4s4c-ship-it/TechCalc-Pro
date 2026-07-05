# Phase 36J – Rollback LineSectionController

## Grund
Nach 36A.4/36H/36I haben sich Saved-Record-/Accordion-Probleme auf weitere Module ausgeweitet.
Damit ist der gemeinsame `platform/lineSectionController` als Fix-Hebel zu riskant.

## Maßnahme
Der gemeinsame `js/platform/lineSectionController/index.js` wurde aus dem Stand vor 36A.4 wiederhergestellt.

Referenzpaket:
`techcalc-pro-1.3.2-dev.2-rc.1-phase36a3-rainwater-dynamic-renderer.zip`

## Bewusst beibehalten
Die Architektur-Bereinigung in Regenwasser/Schmutzwasser bleibt bestehen:
- `createLineSectionController()` in `index.js`
- keine konkurrierenden `savedRecords()`-Altpfade
- kein `data-platform-dynamic="saved-records"`
- keine exportierten SavedController in Modul-Controllern

## Erwartung
Regressionen in anderen Modulen sollten verschwinden.
Regenwasser/Entwässerung werden danach modulnah weiter behandelt, ohne den Shared Controller erneut global zu verändern.
