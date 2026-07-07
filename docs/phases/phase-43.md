# Phase 43 – Engineering Baseline

Version basis: `1.3.2-dev.36-phase42e6`
Status: gestartet mit Phase 43A

## Ziel

Phase 43 etabliert eine dauerhafte Engineering-Baseline fuer TechCalc Pro. Nach Phase 42 sind die zentralen Architekturvertraege konsolidiert; Phase 43 definiert nun, wie kuenftige Aenderungen geplant, umgesetzt, reviewed, getestet und dokumentiert werden.

## Teilphasen

| Phase | Ziel | Status |
| --- | --- | --- |
| 43A – Engineering Standards | Entwicklungsprozess, Branching, Commits, Review, Regression, Release | abgeschlossen |
| 43B – Architecture Contracts | dauerhafte Contracts aus Phase 42 herausloesen | geplant |
| 43C – Engineering Audits | automatisierte Guards fuer Architekturregeln erweitern | geplant |
| 43D – RC Baseline | Release-Candidate-Gates fuer 1.3.2 definieren und pruefen | geplant |

## Grundregeln ab Phase 43

1. Dokumentation und Contracts werden vor Codeaenderungen geprueft.
2. Aenderungen erfolgen in kleinen, reviewbaren Patches.
3. Querschnittsthemen werden zentral geloest.
4. Legacy wird entfernt, nicht ueberbaut.
5. Keine neuen Hotfix-Schichten ohne dokumentierte Ausnahme.
6. Jede Phase endet mit Test, Build und Dokumentation.

## Ergebnis von 43A

- `docs/engineering/` eingefuehrt.
- `docs/contracts/` als langfristiger Contract-Ort vorbereitet.
- `docs/adr/` fuer Architecture Decision Records vorbereitet.
- Engineering Guide, Branch-Strategie, Commit-Konvention, Review-, Regression-, Release- und Testing-Checklisten angelegt.
- Keine Runtime-/CSS-/Modulmechanismen geaendert.
