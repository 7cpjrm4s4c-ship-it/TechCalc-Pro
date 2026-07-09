# Phase 43 – Engineering Baseline

Version basis: `1.3.2-dev.36-phase42e6`
Status: gestartet mit Phase 43A

## Ziel

Phase 43 etabliert eine dauerhafte Engineering-Baseline fuer TechCalc Pro. Nach Phase 42 sind die zentralen Architekturvertraege konsolidiert; Phase 43 definiert nun, wie kuenftige Aenderungen geplant, umgesetzt, reviewed, getestet und dokumentiert werden.

## Teilphasen

| Phase | Ziel | Status |
| --- | --- | --- |
| 43A – Engineering Standards | Entwicklungsprozess, Branching, Commits, Review, Regression, Release | abgeschlossen |
| 43B – Repository Cleanup | Root- und Dokumentationsstruktur bereinigen | abgeschlossen |
| 43C – Architecture Contracts | dauerhafte Contracts aus Phase 42 herausloesen | abgeschlossen |
| 43D – Engineering Audits | automatisierte Guards fuer Architekturregeln erweitern | geplant |
| 43E – RC Baseline | Release-Candidate-Gates fuer 1.3.2 definieren und pruefen | geplant |

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


## Ergebnis von 43B

- Top-level `docs/` von detaillierten Legacy-Phase-Ordnern bereinigt.
- Phase-36-/Phase-38-Detailartefakte nach `docs/archive/legacy-phase-docs/` verschoben.
- Phase-40-/Phase-41-Dateien unter `docs/phases/` eingeordnet.
- Archiv-README ergänzt.
- Keine Runtime-/CSS-/Modulmechanismen geaendert.

## Ergebnis von 43C

- Dauerhafte Architekturvertraege unter `docs/contracts/` angelegt.
- Keyboard, Save/Edit, Selection, Render, State, Event, Theme, Module und PDF als aktive Contracts dokumentiert.
- Phase-42-Erkenntnisse aus historischen Phasendokumenten in langfristige Contract-Dateien ueberfuehrt.
- Keine Runtime-/CSS-/Modulmechanismen geaendert.

## Phase 43E - Trinkwasser Keyboard Regression Fix

- Trinkwasser-Regression aus Phase 42E.5 nachgezogen.
- Der zentrale Focus-Graph umfasst jetzt alle Modul-Buttons innerhalb des Modul-Roots, nicht nur `.tc-save-actions`.
- Dadurch kann Tab/Shift+Tab/Enter/Shift+Enter nicht mehr an Trinkwasser-spezifischen Action-Buttons aus dem zentralen Vertrag herausfallen.
- Globale Navigation/Header bleiben ausgeschlossen, weil der Focus-Graph pro Modul-Root gebunden wird.

## 43E.1 – Workspace Outer Frame Cleanup

Status: abgeschlossen.

Der visuelle Rahmen auf den übergeordneten Workspace-/Module-Containern wurde entfernt. Layout-Container wie `app-main`, `module-view`, `module-content`, `tc-grid` und `grid-12` dürfen keine eigenen Rahmen, Outlines oder Shadows rendern. Sichtbare Rahmen bleiben ausschließlich den echten UI-Komponenten vorbehalten: Cards, Controls, Navigation und Fokuszuständen auf bedienbaren Elementen.

