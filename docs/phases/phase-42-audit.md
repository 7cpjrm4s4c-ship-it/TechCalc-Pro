# Phase 42A – Documentation and Contract Audit

Version basis: `1.3.2-dev.36`
Status: completed
Runtime changes: none

## Scope

42A liest und konsolidiert die vorhandenen Architektur-, Audit- und Phasendokumente. Ziel ist ein belastbarer Entscheidungsstand vor weiteren Codeaenderungen.

Gepruefte Dokumentationsbereiche:

- `docs/architecture/`
- `docs/audits/`
- `docs/archive/phase-artifacts/`
- `docs/phase36/`
- `docs/phase38/`
- `docs/phases/`
- `docs/release/`
- `docs/release-notes/`
- `docs/phase40*.md`
- `docs/phase41*.md`

## Relevante bestehende Vertrage

### Modulvertrag

Quelle: `docs/architecture/MODULE_CONTRACT_1_3_0.md`

Verbindliche Regeln:

- Module liefern Fachlogik, State, Schema und Adapter.
- Module duerfen keine eigenen UI-Regeln, Scroll-Fixes oder Saved-Record-Listen neu erfinden.
- Zentrale Schichten fuer diese Themen sind bereits definiert:
  - `scrollManager.js`
  - `savedCalculationController.js`
  - `savedRecordController.js`
  - `uiSystem` / `tc-*` Primitive

Bewertung fuer Phase 42: Es ist kein neuer Save-/Scroll-Vertrag zu erfinden. Die Aufgabe ist, vorhandene Legacy-Pfade zu entfernen und alle Module auf den bestehenden Vertrag zu bringen.

### Plattform-Refactor

Quelle: `docs/architecture/PLATFORM_REFACTOR_1_3_0.md`

Bestehende harte Regel:

> Module duerfen fuer gespeicherte Berechnungen keine eigenen Save/Update/Load/Delete-Handler mehr implementieren. Neue oder migrierte Module nutzen ausschliesslich `bindSavedCalculationActions` oder einen daraus abgeleiteten zentralen Controller.

Weitere relevante Regel:

> Auswahl, Abwahl und Loeschen gespeicherter Inhalte verursachen keine Scroll-Spruenge.

Bewertung fuer Phase 42: `createLineSectionController` ist ein abgeleiteter zentraler Controller und darf Referenz bleiben. Modulinterne Sonderhandler, lokale Scroll-Restore-Ketten und lokale DOM-Rebuilds muessen dagegen kritisch behandelt werden.

### Quality Gates

Quelle: `docs/architecture/QUALITY_GATES_1_3_0.md`

Relevante Regeln:

- Saved Records und Scroll-Verhalten werden zentral gesteuert.
- Legacy-Klassen waren fuer bestehende Module toleriert, aber Zielzustand ist 0 Legacy-UI-Treffer.
- Mobile Scroll-Stabilitaet soll ueber stabile Anchors statt nur absolute `scrollY`-Restaurierung abgesichert werden.

Bewertung fuer Phase 42: Absolute Restore-Ketten sind hoechstens Kompatibilitaetswerkzeug, nicht Zielarchitektur. Die bevorzugte Richtung sind stabile Inseln, stabile Anchors und weniger strukturelle Rebuilds.

### UI-System

Quelle: `docs/architecture/UI_SYSTEM_1_3_0.md` und spaetere 1.3.2-Theme-Arbeit

Relevante Regeln:

- UI-Muster muessen zentral als `tc-*` Primitive entstehen.
- Modulbezogene Klassen sind Legacy-Aliasse, nicht Zielzustand.
- Fachliche Eventbindung erfolgt ueber `data-*`, nicht ueber Stylingklassen.

Bewertung fuer Phase 42: CSS-/Theme-Themen sind nicht Hauptursache der Scrollspruenge. Trotzdem duerfen keine neuen CSS-Hotfixdateien oder doppelte Light-Theme-Regeln entstehen.

## Historische Befunde zu Saved Records und Scroll

### Phase 17C.5

Quelle: `docs/archive/phase-artifacts/PHASE_17C5_REFERENCE_EVENT_SCROLL_FIXES.md`

Wichtiger Befund:

