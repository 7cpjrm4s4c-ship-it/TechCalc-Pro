# Migration Guide 1.3.3

## Ziel

Version 1.3.3 trennt das bisher kombinierte WRG-/Mischluft-Modul in zwei eigenständige Module:

- `heat-recovery` – Wärmerückgewinnung
- `mixed-air` – Mischluft

## Automatische Migration

Beim Laden bestehender Projektdateien aus 1.3.2 werden historische WRG-/Mischluft-Daten automatisch migriert:

1. WRG-Daten bleiben im Modul `heat-recovery`.
2. Aktive Mischluft-Eingaben werden nach `mixed-air` übernommen.
3. Gespeicherte Mischluft-Records werden aus historischen WRG-Records erkannt und nach `mixed-air` verschoben.
4. WRG-Records verbleiben ausschließlich im WRG-Modul.

## Anwenderwirkung

Keine manuelle Anpassung erforderlich. Bestehende Projekte können weiter geöffnet, gespeichert, exportiert und als PDF ausgegeben werden.

## Akzeptanzkriterien

- Alte Projekte laden ohne Datenverlust.
- WRG-Liste enthält nur WRG/RLT-Datensätze.
- Mischluft-Liste enthält Mischluft-Datensätze.
- Neue Speicherung schreibt in die getrennte Modulstruktur.
- PDF-Export funktioniert für beide Module.
