## 1.3.2-dev.17 – CSS-System Härtung

Light Theme Button-Regeln weiter zentralisiert. Konkurrierende vollflächige Primary-Button-Regeln in Light-Theme-, Rollout-, Contrast- und Komponenten-Dateien auf tokenisierte Soft-Accent-Regeln umgestellt. Neuer CSS-Härtungs-Audit verhindert erneute Save/Edit- und Light-Button-Konflikte außerhalb der zentralen Komponenten.

## 1.3.2-dev.16 – UI-System Abschlussbereinigung

Die letzten vier UI-System-Punkte wurden abgearbeitet: Modul-CSS ist in fokussierte Layout-/Domain-Dateien aufgeteilt, Light-Theme-Kontrastregeln und Save/Edit-State sind getrennt, Komponenten-Aggregate bleiben nur noch Stubs, und ein neuer UI-System-Audit schützt gegen neue modulinterne Komponenten-/Inline-Styles. Dark/System bleiben unverändert.

## 1.3.2-dev.15

Light Theme Härtung: Speichern/Aktualisieren erhält einen zentralen Edit-Mode-Vertrag. Visuelle Button-Zustände werden im Light Mode aus `data-edit-mode` und `data-save-mode-role` abgeleitet, damit Modul- oder Komponentenregeln die Speicherlogik nicht mehr überzeichnen.

## 1.3.2-dev.15 – Light Save/Edit State Guard

Detaillierte Bereinigung der Light-Theme-Speicherzustände. Speichern/Aktualisieren werden zentral per disabled, aria-disabled und Guard-Klasse synchronisiert. Light-Theme-Button-Regeln können deaktivierte Speicheraktionen nicht mehr als aktive Aktionen darstellen. Dark/System bleiben unverändert.

## 1.3.2-dev.13 – Speicher-/Edit-Modus Sync

- Zentraler Sync für Speicher-/Aktualisieren-Buttons ergänzt.
- Ohne aktive Auswahl bleibt nur Speichern aktiv.
- Mit aktiver Auswahl bleibt nur Aktualisieren aktiv.
- Dynamische Listen-Updates und Selected-State werden appweit nachgeführt.
- Keine Dark-/System-Theme-Änderungen.

## 1.3.2-dev.12 – Zentraler Speicher-/Edit-Modus

Gespeicherte Einträge folgen nun appweit einem klaren Edit-Workflow: ohne aktive Auswahl ist nur „Speichern“ aktiv, bei aktiver Auswahl nur „Aktualisieren“. Die Guard-Logik liegt zentral im Saved-Record-/Line-Section-System und schützt zusätzlich gegen konkurrierende Action-Handler.

## 1.3.2-dev.11 – CSS-System entrümpelt

Components-CSS wurde in zentrale, wartbare Dateien aufgeteilt: Core, Controls, Collections, Settings/Release Notes, Legacy Contracts, Light Theme, Module Accent Tokens und Guards. Neue UI-Regeln sollen nicht mehr an components.css angehängt werden. Dark/System bleiben unverändert.

## 1.3.2-dev.9 – Light Theme Kontrast- und Akzentkorrektur
- Toggle-Füllungen werden im Light Theme wieder aus derselben Modul-Akzentfarbe wie der Rahmen abgeleitet.
- Release-Notes-Cards im Einstellungsmenü verwenden ausschließlich helle Light-Theme-Flächen.
- Textfarben im Light Theme wurden global auf dunkles Anthrazit und gedämpftes Grau normalisiert.
- Dark/System bleiben unverändert.

## 1.3.2-dev.7 – Light Theme Module Rollout

Light Theme weiter zentralisiert: Modul-Akzentfarben werden nun über Module-Root-Tokens an Cards, Navigation, Segment-Controls, Fokuszustände, Accordions und Aktionsflächen vererbt. Textfarbe bleibt global dunkel. Pattern-/Schraffurflächen wurden für Menüs und Accordion-Flächen vollflächig abgesichert. Dark/System bleiben unverändert.

## 1.3.2-dev.6 – Module Accent Token System

Light Theme Modul-Akzentfarben zentralisiert: Heizung Orange, Kälte Cyan, Pufferspeicher/Druckhaltung/Rohr Blau, WRG/Mischluft und h,x Türkis, Trinkwasser/Regenwasser/Schmutzwasser Grün. Aktive Toggle-Flächen verwenden nun dieselbe Akzentfamilie wie die Rahmen; Textfarbe bleibt global dunkel.

## 1.3.2-dev.5 – Light Theme Accent & Surface Completion

- Aktive Segment-Buttons, Tabs, Fokus- und Hover-Zustaende verwenden im Light Mode wieder die jeweilige Modul-Akzentfarbe statt pauschal Blau.
- Heizung/Orange wird in Switches und aktiven Auswahlzustaenden konsistent zur Card-Rahmenfarbe dargestellt.
- Header-Menue, Settings-Panel, Modul-Auswahl und Trinkwasser-Accordions erhalten vollflaechige helle Pattern-/Schraffur-Hintergruende.
- Dropdown-/Accordion-Pfeile bleiben kontrastreich und folgen dem zentralen Accent-System.
- Dark/System funktional unveraendert belassen.

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
