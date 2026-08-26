# ADR-0009: F-Gase-Check und gemeinsame Kältemittelplattform

Status: Angenommen  
Datum: 2026-08-26  
Version: 1.5.0

## Kontext

Version 1.5.0 erweitert TechCalc Pro um das eigenständige Fachmodul `f-gases-check`. Der bestehende Repository-Stand stellt Fachmodule über `js/modules`, die zentrale Modulregistrierung, `createPlatformModule`, Saved Records, zentrale PDF-Infrastruktur und projektweite Persistenz bereit. Für modulübergreifende Datenübernahme existiert mit `js/shared/rainwaterSurfaceSnapshot.js` bereits ein Deep-Copy-Snapshot-Muster.

Der F-Gase-Check benötigt zusätzlich gemeinsame Kältemittelstammdaten, GWP-Daten, Sicherheitsklassen und regulatorische Regeln. Diese Daten sollen auch zukünftigen Kälte-, Klima- und Wärmepumpenmodulen zur Verfügung stehen, ohne dass Fachmodule Datenquellen direkt importieren oder Regelwerke duplizieren.

## Entscheidung

1. Der F-Gase-Check wird als eigenständiges Fachmodul innerhalb der bestehenden Modularchitektur umgesetzt.
2. Das Modul verwendet die vorhandene Modulregistrierung und `createPlatformModule`; eine parallele Runtime, Navigation, Save-/Load-, Rendering- oder PDF-Infrastruktur wird nicht eingeführt.
3. Die gemeinsame Kältemittelplattform wird unter `js/utils/refrigerants/` mit den vertraglich festgelegten Dateien `refrigerants.js`, `gwp.js`, `safety-classes.js`, `regulations.js`, `refrigerant-service.js` und `index.js` eingeführt.
4. Fachmodule greifen auf Kältemitteldaten ausschließlich über die öffentliche API von `refrigerant-service.js` beziehungsweise den Export von `index.js` zu. Direkte Imports der Datenquellen aus Fachmodulen sind unzulässig.
5. `refrigerants.js`, `gwp.js`, `safety-classes.js` und `regulations.js` enthalten Daten beziehungsweise deklarative Regeln, jedoch keine modulbezogene UI- oder Ablaufsteuerung.
6. Kältemittel-, GWP- und Rechtsdaten besitzen eigene Versionsstände. Ein gespeicherter Anlagen-Snapshot enthält die verwendeten Datenversionen.
7. Der F-Gase-Check bleibt regulatorisch abgegrenzt. EN-378-Sicherheitsberechnungen und sicherheitstechnische Bewertungen gehören nicht zu Version 1.5.0.
8. Eine spätere Datenübergabe an den EN-378-Sicherheitscheck erfolgt ausschließlich über einen versionierten Deep-Copy-Snapshot. Direkter Zugriff auf den internen State des F-Gase-Moduls oder Live-Synchronisierung sind unzulässig.
9. Für Saved Records, Projektpersistenz und PDF wird die bestehende Plattforminfrastruktur wiederverwendet. Erweiterungen erfolgen nur über bestehende Contracts beziehungsweise dokumentierte Adapter.
10. Die fachlichen Rechts- und GWP-Daten werden erst implementiert, wenn die zu verwendenden Quellen und konkreten Werte im Repository nachvollziehbar dokumentiert sind. Nicht belegte Werte werden nicht ergänzt.

## Folgen

- Die bestehende Modularchitektur bleibt erhalten.
- Gemeinsame Kältemitteldaten werden nicht in Fachmodulen dupliziert.
- Zukünftige Kältemodule erhalten einen stabilen gemeinsamen Einstiegspunkt.
- Snapshot-Kommunikation bleibt entkoppelt und serialisierbar.
- Offline- und PWA-Fähigkeit bleiben grundsätzlich erhalten, weil die Daten lokal mit der Anwendung ausgeliefert werden.
- Änderungen an Rechts- oder GWP-Daten sind anhand eigener Datenversionen nachvollziehbar.
- Der F-Gase-Check muss gegen Modul-, State-, Save-, Render- und PDF-Contracts sowie gegen die vorhandenen Quality Gates getestet werden.

## Offene fachliche Voraussetzung

Konkrete regulatorische Regeln, GWP-Werte und Rechtsquellen sind im derzeit geprüften Repository nicht als für Version 1.5.0 freigegebener Datenbestand vorhanden. Vor Implementierung dieser Inhalte ist eine belegbare Datenbasis erforderlich.

## Referenzen

- `docs/contracts/module-contract.md`
- `docs/contracts/state-contract.md`
- `docs/contracts/save-contract.md`
- `docs/contracts/render-contract.md`
- `docs/contracts/pdf-contract.md`
- `docs/adr/ADR-0008-phase47b1-flooding-verification-contract-extension.md`
- `js/platform/moduleRuntime/index.js`
- `js/platform/savedRecordModel/index.js`
- `js/shared/rainwaterSurfaceSnapshot.js`
- `js/core/pdfExport.js`
- `js/core/projectStorage.js`
