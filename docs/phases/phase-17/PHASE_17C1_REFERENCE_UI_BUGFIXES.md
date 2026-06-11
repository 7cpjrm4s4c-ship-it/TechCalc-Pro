# Phase 17C.1 – Referenzmodule UI-Bugfixes

## Ziel

Die offenen UX-/UI-Fehler in den beiden Referenzmodulen Regenwasser und Schmutzwasser wurden zentral behoben, ohne neue modulgebundene Sonderpfade einzuführen.

## Schmutzwasser

- Leitungsart wird jetzt als natives Plattform-Dropdown `lineType` gerendert.
- Die früheren Segment-Felder `lineFamily` und `lineVentilation` wurden aus dem Schema entfernt.
- Der Controller besitzt keine Segment-Sonderlogik für Leitungsarten mehr.
- Entwässerungsgegenstände nutzen einen stabilen Plattform-Collection-Row-Vertrag mit festen Spalten für Inhalt, Anzahl und Löschen.
- Die Anzahl-Felder in gespeicherten/erfassten Entwässerungsgegenständen erscheinen dadurch einheitlich.

## Regenwasser

- Der Wechsel Dachfläche/Grundstücksfläche rendert das Regenspende-Feld unmittelbar korrekt.
- Regression prüft explizit:
  - Dachfläche zeigt `r(5,5)`.
  - Grundstücksfläche zeigt direkt `r(5,2)`.
  - die alte Beschriftung bleibt nach dem Wechsel nicht sichtbar.

## Gespeicherte Einträge

- Gespeicherte Karten tragen jetzt explizit `data-saved-record-id`.
- Toggle-Buttons tragen ebenfalls die Record-ID.
- Damit ist die Auswahl/Bearbeitung robuster, insbesondere auf mobilen Touch-Geräten und bei verschachtelten Klickzielen.

## Plattformänderungen

- `platform/collectionRenderer` rendert editierbare Collection-Zeilen mit `tc-consumer-row--editable` und `tc-collection-row__content`.
- `css/components.css` enthält einen generischen Grid-Vertrag für editierbare Collection-Zeilen.
- Die Änderungen sind generisch und können von später migrierten Modulen wiederverwendet werden.

## Regression

Neu:

- `tests/reference-modules-phase17c1-ui-bugfix.test.mjs`

Erweitert:

- `tests/wastewater-phase17b2-reference-level.test.mjs`
- `scripts/quality-gate.mjs`

Status:

- `npm test` erfolgreich.
