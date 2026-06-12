# Phase 32E – RC Bug Verification

Basis: `techcalc-pro-1.3.0-rc.1-phase34d-css-regression-smoke`

Ziel dieser Phase ist die Verifikation der ursprünglich gemeldeten RC-Bugs nach den Bugfix-Batches 32A bis 32D und nach dem CSS-Rebuild 34B bis 34D.

## Prüfmethodik

- Source-/Regressionstest gegen die ursprünglich gemeldeten Bug-Cluster
- Vollständiger Quality-Gate-Lauf über `npm test`
- CSS-Regression nach Phase 34D als visuelle Strukturprüfung
- Keine manuelle Browserprüfung in dieser Phase

## Ergebnisübersicht

| Gruppe | Anzahl | Status |
| --- | ---: | --- |
| P1 kritisch | 9 | technisch verifiziert |
| P2 normal | 4 | technisch verifiziert |
| P3 kosmetisch | 10 | strukturell/CSS-seitig verifiziert, Browser-Sichtprüfung empfohlen |
| Zusatzpunkte 32D | 2 | technisch verifiziert |

## Bug-Matrix

| ID | Modul | Beschreibung | Verifikationsstatus | Nachweis |
| --- | --- | --- | --- | --- |
| RC-BUG-001 | Rohrleitung | Ergebnistext verlässt Card | technisch geschlossen, visuell nachtesten | globaler Card/Text-Overflow-Vertrag, CSS Smoke 11/11 |
| RC-BUG-002 | Druckhaltung Desktop | Speichern legt keinen Eintrag an | technisch geschlossen | `createSavedRecordActions`, `beforeCreate: commitAllFields`, Action `pressure:save` |
| RC-BUG-003 | Druckhaltung Mobile | gespeicherter Eintrag nicht markier-/bearbeitbar | technisch geschlossen | Saved-Record-Actions `saved:load`, früher Event-Lifecycle |
| RC-BUG-004 | Druckhaltung Desktop | Speicherdialog falsch angeordnet | strukturell geschlossen, visuell nachtesten | CSS-Isolation/Smoke, aktueller Layout-Vertrag |
| RC-BUG-005 | Druckhaltung | Station-/Gefäßtexte verlassen Card | technisch geschlossen, visuell nachtesten | globaler Overflow-Vertrag |
| RC-BUG-006 | Pufferspeicher | Ergebnis-Card-Abstände fehlen/zu klein | strukturell geschlossen, visuell nachtesten | `--tc-gap: 10px`, `--tc-card-padding: 10px` |
| RC-BUG-007 | Schmutzwasser | Saved Record braucht zweiten Klick | technisch geschlossen | `touchstart`/`pointerdown` markieren committed actions vor Blur |
| RC-BUG-008 | Schmutzwasser Mobile | Hinzufügen blockiert bei offener Tastatur | technisch geschlossen | früher Touch-/Pointer-Lifecycle und mobile action hardening |
| RC-BUG-009 | Schmutzwasser Desktop | Speicherdialog falsch angeordnet | strukturell geschlossen, visuell nachtesten | CSS-Isolation/Smoke |
| RC-BUG-010 | Regenwasser | Saved Record braucht zweiten Klick | technisch geschlossen | zentraler Saved-Record/Blur-Guard |
| RC-BUG-011 | Regenwasser | Scrollsprung beim Löschen | technisch geschlossen | Scroll-Manager/Saved-Record-Preservation |
| RC-BUG-012 | Regenwasser Desktop | Speicherdialog falsch angeordnet | strukturell geschlossen, visuell nachtesten | CSS-Isolation/Smoke |
| RC-BUG-013 | WRG Desktop | Speicherdialog falsch angeordnet | strukturell geschlossen, visuell nachtesten | CSS-Isolation/Smoke |
| RC-BUG-014 | h,x | +/- Toggle setzt Vorzeichen nicht zuverlässig | technisch geschlossen | `pointerdown`/`touchstart` earlyAction, Deduplizierung |
| RC-BUG-015 | h,x Mobile | Nav-Pill verschwindet nach Keyboard | technisch geschlossen | `body.tc-keyboard-open .module-nav` bleibt sichtbar |
| RC-BUG-016 | h,x Mobile | Diagramm leeren leert nicht | technisch geschlossen | `clearDiagram()` setzt Felder, Prozess, Pfad und Punkte zurück |
| RC-BUG-017 | h,x | Ergebniscard-Abstände zu dicht | strukturell geschlossen, visuell nachtesten | globaler 10px-Vertrag |
| RC-BUG-018 | h,x | Tab-/Enter Navigation fehlt | technisch geschlossen | bestehende Phase-26/32 Regressionen im Quality Gate |
| RC-BUG-019 | Trinkwasser | Tab-/Enter Navigation fehlt | technisch geschlossen | Input-/Focus-Regressionen im Quality Gate |
| RC-BUG-020 | Trinkwasser | Markieren öffnet Zusammenstellung | technisch geschlossen | aktives Laden/Editieren getrennt von Dialogöffnung |
| RC-BUG-021 | Trinkwasser Mobile | Speichern NE erzeugt Scrollsprung | technisch geschlossen | `saveUnit()`/`saveSingle()` mit `runWithoutScrollJump` |
| RC-BUG-022 | Trinkwasser | alle Einträge in Zusammenstellung | technisch geschlossen | Berechnung nutzt `savedSingleConsumers` als Quelle |
| RC-BUG-023 | Trinkwasser | Eingabefelder im Dialog zu hoch | strukturell geschlossen, visuell nachtesten | globale Control-Höhen aus Komponentenlayer |
| RC-BUG-024 | Global | Modul-Ladehinweis erscheint zu oft | technisch geschlossen | Lazy-Module-Preload, verzögerter Loader |
| RC-BUG-025 | Global | Release Notes laden nicht | technisch geschlossen | Parser/Ladepfad `RELEASE_NOTES.md` verifiziert |

## Quality Gate

- `npm run build`: OK
- `npm run audit:imports`: OK
- `npm run audit:css`: OK
- `npm run test:phase32e`: OK
- `npm test`: OK

## Release-Entscheidung

Die P1- und P2-Punkte sind technisch verifiziert. Die P3-UI-Punkte sind nach dem CSS-Rebuild strukturell verifiziert, benötigen aber eine manuelle Browser-Sichtprüfung auf Desktop und Mobile, bevor ein finaler Release Candidate markiert wird.
