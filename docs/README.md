# TechCalc Pro Documentation Index

Status: aktualisiert für Version 1.4.0 / Abschluss Phase 47

Dieser Index ist der zentrale Einstiegspunkt der Projektdokumentation. Die Dokumentation ist nach Verantwortlichkeit getrennt: Phasen dokumentieren Historie, ADRs dokumentieren Entscheidungen, Contracts dokumentieren Schnittstellen, das Quality Manual dokumentiert dauerhafte Qualitätsstandards und Audits dokumentieren konkrete Prüfevidenz.

## Aktive Struktur

- `docs/qm/` – zentrale Qualitätsreferenz und konsolidierte Audit-/Gate-Standards.
- `docs/phases/` – nachvollziehbare Phasendokumentation des Projektwegs.
- `docs/contracts/` – verbindliche Architektur-, Modul- und Plattformverträge.
- `docs/adr/` – Architecture Decision Records.
- `docs/engineering/` – Engineering Guide, Branching, Reviews, Release- und Testprozesse.
- `docs/architecture/` – stabile Architekturgrundlagen.
- `docs/audits/` – konkrete Audit- und Gate-Evidenz.
- `docs/releases/` – Release- und Checklistenunterlagen.
- `docs/archive/` – historische oder ersetzte Dokumente mit Nachvollziehbarkeitswert.
- `docs/legal/` – rechtliche Dokumente.
- `docs/security/` – sicherheitsbezogene Prüfstände.

## Maßgebliche Referenzen für Phase 47 / Version 1.4.0

- `docs/phases/phase-47-final-summary.md` – konsolidierter Abschlussbericht und finaler Freigabestatus.
- `docs/phases/phase-47d-regression.md` – finale Regression, Browser-, Plattform- und Gate-Matrix.
- `docs/contracts/flooding-verification-contract.md` – verbindlicher Fach- und Modulvertrag.
- `docs/contracts/module-contract.md` – zentraler Modulvertrag.
- `docs/adr/ADR-0007-flooding-verification-module-architecture.md` – Architekturentscheidung zum Fachmodul.
- `docs/adr/ADR-0008-phase47b1-flooding-verification-contract-extension.md` – Contract- und DWA-/PDF-/Snapshot-Architektur.
- `docs/releases/1.4.0.md` – Releasebeschreibung.
- `docs/releases/1.4.0-release-checklist.md` – Freigabe- und Post-Merge-Checkliste.
- `docs/audits/json/phase47-final-release-gate.json` – maschinenlesbare finale Gate-Evidenz.

## Dokumentationsphilosophie

- Phasen beantworten: Was wurde geändert?
- ADRs beantworten: Warum wurde so entschieden?
- Contracts beantworten: Wie arbeiten Module und Plattform zusammen?
- QM beantwortet: Welche Qualitätsregeln gelten dauerhaft?
- Audits beantworten: Welcher konkrete Nachweis wurde erbracht?

## Root Policy

Der Projekt-Root enthält nur runtime-, build- oder release-relevante Dateien. Neue Phasen-, Audit-, QM- oder Architekturunterlagen werden unter `docs/` gepflegt.

## Qualitätsregeln

- Ein Thema hat genau eine aktive Referenz.
- Jede neue Phase besitzt eine Phasendokumentation unter `docs/phases/`.
- Jeder verbindliche Architekturvertrag liegt unter `docs/contracts/`.
- Jede Architekturentscheidung besitzt eine ADR unter `docs/adr/`.
- Dauerhafte Qualitätsanforderungen werden im QM gepflegt.
- Historische Detailartefakte werden nur bei Nachvollziehbarkeitswert weitergeführt.

## Aktueller Entwicklungsstand

- 1.4.0 / Phase 47: Überflutungs- und Rückhaltenachweis vollständig implementiert.
- Phase 47D: Regression und Plattformfreigabe bestanden.
- Enterprise-/QM-Status: **GO zum Merge**.
- Post-Merge: Produktionsdeploy, Produktions-Smoke-Test, finales Versioning, Tag und GitHub Release gemäß Releaseprozess.
