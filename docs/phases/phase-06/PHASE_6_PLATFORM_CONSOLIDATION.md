# Phase 6 – Plattform-Konsolidierung

Ziel dieser Phase ist nicht nur das Vorhandensein zentraler Regeln, sondern die tatsächliche Nutzung in den Modulen und die Reduzierung historisch gewachsener CSS-Patches.

## Umgesetzt

- `components.css` bereinigt: ein alter Trinkwasser-/Light-Mode-Patchblock wurde entfernt und archiviert.
- CSS-Zeilen reduziert von 4.898 auf 4.264 Zeilen.
- Lokale Zahlenparser in Pufferspeicher, Druckhaltung und h,x-Logik auf `numberService.parseNumber()` umgestellt.
- Rückübernahme von Ergebniswerten in Heizung/Kälte und Lüftung nutzt jetzt ebenfalls den zentralen `numberService`.
- Neue Audits ergänzt:
  - `scripts/audit-platform-migration.mjs`
  - `scripts/audit-css-debt.mjs`
- `npm test` führt die neuen Audits mit aus.

## Ergebnis der Prüfung

Stand Phase 6:

- 11 Module nutzen zentrale Zahlenlogik oder zentrale Berechnungs-Helfer.
- 2 Module besitzen bereits Schema-Dateien: Regenwasser und Schmutzwasser.
- 8 Module verwenden zentrale Saved-Record-Helfer oder zentrale Saved-Record-Controller.
- 7 Module enthalten noch Legacy-UI-Klassen als Migrationsalias oder Spezialvisualisierung.
- `components.css` enthält weiterhin CSS-Schulden, aber der offensichtlich mehrfach gepatchte Trinkwasser-/Light-Mode-Block ist entfernt.

## Nicht vollständig abgeschlossen

Noch nicht alle Module sind echte Schema-Module. Der aktuelle Stand ist eine bereinigte Adapter-Architektur. Die vollständige Zielarchitektur bleibt:

```txt
Module liefern nur noch: config, schema, initialState, calculate, results.
App Core rendert: Inputs, Listen, Buttons, Fehler, Saved Records, Ergebnisse.
```

## Nächste harte Migration

Empfohlene Reihenfolge:

1. Trinkwasser auf Schema + zentrale Collection-Komponente migrieren.
2. Druckhaltung und Pufferspeicher auf Schema migrieren.
3. `h,x` als Ausnahme behandeln: Diagramm bleibt Spezialvisualisierung, aber Formular/Verlauf sollten zentralisiert werden.
4. `components.css` in `base`, `forms`, `records`, `results`, `visualizations`, `legacy-aliases` aufteilen.
5. Legacy-Aliasse (`dw-*`, `ph-*`, `rainwater-*`, `wastewater-*`) pro Modul abbauen.

## Akzeptanzkriterium für Phase 7

Ein Modul gilt erst dann als vollständig migriert, wenn:

- keine eigenen Input-Komponenten mehr gebaut werden,
- keine eigenen Saved-Record-Karten mehr gebaut werden,
- keine modulbezogenen UI-Klassen mehr notwendig sind,
- alle Zahlen über `numberService` laufen,
- das Modul per Schema gerendert werden kann.
