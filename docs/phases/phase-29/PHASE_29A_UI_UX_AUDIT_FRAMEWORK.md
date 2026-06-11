# Phase 29A - Modulweites UI/UX Bugfix Audit Framework

## Ziel

Phase 29A definiert den verbindlichen Pruefkatalog fuer die kommende Bugfix-Runde. Diese Phase aendert keine Modul-Logik. Sie stellt sicher, dass alle Module in Phase 29B nach denselben UX- und Stabilitaetskriterien bewertet werden.

## Pruefachsen

1. Eingabe und automatische Bestaetigung
2. Enter/Tab/Shift+Tab Navigation
3. Fokus- und Caret-Restore nach Re-Render
4. Scroll-Stabilitaet bei Auswahl, Abwahl und Live-Render
5. Saved Records: Save, Load, Update, Delete, Expand, Collapse
6. Live-Rendering ohne Aktualisieren-Zwang
7. Einheitenwechsel und deutsche Zahlformate
8. Ergebnisanzeige, Plausibilitaet und leere Zustaende
9. Desktop/Mobile Layout und Touch-Ziele
10. Fehlermeldungen, Reset und Default-State

## Severity Regeln

- **P0**: Datenverlust, nicht ladbares Modul, blockierter Hauptworkflow oder offensichtlich falscher Ergebniszustand.
- **P1**: Kern-UX oder Rechenfluss gestoert, insbesondere Eingabe, Fokus, Scroll, Saved Records, Live-Rendering oder Ergebnisanzeige.
- **P2**: Nicht blockierende Inkonsistenz, Layoutproblem, Edge Case oder mobile Detailabweichung.
- **P3**: Kosmetik, Text oder optionale Verbesserung ohne Workflow-Auswirkung.

## Modulreihenfolge fuer 29B

Die Einzelpruefung sollte mit den historisch risikoreichsten Modulen starten:

1. Regenwasser
2. Entwaesserung
3. h,x-Diagramm
4. Trinkwasser
5. WRG
6. Pufferspeicher
7. restliche Plattformmodule

## Artefakte

- `scripts/audit-ui-ux-framework-phase29a.mjs`
- `platform-ui-ux-audit-framework-phase29a.json`
- `tests/platform-ui-ux-framework-phase29a.test.mjs`

## Abschlusskriterium

Phase 29A ist abgeschlossen, wenn die Matrix alle Module enthaelt, alle zehn Pruefachsen je Modul angelegt sind und die Voraussetzungen aus Phase 28D vorhanden sind.
