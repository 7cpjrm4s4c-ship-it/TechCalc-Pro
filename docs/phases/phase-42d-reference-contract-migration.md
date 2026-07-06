# Phase 42D – Reference Contract Migration

Version basis: `1.3.2-dev.36-phase42c`
Status: completed
Runtime changes: yes

## Scope

42D migriert die nach 42C verbleibenden Abweichungen auf den bestaetigten Referenzvertrag. Es wurden keine neuen UI- oder CSS-Regeln eingefuehrt.

Referenzmodule:

- Heizung/Kälte: Save, Selection, Edit und LineSectionController-Vertrag
- Druckhaltung: Save/Edit-Status und zentrale Steuerung der gespeicherten Inhalte
- h,x-Diagramm: Sonderfall nur fuer Ausgabe-Outlets, nicht fuer Save-/Selection-Vertrag

## Umsetzung

### Zentraler Saved-Anchor im LineSectionController

Datei: `js/platform/lineSectionController/index.js`

Die gespeicherte Card wird bei `save`, `update`, `select`, `deselect`, `delete` und `toggle` als stabiler Anchor behandelt. Vor der Mutation wird die Position der Card erfasst, nach der synchronen State-/Render-Kette wird nur die Delta-Verschiebung korrigiert.

Wichtig:

- keine langen Restore-Ketten
- kein globales `scrollY`-Zuruecksetzen
- keine neue Scroll-Regel
- bestehender Phase-42-Vertrag angewendet: stabile Anchor statt lokale Modul-Hotfixes

### Lüftung

Datei: `js/platform/dynamicRenderer/index.js`

Der dev36-Saved-only-Pfad wurde aufgeloest. Saved-Selection folgt wieder dem Referenzvertrag:

- Inputs werden hydratisiert
- Mode-/Target-Inseln werden aktualisiert, wenn die gespeicherte Auswahl den Modus oder Zielwert aendert
- Result/Formel/Air-Stats bleiben fachlich synchron
- Saved-Rows laufen ueber `lineSectionController.updateRows()`

### Pufferspeicher

Datei: `js/platform/dynamicRenderer/index.js`

Der dev36-Saved-only-Pfad wurde aufgeloest. Gespeicherte Inhalte koennen dadurch wieder voll in den Bearbeitungszustand geladen werden:

- Eingabeinseln werden aktualisiert, wenn die Berechnungsart wechselt
- Result bleibt synchron
- Saved-Controls und Rows laufen ueber den zentralen Controller
- Full-Saved-Card-Rebuild nur noch als Fallback

### Regenwasser

Datei: `js/platform/dynamicRenderer/index.js`

Der doppelte `updateRows()`-Fallback wurde entfernt. Plain Saved-Selection rendert die Form-Insel nur noch bei echter Selection-/Deselection-Hydration, nicht bei Toggle.

Die dokumentierte Phase-36W-Precommit-/Hydration-Logik bleibt unveraendert.

### WRG/Mischluft

Datei: `js/modules/heat-recovery/dynamicRenderer.js`

Der lokale Row-Extraktionspfad bleibt nur noch Fallback. Primaer nutzt WRG/Mischluft den zentralen `rltDeviceController.updateControls()` und `rltDeviceController.updateRows()`.

### h,x

42C hat die dev36-Rows-only-Regression bereits fachlich korrigiert. 42D veraendert den h,x-Rendervertrag nicht erneut. Die Scroll-Stabilitaet kommt ueber den zentralen Saved-Anchor im `LineSectionController`, waehrend h,x seine Ausgabe-Outlets weiterhin synchron aktualisiert:

- Prozessauswahl
- Ergebnisblock
- Diagramm
- Saved Rows/Controls

## Nicht geaendert

- keine neuen CSS-Dateien
- keine Theme-Erweiterung
- keine neuen Modul-Sonderregeln
- keine lokale h,x-Scroll-Freeze-Kette
- keine Rueckkehr zu globalen Restore-Ketten

## Manuelle Regressionserwartung

1. Heizung/Kälte: Referenzverhalten unveraendert.
2. Druckhaltung: Referenzverhalten unveraendert.
3. Lüftung: gespeicherter Inhalt laedt Inputs und Result synchron.
4. Pufferspeicher: gespeicherter Inhalt laesst sich markieren und bearbeiten.
5. Regenwasser: Selection/Deletion nutzt zentrale Rows; Form-Hydration nur bei Selection.
6. WRG/Mischluft: Selection nutzt zentralen RLT-Controller.
7. h,x: gespeicherter Prozess aktualisiert Diagramm und Ergebnisse.
