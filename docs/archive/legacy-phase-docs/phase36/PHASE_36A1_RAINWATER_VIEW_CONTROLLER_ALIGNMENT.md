# Phase 36A.1 – Regenwasser View-/Controller-Angleichung

## Ziel

Regenwasser wird auf das Referenzmuster der funktionierenden Module Heizung/Kälte und Lüftung angeglichen: Die Speicher-Card wird nicht mehr über `results.savedRecords()` gerendert, sondern über den zentralen `rainwaterSavedController` im View-Layer.

## Änderungen

- `js/modules/rainwater/view.js` neu ergänzt.
- `js/modules/rainwater/viewModel.js` neu ergänzt.
- `index.js` auf custom `view` umgestellt.
- Legacy-`savedRecords` Import/Export aus `index.js` entfernt.
- Legacy-`savedRecords()` aus `results.js` entfernt.
- Tests auf das neue Controller-View-Pattern angepasst.

## Erwarteter Effekt

- Der Speicher-Dialog bleibt sichtbar und funktionsfähig, obwohl der alte `results.savedRecords()`-Pfad entfernt ist.
- Regenwasser nutzt jetzt denselben Single-Controller-Speicherpfad wie die Referenzmodule.
- Der vorherige Fehler aus 35G, bei dem nach Entfernung des alten Renderers kein Eintrag mehr angelegt wurde, wird durch den neuen View-Layer adressiert.

## Quality Gate

- `npm run build`: OK
- `npm run test:imports`: OK
- `npm test`: OK
