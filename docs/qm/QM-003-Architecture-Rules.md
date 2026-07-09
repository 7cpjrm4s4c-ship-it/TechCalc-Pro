# QM-003 Architecture Rules

Status: verbindlich ab Version 1.3.3-dev.7

## Modulprinzipien

- Jedes Fachmodul besitzt eine stabile Modul-ID.
- Fachlogik, State, ViewModel und UI-Anbindung bleiben pro Modul klar abgegrenzt.
- Plattformfunktionen wie Save/Load, PDF, Rendering, Keyboard, Theme, Import/Export und Migration folgen zentralen Contracts.
- Gemeinsame Logik wird in Utility-/Shared-Schichten ausgelagert, nicht durch Kopieren von Modulen dupliziert.

## Aktuelle Modulreferenz

Der verbindliche Modulbestand steht in `docs/contracts/module-contract.md`.

Seit Version 1.3.3 sind Wärmerückgewinnung und Mischluft getrennte Module:

- `heat-recovery`
- `mixed-air`

Detailvertrag: `docs/contracts/wrg-mixed-air-splitting-contract.md`.

## Verbotene Architekturzustände

- direkte Kopplung eines Fachmoduls an interne State-Objekte eines anderen Moduls,
- doppelte Implementierungen mit identischem Vertrag,
- UI-only-Migration ohne Persistenz- und Record-Migration,
- globale Sonderlogik ohne Contract-Verankerung,
- ungetestete dynamische Registrierung.
