# ADR-0009: F-Gase-Check und gemeinsame Kältemittelplattform

Status: Angenommen und für Version 1.5.0 umgesetzt
Datum: 2026-08-26
Final geprüft: 2026-08-28
Version: 1.5.0

## Kontext
Version 1.5.0 erweitert TechCalc Pro um das eigenständige Fachmodul `f-gases-check`. Die bestehende Plattform stellt Fachmodule über `js/modules`, zentrale Registrierung, `createPlatformModule`, Saved Records, PDF-Infrastruktur und projektweite Persistenz bereit. Für modulübergreifende Datenübernahme besteht ein versioniertes Deep-Copy-Snapshot-Muster.

Der F-Gase-Check benötigt gemeinsame Kältemittelstammdaten, GWP-Daten, Sicherheitsklassen und regulatorische Regeln. Diese Daten sollen auch zukünftigen Kälte-, Klima- und Wärmepumpenmodulen zur Verfügung stehen, ohne dass Fachmodule Datenquellen direkt importieren oder Regelwerke duplizieren.

## Entscheidung
1. Der F-Gase-Check ist ein eigenständiges Fachmodul innerhalb der bestehenden Modularchitektur.
2. Das Modul verwendet die vorhandene Modulregistrierung und Plattform-Runtime; parallele Navigation, Save-/Load-, Rendering- oder PDF-Infrastruktur ist unzulässig.
3. Die gemeinsame Kältemittelplattform liegt unter `js/utils/refrigerants/` und kapselt Kältemittel-, GWP-, Sicherheitsklassen- und regulatorische Daten.
4. Fachmodule greifen auf Kältemitteldaten ausschließlich über die öffentliche API von `refrigerant-service.js` beziehungsweise `index.js` zu.
5. Datenmodule enthalten keine modulbezogene UI- oder Ablaufsteuerung.
6. Kältemittel-, GWP- und Rechtsdaten besitzen eigene Versionsstände; gespeicherte Anlagen-Snapshots führen die verwendeten Datenversionen mit.
7. EN-378-Sicherheitsberechnungen und sicherheitstechnische Bewertungen gehören nicht zu Version 1.5.0.
8. Eine spätere Datenübergabe an einen EN-378-Sicherheitscheck erfolgt ausschließlich über einen versionierten Deep-Copy-Snapshot.
9. Saved Records, Projektpersistenz und PDF verwenden die bestehende Plattforminfrastruktur und dokumentierte Adapter.
10. Regulatorische Regeln und GWP-Werte müssen durch im Repository dokumentierte Quellen belegbar sein; nicht belegte Werte werden nicht ergänzt.
11. Regulatorische Zeitbezüge für Inverkehrbringen, Inbetriebnahme und Bestandsprüfung werden getrennt geführt.
12. Serviceverbote und HFKW-Quoten werden fachlich getrennt bewertet; die Quote wird nicht als direktes Wartungs- oder Verwendungsverbot interpretiert.

## Umgesetzte Datenbasis
Für Version 1.5.0 sind die verwendeten Rechts- und GWP-Grundlagen im Repository dokumentiert. Dazu gehören VO (EU) 2024/573, ChemG, ChemKlimaschutzV sowie die dokumentierte UBA-GWP-Datenbasis. Die konkrete Regelzerlegung und Quellenzuordnung ist in `docs/engineering/f-gases-rule-matrix.md` und `docs/engineering/f-gases-refrigerant-data.md` nachvollziehbar.

## Folgen
- Die bestehende Modularchitektur bleibt erhalten.
- Gemeinsame Kältemitteldaten werden nicht in Fachmodulen dupliziert.
- Snapshot-Kommunikation bleibt entkoppelt und serialisierbar.
- Offline- und PWA-Fähigkeit bleiben erhalten, da die Daten lokal ausgeliefert und precached werden.
- Änderungen an Rechts- oder GWP-Daten bleiben anhand eigener Datenversionen nachvollziehbar.
- Der F-Gase-Check wird gegen Modul-, State-, Save-, Render-, PDF- und dedizierte F-Gase-Tests geprüft.

## Referenzen
- `docs/contracts/f-gases-check-contract.md`
- `docs/contracts/module-contract.md`
- `docs/contracts/state-contract.md`
- `docs/contracts/save-contract.md`
- `docs/contracts/render-contract.md`
- `docs/contracts/pdf-contract.md`
- `docs/engineering/f-gases-rule-matrix.md`
- `docs/engineering/f-gases-refrigerant-data.md`
- `js/utils/refrigerants/refrigerant-service.js`
- `js/shared/fGasesSystemSnapshot.js`
- `js/core/pdfExport.js`
- `js/core/projectStorage.js`
