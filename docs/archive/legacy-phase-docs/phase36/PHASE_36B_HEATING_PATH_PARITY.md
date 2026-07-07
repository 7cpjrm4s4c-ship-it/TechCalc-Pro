# Phase 36B – Regenwasser/Schmutzwasser Saved-Record-Pfad wie Heizung

## Ziel
Regenwasser und Schmutzwasser verwenden den gleichen Saved-Record-Pfad wie Heizung/Kälte.

## Änderungen
- ViewModel enthält kein Saved-Record-HTML mehr.
- View erhält den `lineSectionController` direkt und rendert `lineSectionController.renderCard(s)`.
- Dynamic Update aktualisiert nur `[data-line-dynamic="line-sections"]`.
- `isDynamicAction` entspricht Heizung: alle Aktionen außer `initial` sind dynamisch.