- Einmalige Capture-Listener auf wiederverwendetem App-Root konnten alte Modul-Closures behalten.
- SavedRecord- und Segmentaktionen mussten pro Event den aktuellen Modulkontext lesen.
- Nach strukturellen Re-Renders wurde ein zentraler Scroll-Clamp eingefuehrt.

Bewertung fuer Phase 42: Neben Layout-Shift muss auch auf stale root contexts / stale handler geprueft werden. Das gilt besonders bei Modulen, die `registerCentralActions` und eigene Dynamic-Renderer kombinieren.

### Phase 36G

Quelle: `docs/phase36/PHASE_36G_SAVED_RECORD_PATH_AUDIT.md`

Wichtiger Befund:

- Regenwasser und Schmutzwasser sollten nur noch genau einen `createLineSectionController`-Pfad besitzen.
- Keine eigenen `savedRecords()` Exporte, keine separaten Saved-Record-Dynamic-Attribute.

Bewertung fuer Phase 42: Regenwasser muss erneut gegen diesen Audit geprueft werden, weil der Scrollsprung dort noch besteht. Ziel ist nicht ein zweiter Pfad, sondern die korrekte Nutzung des einen Pfades.

### Phase 36K / 36O / 36N

Quellen:

- `docs/phase36/PHASE_36K_HX_SAVED_PROCESS_ROWS_ONLY.md`
- `docs/phase36/PHASE_36N_HX_SCROLL_FREEZE.md`
- `docs/phase36/PHASE_36O_SPACING_CLEANUP_AND_HX_SCROLL_FINAL.md`

Wichtige Befunde:

- h,x-Scrollsprung wurde historisch durch Saved-Process-Aktionen ausgeloest.
- Rows-only-Update beseitigte Scrollspruenge, liess aber die Gefahr veralteter Diagramm-/Result-/Process-Islands entstehen.
- Scroll-Freeze war als lokaler h,x-Fix dokumentiert, sollte aber globalen `lineSectionController` nicht veraendern.

Bewertung fuer Phase 42: Die dev36-Regression bestaetigt, dass rows-only fuer h,x unvollstaendig ist. Richtiger Zielzustand ist nicht "Ausgabeinseln nicht rendern", sondern "Ausgabeinseln differenziell und layoutstabil aktualisieren".

### Phase 36S

Quelle: `docs/phase36/PHASE_36S_DEEP_AUDIT_PRELIMINARY.md`

Wichtige Befunde:

- h,x und Trinkwasser hatten lokale Keydown-/Focus-Pfade und direkte `innerHTML`-Zuweisungen.
- Problemkandidaten waren lokale Handler, fehlende zentrale Pipeline oder durch `stopImmediatePropagation()` blockierte zentrale Handler.

Bewertung fuer Phase 42: Tab-/Enter- und Scrollthemen duerfen nicht isoliert betrachtet werden. Lokale Keydown-, Focus- und Dynamic-Render-Pfade koennen mit Saved-Selection kollidieren.

### Phase 36W.2D bis 36W.2I

Quellen:

- `docs/phase36/PHASE_36W2D_RAINWATER_LIVE_SELECTION_HYDRATION.md`
- `docs/phase36/PHASE_36W2I_RAINWATER_DRAIN_PRECOMMIT_CAPTURE.md`

Wichtige Befunde:

- Regenwasser hatte bereits Probleme, bei Live-Selection und Lookup-Hydration korrekt in Inputs und Anzeigen zu synchronisieren.
- Capture-Phase Precommit wurde eingefuehrt, weil die zentrale Root-Pipeline sonst vor lokalen Patches rendern konnte.

Bewertung fuer Phase 42: Regenwasser besitzt vermutlich weiterhin eine empfindliche Reihenfolge aus Precommit, zentraler Pipeline, Hydration und Dynamic-Render. Scrollsprung und Hydration muessen deshalb gemeinsam analysiert werden.

## Code-Inventar aus 42A

### Zentrale Controller / Services

- `js/core/savedCalculationController.js`
- `js/core/savedRecordController.js`
- `js/core/savedRecords.js`
- `js/platform/lineSectionController/index.js`
- `js/core/eventPipeline.js`
- `js/core/scrollManager.js`
- `js/core/renderer.js`
- `js/core/focusManager.js`

### Module mit `createLineSectionController`

