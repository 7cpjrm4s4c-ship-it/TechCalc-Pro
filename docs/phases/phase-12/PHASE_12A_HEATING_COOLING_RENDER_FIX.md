# Phase 12A - Heizung/Kälte Render- und Bedienfix

Ziel: Heizung/Kälte darf bei normalen Eingaben, Selects und Switches nicht mehr vollständig neu gerendert werden. Die fachlichen Bedienelemente müssen sofort committen und dynamische Ergebnisbereiche gezielt aktualisieren.

## Umgesetzt

- Modul `heating-cooling` nutzt einen eigenen granularen Mount-Pfad als Zwischenstufe zur finalen Plattformmigration.
- `mediumId` und `pipeSystemId` aktualisieren Stammdaten und Empfehlung ohne Full-Render.
- Heizung/Kälte- und Berechnungsziel-Switches committen direkt über Store/Event-Pipeline.
- Ergebnis-, Medium- und Rohrdaten werden gezielt in `data-hc-dynamic` Bereichen aktualisiert.
- Leitungsabschnitte bleiben strukturelle Aktionen und rendern nur bei Save/Update/Delete/Select vollständig.
- Massenstrom-Einheit `kg/h` / `m³/h` ist wieder als Unit-Select sichtbar.
- Geberit Mepla Norm auf `DIN 16836` gekürzt/korrigiert.

## Warum

Die vorherige Version hat nach fast jeder Benutzeraktion `root.innerHTML = view(...)` ausgelöst. Auf Mobilgeräten führte das zu erneut öffnenden Select-Menüs, sichtbarem Flackern und verzögerten Switch-/Save-Aktionen. Desktop zeigte denselben Effekt als unruhige Card-Neuladevorgänge.

## Noch offen

Der granulare Mount-Pfad ist bewusst auf Heizung/Kälte begrenzt. Nach erfolgreicher Prüfung sollte die gleiche Strategie in die zentrale `renderCoordinator`-Logik übernommen werden, damit andere Module davon profitieren.
