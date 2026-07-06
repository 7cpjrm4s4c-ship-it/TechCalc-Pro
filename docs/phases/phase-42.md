# Phase 42 – Architectural Consolidation

Version basis: `1.3.2-dev.36`
Status: abgeschlossen bis Phase 42E.6

## Ziel

Phase 42 konsolidiert die nach mehreren Migrations- und Stabilisierungsschritten parallel vorhandenen Architekturvertraege. Der Schwerpunkt liegt nicht auf neuen Regeln, sondern auf dem Durchsetzen der bereits dokumentierten zentralen Plattformvertraege und dem Entfernen von Legacy-Pfaden.

## Arbeitsvertrag

1. Dokumentation und Audits werden vor Codeaenderungen gelesen.
2. Bestehende Architekturentscheidungen haben Vorrang vor neuen Loesungen.
3. Neue Regeln entstehen nur, wenn kein dokumentierter Vertrag existiert oder ein bestehender Vertrag nachweislich ersetzt werden muss.
4. Legacy wird entfernt, nicht ueber zusaetzliche Guards, CSS-Hotfixdateien oder neue Sonderwege ueberbaut.
5. Nach jeder Teilphase werden Entscheidungen, Audits und Regressionen unter `docs/phases/` zusammengefasst.

## Referenzvertraege

### Save/Edit/Selection

Referenzmodule:

- `heating-cooling`
- `pressure-holding`

Diese Module zeigen den Zielablauf fuer gespeicherte Eintraege: Save/Edit-Zustand, aktive Auswahl, Hydration und zentrale Actionbindung laufen stabil ueber die Plattform-Controller.

### Diagramm-/Ausgabeinseln

Referenz-/Sondermodul:

- `hx-diagram`

Das h,x-Modul ist der einzige aktuelle Fall mit Diagramm, Prozessauswahl und Ergebnisblock als gekoppelte Ausgabeinseln. Es darf deshalb nicht wie ein reines Saved-Record-Modul behandelt werden. Saved-Selection muss Inputs, Prozessauswahl, Ergebnisblock und Diagramm synchronisieren, ohne unnoetige strukturelle Rebuilds oberhalb der Saved-Card zu erzwingen.

### Keyboard/Focus

Tab, Shift+Tab, Enter und Shift+Enter werden zentral gesteuert. Module duerfen keine eigene Tab-/Enter-Reihenfolge etablieren. Collection-Inputs werden zentral ueber die Event-Pipeline committed.

### Mobile Input

Standard-Field-Commits duerfen aktive oder naechstangetippte Eingabeelemente nicht durch Card-/Island-Rebuilds ersetzen. Trinkwasser wurde in 42E.5 als Referenzfall fuer diesen mobilen Input-Vertrag bereinigt.

## Teilphasen

| Phase | Status | Ergebnisdatei |
| --- | --- | --- |
| 42A – Dokumentations- und Vertragsaudit | abgeschlossen | `phase-42-audit.md` |
| 42B – Contract Reconciliation | abgeschlossen | `phase-42b-contract-reconciliation.md` |
| 42C – Legacy Removal | abgeschlossen | `phase-42c-legacy-removal.md` |
| 42D – Reference Contract Migration | abgeschlossen | `phase-42d-reference-contract-migration.md` |
| 42E.1 – Keyboard Navigation Contract | abgeschlossen | `phase-42e1-keyboard-navigation-contract.md` |
| 42E.2 – Legacy Keyboard Handler Removal | abgeschlossen | `phase-42e2-legacy-keyboard-handler-removal.md` |
| 42E.3 – Keyboard Regression Guard | abgeschlossen | `phase-42e3-keyboard-regression.md` |
| 42E.4 – Documentation Consolidation | abgeschlossen | `phase-42e4-documentation-consolidation.md` |
| 42E.5 – Mobile Input Contract Audit | abgeschlossen | `phase-42e5-mobile-input-contract-audit.md` |
| 42E.6 – Architecture Cleanup and Closure | abgeschlossen | `phase-42e6-architecture-cleanup.md` |

## Konsolidierter Stand

- Save/Edit/Selection nutzt den bestaetigten zentralen Vertrag.
- Scroll-Stabilitaet wird ueber zentrale Anchors und minimale DOM-Mutationen erreicht, nicht ueber lokale Restore-Ketten.
- h,x bleibt nur beim Renderziel ein Sonderfall; der Save-/Selection-Vertrag bleibt zentral.
- Keyboard-/Focus-Navigation wird zentral ueber Event-Pipeline und Focus-Graph gesteuert.
- Trinkwasser-Standardfelder laufen wieder ueber den zentralen Mobile-Input-Vertrag.
- `npm run audit:keyboard-contract` ist Bestandteil des Integration-Gates.
- Neue CSS-Hotfixdateien oder additive Stability-Schichten sind fuer Phase-42-Themen nicht zulaessig.

## Naechster Schritt

Phase 42 ist abgeschlossen. Die naechste Phase kann sich auf RC-Vorbereitung, gezielte Regression oder Release-Candidate-Haertung stuetzen, darf aber keine neuen Parallelvertraege fuer Save, Selection, Render, Scroll, Keyboard, Mobile Input oder Theme einfuehren.