- `buffer-storage`
- `heat-recovery`
- `heating-cooling`
- `hx-diagram`
- `pipe-sizing`
- `pressure-holding`
- `rainwater`
- `ventilation`
- `wastewater`

### Besonders relevante Moduldateien

- `js/modules/hx-diagram/renderPipeline.js`
- `js/modules/hx-diagram/controller.js`
- `js/modules/rainwater/index.js`
- `js/modules/rainwater/view.js`
- `js/modules/heat-recovery/dynamicRenderer.js`
- `js/modules/ventilation/controller.js`
- `js/modules/buffer-storage/controller.js`

## Aktuelle Architekturabweichungen in dev36

### 1. Doppelte zentrale Saved-Vertraege

Aktuell existieren mindestens zwei zentrale Varianten:

1. `bindSavedCalculationActions` / `bindSavedRecordWorkflow`
2. `createLineSectionController`

Beide sind zentral, aber sie muessen denselben Lebenszyklus garantieren. Aktuell unterscheiden sie sich in Details wie Action-Namen, Preserve-Scroll-Verhalten, Dynamic-Update-Erwartung und Hydration.

### 2. `preserveSavedRecordScroll` ist in dev36 effektiv deaktiviert

In `scrollManager.js` gibt `preserveSavedRecordScroll()` nur noch `action?.()` zurueck. Das entfernt problematische Restore-Ketten, aber nimmt dem zentralen Vertrag auch jede explizite Scroll-Stabilitaet.

Bewertung: Dieser Zustand ist als Debug-/Hotfix-Zwischenstand verstaendlich, aber kein sauberer finaler Vertrag.

### 3. h,x rows-only ist funktional unvollstaendig

In `hx-diagram/renderPipeline.js` fuehrt `savedStructural` in dev36 zu:

- Formfelder synchronisieren
- Saved Controls synchronisieren
- Saved Rows aktualisieren
- kein Render von Prozessauswahl, Ergebnisblock und Diagramm

Das behebt den Scrollsprung, bricht aber die fachliche Erwartung, dass ein geladener gespeicherter Prozess die Ausgabeinseln aktualisiert.

### 4. Event-Pipeline und SavedRecordList nutzen fruehe Pointer-/Touch-Aktivierung

`savedRecords.js` aktiviert Loads bereits in `pointerdown` und unterdrueckt folgende Clicks. `eventPipeline.js` besitzt ebenfalls Pointer-/Touch-Capture-Handling. Diese Doppelung kann korrekt sein, muss aber dokumentiert und gegen doppelte oder veraltete Aktionen abgesichert bleiben.

### 5. Regenwasser hat dokumentierte Capture-Sonderlogik

Phase 36W.2I zeigt, dass Regenwasser lokale Precommit-Logik in Capture-Phase benoetigte. Diese Logik darf nicht blind entfernt werden, kann aber mit Saved-Selection und Dynamic-Render kollidieren.

## Referenzbewertung

| Bereich | Referenz | Bewertung |
|---|---|---|
| Save/Edit/Selection ohne Diagramm | `heating-cooling`, `pressure-holding` | als Zielverhalten geeignet |
| Zentrale Saved-Card-Generierung | `createLineSectionController` | geeignet, aber Vertrag muss gegen `savedRecordController` abgeglichen werden |
| Diagramm-Ausgabeinseln | `hx-diagram` | Sonderfall; braucht erweiterten Outlet-Vertrag |
| Regenwasser Hydration | Phase 36W.2D-I | empfindlich, nicht als generische Referenz geeignet |
| Scroll-Stabilitaet | Architekturdocs + Phase 17C.5 | Ziel: zentrale Stabilitaet ueber Anchors/Clamp, nicht Modul-Hotfixes |

## Konsequenz fuer 42B

42B darf nicht mit Code starten. Zuerst muss ein Zielvertrag formuliert werden, der die bestehenden Regeln nur ordnet:

1. Welche zentrale Saved-API ist verbindlich fuer neue/migrierte Module?
2. Wie wird `createLineSectionController` gegen `savedRecordController` abgegrenzt oder integriert?
3. Welche Actions duerfen Ausgabeinseln rendern?
4. Wie wird h,x als Diagramm-Outlier behandelt?
5. Wie wird Scroll-Stabilitaet erreicht, ohne Eingaben oder Diagramme veralten zu lassen?

