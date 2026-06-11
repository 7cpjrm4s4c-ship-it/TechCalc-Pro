# Phase 32C – UI Cosmetic Hardening

## Ziel

Abschluss der kosmetischen RC-Bugfix-Runde ohne neue Feature-Migration und ohne Architektur-Refactoring.

Schwerpunkte:

- Textüberläufe in Ergebnis- und Saved-Record-Cards verhindern
- globale Card-Abstände für Ergebnisbereiche konsolidieren
- Speicherdialoge bei Plattformmodulen aus der Ergebnis-Spalte in die Eingabe-/Speicher-Spalte verschieben
- WRG-Speicherdialog nach den Eingaben anordnen
- Trinkwasser-Feldhöhen im Nutzungseinheiten-Dialog angleichen

## Änderungen

### Plattformmodule Regenwasser / Schmutzwasser

Der Plattformrenderer trennt die Ergebnisinsel und die Speicherinsel jetzt visuell:

- `data-platform-dynamic="form"` bleibt für Eingabekarten zuständig
- `data-platform-dynamic="saved-records"` rendert gespeicherte Einträge im linken Eingabe-/Speicherbereich
- `data-platform-dynamic="result-saved"` enthält nur noch die Ergebnisanzeige

Damit stehen die Speicherdialoge bei Regenwasser nach der Regenfläche und bei Schmutzwasser nach den Zusatzabflüssen statt am Ende der Ergebnis-Spalte.

### WRG

Der WRG-Speicherdialog wurde aus der Output-Spalte in die Input-Spalte verschoben und sitzt dort direkt nach den Eingaben.

### Globale UI-Härtung

Zusätzliche CSS-Regeln verhindern Textüberläufe in:

- Rohrleitungs-Ergebnisbereich
- Druckhaltung-Ergebnisbereich
- h,x-Ergebnisbereich
- Pufferspeicher-Ergebnisbereich
- Saved-Record-Cards
- Inline-Stats

Die Regeln bleiben bewusst defensiv: `min-width: 0`, `overflow-wrap: anywhere`, normalisierte Gaps und mobile einspaltige Ergebniszeilen.

### Trinkwasser

Die Eingabefelder im Nutzungseinheiten-/Speicherdialog wurden auf eine einheitliche Höhe normalisiert.

## Quality Gate

Ausgeführt:

```bash
npm run build
npm run audit:imports
npm test
```

Ergebnis:

- Build: OK
- Import-Audit: OK
- Quality Gate: OK

## Release-Bewertung

Phase 32C ist kosmetisch und RC-konform. Es wurden keine neuen Features eingeführt.
