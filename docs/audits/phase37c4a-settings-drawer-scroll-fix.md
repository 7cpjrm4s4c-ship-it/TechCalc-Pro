# Phase 37C.4A – Settings Drawer Scroll & Accordion Fix

## Ziel

Das Hauptmenü muss vor weiteren App-Shell-Extraktionen vollständig bedienbar sein. Lange Inhalte in den Settings-Accordions dürfen nicht am unteren Bildschirmrand abgeschnitten werden und müssen über den inneren Drawer-Scroll erreichbar bleiben.

## Änderungen

- Settings-Drawer wird auf Desktop und Mobile durch `top` + `bottom` begrenzt statt über eine feste `max-height`.
- `.settings-panel__body` bleibt der einzige vertikale Scroll-Host des Drawers.
- Bottom-Padding und Scroll-Padding wurden erhöht, damit Hosted-Preview-Bars, Browser-Chrome und Safe-Area den unteren Inhalt nicht verdecken.
- Accordion-Toggle-Handling scrollt den geöffneten Bereich gezielt im Drawer-Body in den sichtbaren Bereich.
- Persistierte, offene Submenus werden beim Öffnen des Drawers an den Anfang des inneren Scrollbereichs gebracht.
- Smooth-Scrolling wurde im Kompensationspfad entfernt, damit die Scrollposition nach Layout-Resolution deterministisch bleibt.

## Risiko

Keine Modul- oder Berechnungslogik geändert. Änderung betrifft ausschließlich Settings-Drawer CSS und Shell-Controller-Scrollkompensation.

## Validierung

- `npm run build`
- `npm run test:phase37c4a`
- `npm run test:phase37c4`
- `npm run test:phase37c3`
- `npm run test:module-smoke`
