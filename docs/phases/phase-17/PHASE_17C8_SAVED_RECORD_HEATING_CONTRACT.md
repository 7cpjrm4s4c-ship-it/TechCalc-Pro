# Phase 17C.8 - SavedRecord Heating/Kälte Contract

## Ziel

Regenwasser und Schmutzwasser verwenden für gespeicherte Einträge denselben stabilen DOM-/Action-Vertrag wie Heizung/Kälte.

## Umsetzung

- SavedRecord-Zeilen nutzen `data-line-select`, `data-line-toggle`, `data-line-delete`.
- Die Plattform löst `saved:load`, `saved:toggle`, `saved:delete` direkt über `registerCentralActions` auf.
- Die konkurrierende SavedRecord-Bridge wurde aus dem aktiven Pfad entfernt.
- Regenwasser und Schmutzwasser enthalten keine eigenen SavedRecord-Listener.
- Der Regenwasser-Bereichswechsel erzwingt zusätzlich einen settled Re-Render, damit `r(5,5)` / `r(5,2)` ohne weitere Eingabe sofort sichtbar wird.

## Referenz

Heizung/Kälte bleibt das funktionierende Referenzverhalten für gespeicherte Leitungsabschnitte; Regenwasser und Schmutzwasser folgen nun demselben Attribut- und Action-Muster, aber zentral über die Plattform.
