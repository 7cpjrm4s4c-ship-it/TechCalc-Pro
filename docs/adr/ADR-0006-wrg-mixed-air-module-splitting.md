# ADR-0006 – WRG/Mischluft-Modulsplitting

## Status

Angenommen für Version `1.3.3-dev.2` / Phase 45B.

## Kontext

Das bestehende Modul `heat-recovery` enthält zwei fachlich getrennte Berechnungsarten:

- Wärmerückgewinnung (`mode: wrg`)
- Mischluft (`mode: mixing`)

Beide Bereiche teilen aktuell State, Schema, View, ViewModel, Results, Controller und Persistenzpfad `modules['heat-recovery']`. Das ist für Anwender zwar funktional, erhöht aber technische Kopplung, erschwert PDF-/Export-Verträge und macht künftige Erweiterungen im Bereich RLT unnötig riskant.

## Entscheidung

Version 1.3.3 trennt das Kombimodul in zwei eigenständige Plattformmodule:

1. `heat-recovery` – Wärmerückgewinnung
2. `mixed-air` – Mischluft

Der bestehende Modulschlüssel `heat-recovery` bleibt für WRG erhalten. Dadurch bleiben Navigation, historische Projektdateien und bestehende technische Referenzen möglichst stabil. Mischluft erhält den neuen Modulschlüssel `mixed-air`.

Gemeinsame lufttechnische Hilfsfunktionen dürfen nicht dupliziert werden. Sie werden vor oder während der Implementierung in einen gemeinsamen Shared-Bereich ausgelagert, z. B. `js/modules/air/shared/` oder eine vergleichbare interne Utility-Struktur.

## Migrationsentscheidung

Bestehende Projekte mit `modules['heat-recovery']` bleiben importierbar.

Beim Laden alter Projektstände gilt:

- WRG-relevante Felder verbleiben in `modules['heat-recovery']`.
- Mischluft-relevante Felder werden nach `modules['mixed-air']` kopiert oder verschoben.
- Der historische Wert `mode` darf für die Migration gelesen werden, ist aber kein Steuerungsfeld der Zielmodule.
- Falls ein Altprojekt nur Mischluft-Werte enthält, wird trotzdem ein gültiger WRG-Default-State erzeugt.
- Unbekannte Felder werden nicht verworfen, solange sie in bestehenden Projektdateien vorkommen können.

## PDF-/Export-Entscheidung

PDF, Export und Saved Records behandeln WRG und Mischluft nach dem Split als getrennte Module. Bestehende gespeicherte RLT-Geräte bleiben fachlich WRG zugeordnet. Mischluft erhält keine automatische Übernahme der WRG-Geräteliste, sofern die Implementierungsanalyse nicht eine zwingende fachliche Kopplung nachweist.

## Konsequenzen

- Das bisherige Segmentfeld `Berechnungsart` entfällt im Zielbild aus der Runtime-UI.
- Navigation zeigt zwei Module statt eines Kombimoduls.
- Regression muss Altprojekt-Import, Neuprojekt-Speicherung, PDF, Offline, Update-Verhalten und alle Plattformen prüfen.
- Phase 45C darf nur kleine Implementierungsschritte enthalten: Shared-Extraktion, Zielmodul-Gerüst, Persistenzmigration und UI-Aktivierung getrennt validieren.

## Nicht entschieden

- Finale Reihenfolge der Module in der Navigation.
- Ob Mischluft später eigene Saved Records erhält.
- Ob gemeinsame Luftzustandskarten als generische UI-Komponenten in einen dauerhaft öffentlichen Contract aufgenommen werden.
