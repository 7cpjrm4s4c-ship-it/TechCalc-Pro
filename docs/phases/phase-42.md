# Phase 42 – Architectural Consolidation

Version basis: `1.3.2-dev.36`
Status: Phase 42A–42E.4 completed as architectural consolidation baseline

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

## Teilphasen

### 42A – Dokumentations- und Vertragsaudit

Status: abgeschlossen.

Ergebnisdateien:

- `docs/phases/phase-42-audit.md`
- `docs/phases/phase-42-decisions.md`
- `docs/phases/phase-42-checklist.md`

In 42A wurden keine Runtime-Dateien geaendert.

### 42B – Legacy-Vertrag identifizieren und Zielvertrag festlegen

Noch offen. Grundlage ist das 42A-Audit.

### 42C – Legacy Removal

Noch offen. Erst nach Freigabe von 42B.

### 42D – Modulweise Konsolidierung

Noch offen. Reihenfolge wird nach 42B festgelegt.

## Aktuelle Leitentscheidung aus 42A

Der zentrale Vertrag existiert bereits. Phase 42 darf ihn nicht durch einen neuen Vertrag ersetzen. Die naechsten Schritte muessen die noch vorhandenen Legacy-Pfade gegen diesen Vertrag aufloesen:

- `savedCalculationController` / `savedRecordController`
- `lineSectionController`
- `eventPipeline`
- `scrollManager`
- modulare Dynamic-Renderer



### 42B – Contract Reconciliation

Status: abgeschlossen.

Ergebnisdatei:

- `docs/phases/phase-42b-contract-reconciliation.md`

42B hat keine Runtime-Dateien geaendert. Ergebnis ist die verbindliche Auslegung der bestehenden Saved-/Selection-/Render-/Scroll-Vertraege fuer 42C.

### 42C – Legacy Removal

Status: abgeschlossen.

Ergebnisdatei:

- `docs/phases/phase-42c-legacy-removal.md`

42C hat Runtime-Code geaendert, aber keine neuen Architekturregeln eingefuehrt. Entfernt bzw. aufgeloest wurden vor allem fruehe Saved-Selection-Pointerpfade und Full-Card-Rebuilds in Dynamic-Renderern. Der bestehende Line-Section- und Outlet-Vertrag bleibt massgeblich.


## Konsolidierter Stand nach 42E.5

- Phase 42A bis 42E.5 sind abgeschlossen.
- Save/Edit/Selection nutzt den bestaetigten zentralen Vertrag.
- Scroll-Stabilitaet wird ueber zentrale Anchors und minimale DOM-Mutationen erreicht, nicht ueber lokale Restore-Ketten.
- h,x bleibt nur beim Renderziel ein Sonderfall; der Save-/Selection-Vertrag bleibt zentral.
- Keyboard-/Focus-Navigation wird zentral ueber Event-Pipeline und Focus-Graph gesteuert.
- `npm run audit:keyboard-contract` ist Bestandteil des Integration-Gates.
- Neue CSS-Hotfixdateien oder additive Stability-Schichten sind fuer Phase-42-Themen nicht zulaessig.

Verbindliche Detaildokumente sind die `phase-42*` Dateien in `docs/phases/`.


### 42E.5 – Mobile Input Contract Audit

Status: abgeschlossen.

Ergebnisdatei:

- `docs/phases/phase-42e5-mobile-input-contract-audit.md`

42E.5 bestaetigt, dass mobile Trinkwasser-Eingabefehler nicht durch den zentralen KeyboardController verursacht wurden. Die Ursache war ein lokaler Standard-Field-Listener im Trinkwasser-Modul, der waehrend nativer `blur`-/`change`-Abläufe den Input-Island neu gerendert hat. Normale `[data-field]` Eingaben gehoeren jetzt wieder ausschliesslich dem zentralen Event-/Input-Vertrag; Trinkwasser-spezifisch bleiben nur Collection-/Draft-Controls.
