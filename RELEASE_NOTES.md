## 1.3.2-dev.4 – Layout & Navigation Foundation

- Light-Theme-Layout fuer Header, Modulnavigation, Menue, Overflow und Settings zentralisiert.
- Header- und Menueflaechen konsistent auf warmes helles App-Design gestellt.
- Modulnavigation, aktive Tabs, Hover- und Fokuszustaende kontrastreicher vereinheitlicht.
- Release-Notes- und Settings-Cards auf globale Abstaende, Radien und Flaechen gehoben.
- Dark/System funktional unveraendert belassen.

## 1.3.2-dev.3 – Central Components Foundation

- Light-Theme-Komponenten auf zentrale UI-Primitives konsolidiert.
- Buttons, Segment Controls, Inputs, Selects, Cards, Accordions, Header-Menü und Modul-Auswahl über globale Tokens nachgeschärft.
- Akzentfarben im Light Mode kräftiger und barriereärmer gesetzt.
- Dunkle Light-Mode-Restflächen in Menü, Overflow und Accordions entfernt.
- Dark/System funktional unverändert belassen.

## 1.3.2-dev.2 – Central UI Tokens & Light Theme Foundation

- Light Theme auf zentrale Tokens fuer Hintergrund, Flaechen, Rahmen, Typografie, Radien, Schatten und Akzentfarben gehoben.
- Header-Menue, Einstellungen, weitere Module, Accordions und Dropdowns im Light Mode auf helles zentrales UI-System gestellt.
- Akzentfarben verstaerkt, Fokuszustaende und aktive Elemente kontrastreicher dargestellt.
- Dark/System funktional unveraendert belassen.

## 1.3.2-dev.2 – Release Notes UI

- Release Notes werden chronologisch absteigend sortiert.
- Neueste Änderung steht immer zuerst.
- Doppelte und verschachtelte Zwischenüberschriften werden nicht mehr als eigene Release-Cards angezeigt.
- Card-Abstände folgen dem globalen Standardraster.

## 1.3.2-dev.2 – Code Freeze

- Versionierung, Service Worker Cache und Precache-Revision auf RC.12 synchronisiert.
- Runtime-Code auf verbliebene Debug-Ausgaben geprüft.
- Fast- und Integration-Gate erfolgreich ausgeführt.
- RC.10 Projektdatei- und RC.11 PDF-Regressionen erneut bestätigt.

## 1.3.1-rc.11.1 – RC.11 PDF Engine Korrekturen

- Doppelte Fortsetzungsüberschriften entfernt.
- h,x-Zustandspunkte: Labels und Werte sauber getrennt.
- „1 Ausgang“, „2 Taupunkt“, „3 Kühlen und entfeuchten“ und „4 Nacherwärmen“ werden als Labels angezeigt.
- Doppelte „Bezeichnung“-Labels entschärft.
- Korrektur greift generisch in allen Modulen.

## 1.3.1-rc.11 – PDF Engine Pixel Perfect QA

- Seitenumbrüche stabilisiert.
- Verwaiste Abschnittstitel verhindert.
- Lange Tabellen segmentiert.
- Projekt- und Corporate-Blöcke dynamisch stabilisiert.
- Sonderzeichen-Normalisierung erweitert.
- PDF-Regressionsguard ergänzt.

## 1.3.1-rc.10.2 – RC.10A iOS-Dateiauswahl korrigiert

- Versteckter Projekt-Import-Input verwendet kein restriktives `accept` mehr.
- iOS Files graut unbekannte Custom-Endungen wie `.tcproj` nicht mehr aus.
- Dateitypprüfung bleibt vollständig im Parser erhalten.

## 1.3.1-rc.10.1 – Projekt-Import robuster

- Öffnen-Pfad über nativen File Picker ergänzt.
- Fallback über File-Input bleibt erhalten.
- `.tcproj`-Parser toleranter gemacht.
- MIME-only, BOM und Legacy-Wrapper abgesichert.

## 1.3.1-rc.10 – Release-Blocker Projektdateien und Update-System

- `.tcproj` und `.json` Import stabilisiert.
- Firmenlogo-Hydration beim Import abgesichert.
- Update-Dialog bis zur tatsächlichen Aktualisierung nicht mehr wegklickbar.
- `SKIP_WAITING → controllerchange → reload` Flow abgesichert.

## 1.3.1-rc.9 – PDF Layout Engine

- PDF Layout Engine zentralisiert.
- Feste 4-Spalten-Matrix für alle Module ergänzt.
- Gerade Wertspalten verwenden eine feste rechte Bezugskante.
- Textumbruch innerhalb der Zellen stabilisiert.
- h,x-Diagramm-Captures werden beschnitten und in eine feste Diagramm-Box eingepasst.

## 1.3.1-rc.6 – PDF-Raster Stabilisierung

- PDF-Raster für Heiz/Kälte, Trinkwasser und WRG stabilisiert.
- Lange Werte werden kontrolliert mehrzeilig gesetzt statt in Nachbarspalten zu laufen.
- h,x-Diagramm-Export robuster vorbereitet.
- RC-1C-Korrekturen für professionelle PDF-Ausrichtung.

## 1.3.1-rc.2 – PDF-Korrekturen und PDF-Engine-Refactoring

- Trinkwasser-PDF: Tabellenraster vereinheitlicht, damit Werte sauber auf den Linien sitzen.
- Trinkwasser-PDF: Sonderzeichen in Formeln werden PDF-kompatibel normalisiert.
- h,x-Diagramm: Diagramm-Rendering als JPEG-Bild in den nativen PDF-Export vorbereitet.
- WRG-/Einheiten-/allgemeine Ergebnisabschnitte verwenden ein kompaktes Vier-Spalten-Raster.

<!-- Phase 37E RC Closure audit retained. -->

<!-- Phase 38F esbuild minification audit retained. -->
