# Phase 34A - Components CSS Audit

## Executive Summary

`css/components.css` ist aktuell kein klar abgegrenztes Komponenten-Stylesheet mehr, sondern ein historisch gewachsener Patch-Stack. Die Datei muss vor weiteren UI-Bugfixes strukturell bereinigt werden.

## Messwerte

| Kennzahl | Wert |
|---|---:|
| Zeilen | 5027 |
| Dateigroesse | ca. 110 KB |
| extrahierte Selektor-Vorkommen | 1243 |
| eindeutige Selektoren | 792 |
| mehrfach definierte Selektoren | 250 |
| Media Queries | 62 |
| `!important` | 30 |
| `:has()` | 7 |
| Light-Theme-Regeln | 126 |

## Hauptbefund

Die Datei enthaelt mehrere Generationen derselben UI-Idee:

1. urspruengliche Komponenten (`.card`, `.control`, `.field`, `.result-row`)
2. moduleigene Patches (`pressure-holding`, `buffer-storage`, `wastewater`, `rainwater`, `drinking-water`)
3. Zwischen-Abstraktionen (`.tc-card`, `.tc-field`, `.tc-result-item`)
4. spaetere RC-Hardening-Bloecke
5. Phase-33 Global-Foundation mit `!important`

Dadurch konkurrieren globale Regeln, Modulregeln und Korrektur-Patches miteinander.

## Hochrisiko-Selektoren

Diese Selektoren tauchen besonders haeufig oder in mehreren semantischen Schichten auf und muessen in 34B kanonisiert werden:

| Selektor / Bereich | Risiko |
|---|---|
| `.card` / `.tc-card` / `.result-card` | mehrere Card-Modelle parallel |
| `.control`, `.control input`, `.control select` | wiederholte Hoehen-/Padding-Overrides |
| `.result-row` | mehrfach zwischen Flex/Grid/Spacing veraendert |
| `.inline-stat` | Textueberlauf- und Groessenpatches verteilt |
| `.line-section-card` | Saved-Record, Rohrleitung und Accordion vermischt |
| `.saved-record-card` | mehrere CRUD-Generationen parallel |
| `.settings-panel` | viele mobile Sonderregeln und Locking-Patches |
| `.overflow-menu` | mehrere Desktop/Mobile-Definitionen |

## Modul-Sonderregeln nach Haefigkeit

| Modul | Vorkommen `data-module` |
|---|---:|
| drinking-water | 49 |
| wastewater | 44 |
| buffer-storage | 29 |
| pressure-holding | 22 |
| heat-recovery | 5 |
| rainwater | 4 |
| pipe-sizing | 3 |
| hx-diagram | 3 |

Bewertung: Trinkwasser, Schmutzwasser, Pufferspeicher und Druckhaltung tragen den groessten Anteil an lokaler UI-Komplexitaet.

## Loesch-/Extraktionskandidaten

### Direkt in 34B zusammenfuehren

- alle konkurrierenden Card-Regeln
- alle konkurrierenden Control/Input/Select-Regeln
- alle Result-Row-/Inline-Stat-Regeln
- alle Saved-Record-Card-Generationen
- Phase-32/33-Spacings in eine kanonische Komponentendefinition ueberfuehren

### Nach `modules.css` verschieben

Nur echte fachliche Layouts:

- HX Chart und SVG Styling
- Rohrleitungs-Dimension-Cards
- WRG Split-/Group-Layouts
- Schmutzwasser Gegenstandslisten
- Trinkwasser Zusammenstellungsdialog, sofern fachlich abweichend
- Pufferspeicher Modus-Tabs, falls wegen vier Tabs mobil notwendig

### Entfernen nach visueller Verifikation

- historische Versionskommentare und ersetzte Patchbloecke
- doppelte `.app-header`-Bloecke
- alte Saved-Record-Generationen vor `.saved-record-card`
- doppelte Schmutzwasser-Mengenfeld-Patches
- einzelne Modul-Patches, deren Zweck inzwischen durch globale Primitives erfuellt wird

## Zielarchitektur fuer 34B

`components.css` soll nur noch echte globale Komponenten enthalten:

1. Surface/Card
2. Field/Control/Input/Select
3. Buttons/Actions/Icon Buttons
4. Segmented Controls/Toggles
5. Results/List/Inline Stats
6. Saved Records
7. Accordions
8. Settings Panel
9. Overflow Menu
10. Shared helpers: badge, empty-state, formula, visually-hidden

Keine `data-module`-Sonderregeln in `components.css`, ausser temporaere Migrations-Aliasse mit Ablaufdatum.

## Zielgroessen

| Datei | Ziel |
|---|---:|
| `components.css` | 1200-1600 Zeilen, max. 2000 |
| `modules.css` | nur fachliche Layout-Sonderfaelle |
| `tokens.css` | Radius, Gap, Farben, Schatten, Hoehen |
| `layout.css` | App-/Grid-/Viewport-Struktur |

## Release-Risiko

Ein reiner Patch auf der bestehenden Datei ist nicht mehr vertretbar. Weitere `!important`-Overrides wuerden die UI-Regressionen erhoehen.

Empfehlung: Phase 34B als kontrollierter Rebuild von `components.css`, nicht als inkrementeller Patch.
