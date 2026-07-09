# Module Contract

Status: verbindlich ab Version 1.3.3-rc.1  
Letzte Aktualisierung: Phase 45E.4 Module Contract Finalization

## Ziel

Der Modulvertrag definiert, wie Fachmodule in TechCalc Pro an die Plattform angebunden werden. Fachmodule unterscheiden sich durch Fachlogik, Eingaben, Ergebnisse und ViewModel. Plattformfunktionen wie Speichern, Laden, Auswahl, Tastaturführung, Theme, Rendering, PDF und Migration werden zentral oder über definierte Adapter bereitgestellt.

## Modulbestand 1.3.3

| Modul-ID | Fachmodul | Status |
|---|---|---|
| `heating-cooling` | Heizung/Kälte | aktiv |
| `pressure-holding` | Druckhaltung | aktiv |
| `buffer-storage` | Pufferspeicher | aktiv |
| `ventilation` | Lüftung | aktiv |
| `heat-recovery` | Wärmerückgewinnung | aktiv, seit 1.3.3 eigenständig |
| `mixed-air` | Mischluft | aktiv, seit 1.3.3 eigenständig |
| `hx-diagram` | h,x-Diagramm | aktiv |
| `drinking-water` | Trinkwasser | aktiv |
| `wastewater` | Abwasser | aktiv |
| `rainwater` | Regenwasser | aktiv |
| `pipe-sizing` | Rohrdimensionierung | aktiv |
| `unit-converter` | Einheitenumrechner | aktiv |

## Verbindliche Modulregeln

1. Jedes Fachmodul besitzt eine eindeutige Modul-ID.
2. Fachmodule dürfen keine parallele Plattforminfrastruktur einführen.
3. Save, Load, Selection, Keyboard, Theme, Render, PDF und Import/Export folgen den zentralen Contracts.
4. Modulzustände müssen serialisierbar, migrationsfähig und rückwärtskompatibel sein.
5. Gespeicherte Records gehören immer zum fachlich zuständigen Modul.
6. Gemeinsame Fachlogik wird in Shared-/Utility-Schichten ausgelagert, nicht zwischen Modulen kopiert.
7. Neue Module müssen gegen ein Referenzmodul getestet werden.
8. Änderungen an Modulgrenzen benötigen Analyse, Design Review, Implementierung, Regression und Dokumentation.
9. Dynamische Registrierung ist erlaubt, muss aber dokumentiert und testbar sein.
10. Legacy-Daten dürfen beim Laden migriert werden, dürfen danach aber nicht als aktive Parallelstruktur weitergeführt werden.

## Pflichtschnittstellen pro Modul

Ein Modul muss, soweit fachlich relevant, folgende Verantwortungen erfüllen:

| Bereich | Erwartung |
|---|---|
| Modul-ID | stabile, eindeutige ID für Navigation, Persistenz, PDF und Tests |
| Eingaben | definierte Eingabefelder mit validierbarer Struktur |
| Berechnung | deterministische Fachlogik ohne versteckte UI-Abhängigkeit |
| ViewModel | klare Ableitung der Anzeige- und Ergebnisdaten |
| State | serialisierbarer Modulzustand |
| Records | gespeicherte Datensätze im eigenen Modulkontext |
| PDF | exportierbare Ergebnissicht oder bewusst dokumentierter Ausschluss |
| Import/Export | Einbindung in Projektformat und Migration |
| Regression | Referenztests für Kernpfade |

## Persistenz- und Migrationsregeln

- Neue Modulzustände werden unter der jeweiligen Modul-ID gespeichert.
- Legacy-Strukturen werden beim Laden in die aktuelle Struktur migriert.
- Migrationslogik muss idempotent sein.
- Alte Projektdateien dürfen nicht zu Datenverlust führen.
- Nach der Migration muss die aktive UI ausschließlich aus der aktuellen Modulstruktur lesen.
- Gespeicherte Records müssen anhand Modul-ID, Typ, Struktur oder eindeutigem Datenprofil dem richtigen Zielmodul zugeordnet werden.

## WRG/Mischluft ab 1.3.3

Das frühere kombinierte WRG-/Mischluft-Modul ist seit Version 1.3.3 getrennt:

- `heat-recovery` enthält ausschließlich Wärmerückgewinnung/RLT-Records und zugehörige Berechnungen.
- `mixed-air` enthält Mischluft-Eingaben, Mischluft-Berechnung, Mischluft-Records und PDF-Ausgabe.
- Legacy-Projekte aus Version 1.3.2 werden beim Laden automatisch auf beide Module verteilt.
- Mischluft-Records dürfen nach Migration nicht im WRG-Speicher verbleiben.

