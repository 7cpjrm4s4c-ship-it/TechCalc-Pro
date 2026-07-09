# TechCalc Pro Documentation Index

Status: aktualisiert in Version 1.3.3-rc.1 / Phase 45E.6

Dieser Index ist der zentrale Einstiegspunkt der Projektdokumentation. Ab Version 1.3.3 ist die Dokumentation nach Verantwortlichkeit getrennt: Phasen dokumentieren Historie, ADRs dokumentieren Entscheidungen, Contracts dokumentieren Schnittstellen, das Quality Manual dokumentiert dauerhafte Qualitätsstandards.

## Aktive Struktur

- `docs/qm/` – zentrale Qualitätsreferenz und konsolidierte Audit-/Gate-Standards.
- `docs/phases/` – nachvollziehbare Phasendokumentation des Projektwegs.
- `docs/contracts/` – verbindliche Architektur-, Modul- und Plattformverträge.
- `docs/adr/` – Architecture Decision Records.
- `docs/engineering/` – Engineering Guide, Branching, Reviews, Release- und Testprozesse.
- `docs/architecture/` – stabile Architekturgrundlagen mit historischem Referenzwert.
- `docs/audits/` – konsolidierte Audit-Historie; aktuelle Prüfkriterien liegen im QM.
- `docs/release/` – Release- und Migrationsunterlagen.
- `docs/archive/` – historische oder ersetzte Dokumente mit Nachvollziehbarkeitswert.
- `docs/legal/` – rechtliche Dokumente.
- `docs/security/` – sicherheitsbezogene Prüfstände.

## Maßgebliche Referenzen für 1.3.3

- `docs/qm/QM-001-Quality-Manual.md` – zentrale Qualitätsreferenz.
- `docs/contracts/module-contract.md` – aktueller Modulvertrag und Modulbestand.
- `docs/contracts/wrg-mixed-air-splitting-contract.md` – Detailvertrag für Wärmerückgewinnung/Mischluft.
- `docs/adr/ADR-0005-phase-change-control.md` – verbindlicher Phasenprozess.
- `docs/adr/ADR-0006-wrg-mixed-air-module-splitting.md` – Architekturentscheidung zum Modulsplitting.
- `docs/phases/phase-45a-modulsplitting-analysis.md` bis `docs/phases/phase-45e2-documentation-consolidation-quality-manual.md` – vollständiger Weg von Version 1.3.3.

## Dokumentationsphilosophie

- Phasen beantworten: Was wurde geändert?
- ADRs beantworten: Warum wurde so entschieden?
- Contracts beantworten: Wie arbeiten Module und Plattform zusammen?
- QM beantwortet: Welche Qualitätsregeln gelten dauerhaft?
- Audits beantworten: Welcher historische Nachweis wurde zu einem Zeitpunkt erbracht?

## Root Policy

Der Projekt-Root enthält nur runtime-, build- oder release-relevante Dateien. Neue Phasen-, Audit-, QM- oder Architekturunterlagen werden unter `docs/` gepflegt.

## Qualitätsregeln

- Ein Thema hat genau eine aktive Referenz.
- Jede neue Phase besitzt eine Phasendokumentation unter `docs/phases/`.
- Jeder verbindliche Architekturvertrag liegt unter `docs/contracts/`.
- Jede Architekturentscheidung besitzt eine ADR unter `docs/adr/`.
- Dauerhafte Qualitätsanforderungen werden im QM gepflegt.
- Historische Detailartefakte werden nicht mehr vollständig im Development-ZIP mitgeführt; ihr Entfall ist im Archivmanifest dokumentiert.


## Minimierungsregel

Das aktive Development-ZIP enthält nur noch Dokumente mit aktuellem Referenzwert oder zwingendem Nachvollziehbarkeitswert: QM, Contracts, ADRs, Phasen, Release-/Migrationsunterlagen, Engineering-Standards und kompakte Archiv-/Audit-Indizes. Historische Rohdaten, JSON-Prüfberichte, CSS-Zwischenstände und alte Einzel-Audits werden nicht mehr mit ausgeliefert.

## Aktueller Entwicklungsstand

- 1.3.4-dev.1 / Phase 46A: Toolchain Cleanup & Consolidation
- 1.3.4-dev.2 / Phase 46B: Security Hardening
