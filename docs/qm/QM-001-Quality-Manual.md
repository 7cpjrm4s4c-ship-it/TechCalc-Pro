# QM-001 Quality Manual

Status: verbindlich ab Version 1.3.3-dev.7  
Phase: 45E.2 Documentation Consolidation & Quality Management Foundation

## Zweck

Das Quality Manual ist die zentrale Qualitätsreferenz für TechCalc Pro. Es ersetzt verstreute aktive Audit-Listen als dauerhafte Referenz. Historische Audits bleiben als Nachweise erhalten, definieren aber nicht mehr den aktuellen Qualitätsstandard.

## Qualitätsprinzipien

1. Fachmodule bleiben fachlich abgegrenzt und über Contracts angebunden.
2. Änderungen folgen dem Prozess Analyse → Design Review → Implementierung → Regression → Dokumentation.
3. Jede Änderung muss gegen Referenzmodule und betroffene Plattformverträge geprüft werden.
4. Releasefähigkeit entsteht erst nach grünen Build-, Test-, PWA-, Browser- und Dokumentationsgates.
5. Dokumentation ist Bestandteil der Definition of Done, nicht nachgelagerte Kosmetik.

## Verbindliche Referenzen

- Entwicklungsprozess: `docs/qm/QM-002-Development-Process.md`
- Architekturregeln: `docs/qm/QM-003-Architecture-Rules.md`
- Release Gates: `docs/qm/QM-004-Release-Gates.md`
- Teststrategie: `docs/qm/QM-005-Test-Strategy.md`
- Regression: `docs/qm/QM-006-Regression-Standard.md`
- PWA: `docs/qm/QM-007-PWA-Standard.md`
- Browser: `docs/qm/QM-008-Browser-Compatibility.md`
- PDF: `docs/qm/QM-009-PDF-Quality.md`
- Performance: `docs/qm/QM-010-Performance.md`
- Accessibility: `docs/qm/QM-011-Accessibility.md`
- Dokumentation: `docs/qm/QM-012-Documentation-Standard.md`
- Testmatrix: `docs/qm/QM-013-Test-Matrix.md`

## Verhältnis zu Audits

Die Dateien unter `docs/audits/` sind historische Nachweise, Baselines oder phasenbezogene Prüfprotokolle. Neue Prüfanforderungen werden nicht mehr als konkurrierende Audit-Referenzen gepflegt, sondern in den passenden QM-Kapiteln konsolidiert.
