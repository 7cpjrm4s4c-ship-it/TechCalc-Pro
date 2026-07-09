# Architecture Baseline 1.3.3

Status: freigegeben mit Phase 45E.5 / 45E.6  
Version: 1.3.3-rc.1

## Zweck

Diese Baseline beschreibt den eingefrorenen Architekturstand von TechCalc Pro 1.3.3. Änderungen ab 1.4.x müssen gegen diese Baseline geprüft und bei architekturrelevanten Abweichungen per ADR dokumentiert werden.

## Modulbestand

- `heating-cooling` – Heizung/Kälte
- `pressure-holding` – Druckhaltung
- `buffer-storage` – Pufferspeicher
- `ventilation` – Lüftung
- `heat-recovery` – Wärmerückgewinnung
- `mixed-air` – Mischluft
- `hx-diagram` – h,x-Diagramm
- `drinking-water` – Trinkwasser
- `wastewater` – Abwasser
- `rainwater` – Regenwasser
- `pipe-sizing` – Rohrdimensionierung
- `unit-converter` – Einheitenumrechner

## Verbindliche Architekturregeln

- Fachmodule besitzen eindeutige Modul-IDs.
- Fachmodule halten Berechnung, State, ViewModel und UI-Verhalten getrennt.
- Gemeinsame Logik liegt in Shared-/Core-Schichten, nicht als Kopie in Fachmodulen.
- Projektpersistenz, Import/Export, PDF, Save/Edit und Migration laufen über definierte Contracts.
- Keine zyklischen Abhängigkeiten zwischen Fachmodulen.
- Fachmodule greifen nicht direkt auf interne State-Objekte anderer Fachmodule zu.
- Legacy-Strukturen dürfen nur im Lade-/Migrationspfad existieren.

## WRG/Mischluft-Baseline

- `heat-recovery` enthält ausschließlich Wärmerückgewinnung/RLT-Funktionalität und zugehörige gespeicherte Records.
- `mixed-air` enthält Mischluft-Eingaben, Mischluft-Berechnung, Mischluft-Ergebnisse, Mischluft-PDF und Mischluft-Records.
- Legacy-Projekte aus 1.3.2 werden beim Laden automatisch auf beide Module verteilt.
- Mischluft-Saved-Records dürfen nach der Migration nicht im WRG-Modul verbleiben.

## Review-Ergebnis 45E.5

Bestanden:

- Modulgrenzen geprüft.
- Modulvertrag gegen QM geprüft.
- WRG-/Mischluft-Splitting validiert.
- Legacy-Migration validiert.
- Shared-Abhängigkeiten geprüft.
- Keine blockierenden Architekturabweichungen festgestellt.

## Referenzen

- `docs/contracts/module-contract.md`
- `docs/contracts/wrg-mixed-air-splitting-contract.md`
- `docs/qm/QM-001-Quality-Manual.md`
- `docs/qm/QM-003-Architecture-Rules.md`
- `docs/qm/QM-004-Release-Gates.md`
- `docs/release/ARCHITECTURE_REVIEW_45E5.md`
- `docs/release/RC_CHECKLIST.md`
