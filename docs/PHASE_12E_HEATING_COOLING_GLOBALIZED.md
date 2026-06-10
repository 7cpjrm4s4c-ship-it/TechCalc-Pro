# Phase 12E — Heizung/Kälte globalisiert

Ziel dieser Phase ist die konsequente Abkehr von Legacy-Patches im Modul Heizung/Kälte. Die Modul-Shell wird initial aufgebaut; danach laufen Feld-, Select-, Segment- und Saved-Record-Aktionen über Store, zentrale Event-Pipeline und granulare DOM-Updates.

## Umgesetzt

- Static Layout bleibt nach dem Initial-Render stabil.
- Feldänderungen aktualisieren nur dynamische Anker (`data-hc-dynamic`).
- Medium- und Rohr-Auswahl committen sofort und aktualisieren Stammdaten ohne Modul-Reload.
- Segment-Switches bleiben vollständig pipeline-gesteuert.
- `kg/h` / `m³/h` bleibt als Massenstrom-Einheitenumschaltung im Feld sichtbar.
- Leitungsabschnitte laufen store-first über `state.lineSections`.
- Speichern, Aktualisieren, Auswahl und Löschen verwenden zentrale `data-tc-action`-Aktionen.
- Mobile Pointer-/Touch-Aktionen werden vor verzögerten Clicks verarbeitet; doppelte Actions werden unterdrückt.
- Mepla verwendet die kurze Norm `DIN 16836`.

## Abschlusskriterien

- Kein Legacy-Interaction-Adapter im Modul.
- Keine Saved-Record-Fallback-Bindings im Modul.
- Nach dem Initial-Render kein kompletter Modul-Reload bei Eingabe, Select, Segment oder Saved-Record-Aktion.
- `npm test` läuft erfolgreich.
