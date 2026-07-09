# Phase 42C – Legacy Removal

Version basis: `1.3.2-dev.36-phase42b`
Status: completed
Runtime changes: yes

## Scope

42C entfernt keine dokumentierten zentralen Vertraege. Die Phase loest Legacy- und Parallelverhalten auf, das gegen die in 42A/42B bestaetigten Saved-/Selection-/Render-/Scroll-Vertraege gearbeitet hat.

Bearbeitete Schwerpunkte:

- zentrale Saved-Selection nicht mehr waehrend `pointerdown`/`touchend` ausfuehren
- Line-Section-Rows ueber den zentralen Controller differenziell aktualisieren
- `h,x` Saved-Selection wieder fachlich vollstaendig synchronisieren
- Pufferspeicher, Regenwasser und WRG/Mischluft vom rows-only- bzw. full-card-Rebuild-Mischzustand befreien
- keine neuen CSS-Hotfixdateien
- keine neuen Architekturregeln

## Entfernte Legacy-/Konfliktpfade

### 1. Fruehe Saved-Record-Aktivierung

Dateien:

- `js/core/eventPipeline.js`
- `js/core/savedRecords.js`

Befund aus 42B:

- Saved-Selection wurde teilweise bereits auf `pointerdown` ausgefuehrt.
- Gleichzeitig existierte der zentrale Click-/Keyboard-Aktionsvertrag.
- Auf mobilen Browsern kann DOM-Mutation waehrend der Tap-Aufloesung Scroll-Anker und Fokusberechnung stoeren.

Aenderung:

- `saved:load`, `saved:delete`, `saved:toggle`, `line:select`, `line:delete`, `line:toggle` laufen nicht mehr ueber den fruehen Pointer-Pfad.
- Save/Update bleiben fruehe Aktionen, weil sie vor Blur-Renderings committed werden muessen.
- `bindSavedRecordList()` nutzt fuer Saved-Activation nur noch Click und Keyboard.

Bestehender Vertrag angewendet:

- Eine Saved-Selection ist eine zentrale Action, kein lokaler Pointer-Hotfix.

### 2. Zentrale Row-Synchronisierung fuer `createLineSectionController`

Datei:

- `js/platform/lineSectionController/index.js`

Aenderung:

- `updateRows(root, snapshot)` ergaenzt.
- `updateControls()` synchronisiert zusaetzlich `aria-disabled`.
- Dynamic-Renderer koennen Saved-Rows nun zentral aktualisieren, ohne die ganze Saved-Card zu ersetzen.

Bestehender Vertrag angewendet:

- `createLineSectionController` bleibt der abgeleitete zentrale Controller fuer gespeicherte Listen.
- Module ersetzen seine Card nicht vollstaendig, wenn nur Active-/Expanded-State oder Row-Inhalt betroffen ist.

### 3. Pufferspeicher

Datei:

- `js/platform/dynamicRenderer/index.js`

Aenderung:

- Saved-Aktionen hydratisieren weiterhin Inputs.
- Ergebnis-Insel wird aktualisiert.
- Saved-Controls und Rows laufen ueber den zentralen Line-Section-Controller.
- Die ganze Saved-Card wird nur noch als Fallback ersetzt.

Warum:

- Dev36 rows-only verhinderte fachliche Synchronisation.
- Full-card-Rebuilds erzeugen unnoetige Layout-Instabilitaet.

### 4. Regenwasser

Datei:

- `js/platform/dynamicRenderer/index.js`

Aenderung:

- Plain Saved-Aktionen halten die Form-Insel stabil.
- Result-Insel wird aktualisiert.
- Saved-Controls und Rows laufen ueber `lineSectionController.updateRows()`.
- Dokumentierte Precommit-/Hydration-Sonderlogik bleibt erhalten.

Warum:

- Phase 36W-Regeln bleiben gueltig.
- 42C entfernt nur Legacy-Rebuilds, nicht fachlich notwendige Hydration.

### 5. WRG/Mischluft

Datei:

- `js/modules/heat-recovery/dynamicRenderer.js`

Aenderung:

- Saved-Controls werden lokal nur noch synchronisiert.
- Saved-Rows werden aus dem zentral gerenderten Markup extrahiert und differenziell ersetzt.
- Die volle RLT-Saved-Card wird nicht mehr standardmaessig ersetzt.

Warum:

- WRG nutzt den zentralen Line-Section-Controller, hatte aber im Dynamic-Renderer weiterhin Full-Card-Rebuild-Verhalten.

### 6. h,x-Diagramm

Datei:

- `js/modules/hx-diagram/renderPipeline.js`

Aenderung:

- Rows-only aus dev36 wurde fachlich korrigiert.
- Saved-Selection aktualisiert wieder:
  - Inputs/Form-State
  - Prozessauswahl
  - Ergebnisblock
  - Diagramm
  - Saved-Controls und Rows
- Kein lokaler Scroll-Freeze wurde wiedereingefuehrt.

Warum:

- h,x ist der dokumentierte Sonderfall mit Ausgabeinseln.
- Rows-only behebt Scroll, bricht aber Diagramm-Synchronisation.
- Der Zielvertrag ist differenzielle Outlet-Synchronisierung, nicht Unterdrueckung der Ausgabeinseln.

## Nicht geaendert

- Keine neuen Theme-/CSS-Regeln.
- Keine neuen CSS-Dateien.
- Kein neuer Saved-/Scroll-Vertrag.
- Keine Rueckkehr zu langen Scroll-Restore-Ketten.

## Regressionserwartung

Nach 42C muessen gezielt manuell geprueft werden:

1. Pufferspeicher: gespeicherten Inhalt markieren, Inputs geladen, Edit-Mode aktiv, kein Scrollsprung.
2. Regenwasser: gespeicherte Dachflaeche markieren/loeschen, Result synchron, kein Scrollsprung.
3. WRG/Mischluft: gespeichertes RLT-Geraet markieren, Inputs geladen, Result synchron, kein Scrollsprung.
4. h,x: gespeicherten Prozess markieren, Diagramm/Ergebnisse/Prozessauswahl synchron, kein Scrollsprung.
5. Referenzmodule Heizung/Kälte und Druckhaltung bleiben unveraendert.
