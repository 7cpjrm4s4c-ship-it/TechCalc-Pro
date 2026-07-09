## 1.3.3-rc.1 – Release Candidate

- Phase 45E.4 bis 45E.6 nachgezogen und dokumentiert.
- Modulvertrag auf Stand 1.3.3 finalisiert: `heat-recovery` und `mixed-air` sind getrennte Fachmodule mit eigener Persistenz, Records, PDF- und Projektlebenszyklus-Integration.
- Architecture Baseline 1.3.3 als verbindliche Referenz für künftige Änderungen ergänzt.
- Architecture Review 45E.5 abgeschlossen: Modulgrenzen, QM, Contracts, Legacy-Migration und Shared-Abhängigkeiten geprüft.
- Release Preparation 45E.6 ergänzt: Changelog, Migrationsleitfaden und RC-Checkliste für 1.3.3 erstellt.
- Release Notes im App-Menü auf `1.3.3-rc.1` aktualisiert.
- Keine fachlichen Anwendungscode-Änderungen gegenüber der bestätigten Modulsplitting-Funktion.

## 1.3.3-dev.8 – Phase 45E.3 Documentation Minimization

- Historische Audit-Rohdaten und alte Zwischenartefakte aus dem aktiven Development-ZIP entfernt.
- `docs/audits/AUDIT_HISTORY.md` als konsolidierte Audit-Historie ergänzt.
- `docs/archive/ARCHIVE_MANIFEST.md` als Nachweis der entfernten historischen Dateien ergänzt.
- Dokumentationsindex und Audit-README auf minimale aktive Referenzstruktur aktualisiert.
- Keine fachlichen Anwendungscode-Änderungen.

## 1.3.3-dev.7 – Phase 45E.2 Documentation Consolidation & Quality Manual

- Quality Manual unter `docs/qm/` eingeführt.
- Bisherige Auditlandschaft als historischen Nachweisbereich konsolidiert.
- Dokumentationsindex, Audit-README und Phasenindex aktualisiert.
- Modulvertrag auf QM-Referenzen erweitert.
- Keine fachlichen Anwendungscode-Änderungen.

## 1.3.3-dev.6 – Phase 45E.1 Documentation Cleanup

- Phase-45D-Regressionsdokument ergänzt.
- Modulvertrag auf den aktuellen Modulbestand 1.3.3 aktualisiert.
- Dokumentationsindex und Phasenindex bereinigt.
- Documentation-Cleanup-Audit ergänzt.
- Keine Anwendungscode-Änderungen.

## 1.3.3-dev.5 – Phase 45C.2 Legacy Saved Records Migration

- Legacy-Saved-Records-Migration für WRG/Mischluft ergänzt.
- Mischluft-Records ohne zuverlässiges Mode-Label werden über Mischluft-Felder erkannt.
- WRG-Saved-Records und Mischluft-Saved-Records werden beim Laden alter Projekte getrennt.
- Regressionstest `phase45c2-legacy-saved-records-migration.test.mjs` ergänzt.

## 1.3.3-dev.4 – Phase 45C.1 Project Lifecycle Integration

- Mischluft-Speicherdialog ergänzt.
- `mixed-air` in Saved-Record-Workflow, Dirty-State und Projektlebenszyklus eingebunden.
- Laden alter WRG/Mischluft-Projekte erweitert.
- Legacy-Mischluftdaten werden nach `mixed-air` migriert.

## 1.3.3-dev.3 – Phase 45C Modulsplitting Implementierung

- Kombimodul fachlich getrennt: `heat-recovery` bleibt Wärmerückgewinnung, `mixed-air` ist neues Mischluft-Modul.
- Altprojekt-Migration ergänzt: Mischluftfelder aus historischen `heat-recovery`-States werden in `mixed-air` übernommen.
- Navigation, Lazy-Loading, Project Storage und Runtime-Verträge auf getrennte Module erweitert.

## 1.3.3-dev.2 – Phase 45B Modulsplitting Design Review

- Zielarchitektur für Trennung von WRG und Mischluft festgelegt.
- Modul-IDs entschieden: `heat-recovery` bleibt WRG, `mixed-air` wird neues Mischluft-Modul.
- ADR-0006 und WRG/Mischluft-Splitting-Contract ergänzt.
- Migrations-, PDF-/Export- und Regressionserwartungen für 45C/45D definiert.
- Keine funktionalen Änderungen an App, Berechnungslogik, Persistenz, PDF, PWA oder UI.

## 1.3.3-dev.1 – Phase 45A Modulsplitting-Analyse

- Version 1.3.2 fachlich abgeschlossen und 1.3.3 als Modulsplitting-Stream gestartet.
- Bestehendes Kombimodul `heat-recovery` hinsichtlich WRG-/Mischluft-Kopplung analysiert.
- Trennschnitt, Risiken, Aufwand und notwendige Regressionen dokumentiert.
- Keine funktionalen Änderungen an App, Berechnungslogik, Persistenz, PDF, PWA oder UI.

## 1.3.2-dev.36 – Phase 38F Minification Preparation

- Phase 38F ergänzte die reproduzierbare Minification- und Build-Artefakt-Vorbereitung für den damaligen RC-Pfad.

## 1.3.2-dev.35 – Phase 37E RC Closure

- Phase 37E schloss die App-Shell-, Performance- und Release-Candidate-Vorbereitung für den damaligen Entwicklungsstand ab.
- Shell-Controller, Service-Worker-Precache und konsolidierte Test-Gates wurden als RC-Voraussetzung geprüft.

## 1.3.2-rc.1 – Release Candidate

- Gate 10 nach Phase 44B/44B.5 fachlich geschlossen.
- Browser-Konsole geprüft: keine JavaScript Runtime Errors, keine TypeError/ReferenceError, keine unhandled Promise Rejections sichtbar.
- Formspree-Feedback funktioniert; Spam-Einstufung bei Chrome/Formspree als externer Zustellhinweis dokumentiert.
- RC-Paket aus bereinigtem Development-Stand ohne dist/, node_modules/, Cache- oder Report-Artefakte erstellt.