Detailreferenz: `docs/contracts/wrg-mixed-air-splitting-contract.md`


## Modulverantwortlichkeiten 1.3.3

| Modul-ID | Verantwortung | Persistenz / Records | PDF / Export | Besondere Regeln |
|---|---|---|---|---|
| `heating-cooling` | Leistung, Massenstrom und Temperaturdifferenz für Heizung/Kälte | eigener State und Saved Records | Ergebniswerte und Berechnungsgrundlagen | Prozessfarbe getrennt von Modulidentität |
| `pressure-holding` | Druckhaltung und Anlagenparameter | eigener State und Saved Records | Druckhaltungs-Ergebnisse | keine Kopplung an Pufferspeicher |
| `buffer-storage` | Pufferspeicher-Dimensionierung | eigener State und Saved Records | Speicherergebnisse | keine Vergleichs-/Altlogik im aktiven Pfad |
| `ventilation` | Luftbehandlung und RLT-Basisfunktionen | eigener State | PDF über definierte Ergebnisdaten | keine Vermischung mit WRG/Mischluft-Records |
| `heat-recovery` | Wärmerückgewinnung/RLT-Geräte | eigene WRG-Records | WRG-spezifische Ergebnisse | keine Mischluft-Records |
| `mixed-air` | Mischluft aus Außenluft/Umluft | eigene Mischluft-Records | Mischluft-Ergebnisse | eigene Save-/Load-/Migration-Anbindung |
| `hx-diagram` | h,x-Diagramm und Zustandsvisualisierung | eigener Diagrammzustand | Diagramm-/Zustandsausgabe | Canvas/Diagrammlogik bleibt gekapselt |
| `drinking-water` | Trinkwasserberechnungen | eigener State | Trinkwasser-Ergebnisse | Referenz für mobile Eingabe-/Keyboard-Verträge |
| `wastewater` | Abwasserberechnungen | eigener State | Abwasser-Ergebnisse | kein Legacy-LineModel im aktiven Pfad |
| `rainwater` | Regenwasser/KOSTRA-Kontext | eigener State und Flächenlisten | Regenwasser-Ergebnisse | externe Links sichern State vor Navigation |
| `pipe-sizing` | Rohrdimensionierung | Leitungsabschnitte und Materialzustand | Rohrtabellen/Dimensionen | Modulfarben folgen Modulvertrag |
| `unit-converter` | Einheitenumrechnung | temporärer/konvertierbarer State | kein Pflicht-PDF | keine Fachmodul-Persistenz vermischen |

## Referenzmodule

| Thema | Referenz |
|---|---|
| Save/Edit/Records | Heizung/Kälte, Druckhaltung |
| Diagramm/Canvas | h,x-Diagramm |
| Mobile Input | Trinkwasser |
| Legacy-Migration | Wärmerückgewinnung/Mischluft 1.3.3 |
| PDF-Ergebnisstruktur | Module mit regelbasierter PDF-Ausgabe |

## Verbotene Kopplungen

- Direkter Zugriff eines Fachmoduls auf interne State-Objekte eines anderen Fachmoduls.
- Kopieren bestehender Modulimplementierungen unter neuem Dateinamen ohne klaren Vertrag.
- Modulbezogene Sonderlogik im globalen Shell-Code ohne Dokumentation.
- Speicherung fachfremder Records in einem anderen Modulkontext.
- UI-only Migration ohne Persistenz- und Record-Migration.

## Akzeptanzkriterien für Moduländerungen

Eine Moduländerung gilt erst als abgeschlossen, wenn erfüllt ist:

- Eingaben funktionieren.
- Berechnung liefert Referenzergebnisse.
- Speicherdialog / Dirty-State funktioniert.
- Speichern und Laden funktionieren.
- Legacy-Projekte bleiben kompatibel, falls betroffen.
- PDF-Export funktioniert oder der Ausschluss ist dokumentiert.
- Regression gegen Referenzmodule ist durchgeführt.
- Contract, ADR oder Phasendokumentation sind aktualisiert.

## Referenzen

- `docs/contracts/save-contract.md`
- `docs/contracts/state-contract.md`
- `docs/contracts/render-contract.md`
- `docs/contracts/pdf-contract.md`
- `docs/contracts/keyboard-contract.md`
- `docs/contracts/selection-contract.md`
- `docs/contracts/wrg-mixed-air-splitting-contract.md`
- `docs/adr/ADR-0005-phase-change-control.md`
- `docs/adr/ADR-0006-wrg-mixed-air-module-splitting.md`
- `docs/qm/QM-003-Architecture-Rules.md`
- `docs/qm/QM-006-Regression-Standard.md`
- `docs/qm/QM-012-Documentation-Standard.md`
