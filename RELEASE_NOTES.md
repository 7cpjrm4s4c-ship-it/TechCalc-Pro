### 1.3.3-dev.2 Phase 45B – Modulsplitting Design Review

- Zielarchitektur für Trennung von WRG und Mischluft festgelegt.
- Modul-IDs entschieden: `heat-recovery` bleibt WRG, `mixed-air` wird neues Mischluft-Modul.
- ADR-0006 und WRG/Mischluft-Splitting-Contract ergänzt.
- Migrations-, PDF-/Export- und Regressionserwartungen für 45C/45D definiert.
- Keine funktionalen Änderungen an App, Berechnungslogik, Persistenz, PDF, PWA oder UI.

### 1.3.3-dev.1 Phase 45A – Modulsplitting-Analyse

- Version 1.3.2 fachlich abgeschlossen und 1.3.3 als Modulsplitting-Stream gestartet.
- Bestehendes Kombimodul `heat-recovery` hinsichtlich WRG-/Mischluft-Kopplung analysiert.
- Trennschnitt, Risiken, Aufwand und notwendige Regressionen dokumentiert.
- Keine funktionalen Änderungen an App, Berechnungslogik, Persistenz, PDF, PWA oder UI.

### 1.3.2-rc.1 Release Candidate

- Gate 10 nach Phase 44B/44B.5 fachlich geschlossen.
- Browser-Konsole geprüft: keine JavaScript Runtime Errors, keine TypeError/ReferenceError, keine unhandled Promise Rejections sichtbar.
- Formspree-Feedback funktioniert; Spam-Einstufung bei Chrome/Formspree als externer Zustellhinweis dokumentiert.
- RC-Paket aus bereinigtem Development-Stand ohne dist/, node_modules/, Cache- oder Report-Artefakte erstellt.

### 1.3.2-dev.38 Phase 44B.5 – Browser Compliance

- Content Security Policy explizit um `frame-src` und `child-src` für Netlify Preview/Toolbar ergänzt.
- Deprecated `mobile-web-app-capable` bleibt aus dem App-Shell-HTML entfernt; iOS-Standalone erfolgt über Apple-Meta und Web App Manifest.
- Browser-Compliance-Audit ergänzt und in `lint` eingebunden.
- Phasenstandard Analyse → Design Review → Implementierung → Regression → Dokumentation als verbindlicher Ablauf dokumentiert.

### 1.3.2-dev.37 Phase 44B – Performance & Cleanup

- Gate 10 als Phase 44B umgesetzt: Dead-Code-/Duplicate-Audit, Build-Verifikation und Runtime-Diagnostics.
- Entfernt: nicht referenzierter Debug-Panel-Code und altes Wastewater-LineModel ohne Runtime-, Registry- oder aktuelle Dokumentationsbindung.
- Zentraler Logger `js/core/logger.js` eingeführt; Runtime-Warnungen und Fehler laufen nicht mehr direkt über verstreute `console.*`-Aufrufe.
- Build-Gate erweitert um Cleanup- und Runtime-Diagnostics-Audits.

### 1.3.2-dev.36 Phase 43E

- Trinkwasser Tab-/Enter-Navigation nach Phase 42E.5 repariert.
- Zentrale Keyboard-Navigation umfasst nun normale Modul-Action-Buttons innerhalb des Modul-Roots.
- Keyboard-Contract-Audit erweitert, damit Modul-Buttons nicht aus dem Focus-Graph herausfallen.

### 1.3.2-dev.36 Phase 43C

- Dauerhafte Architekturvertraege unter `docs/contracts/` angelegt.
- Keyboard, Save/Edit, Selection, Render, State, Event, Theme, Module und PDF als aktive Contracts dokumentiert.
- Phase-42-Entscheidungen aus historischen Phasendokumenten in langfristige Contract-Dateien ueberfuehrt.
- Keine Runtime-/CSS-/Modulmechanismen geaendert.

### 1.3.2-dev.36 Phase 43B

- Repository- und Dokumentationsstruktur bereinigt.
- Detaillierte Phase-36-/Phase-38-Artefakte nach `docs/archive/legacy-phase-docs/` verschoben.
- Phase-40-/Phase-41-Dokumente unter `docs/phases/` eingeordnet.
- Keine Runtime-/CSS-/Modulmechanismen geaendert.

### 1.3.2-dev.36 Phase 43A

- Engineering-Baseline gestartet.
- `docs/engineering/` fuer Branching, Commits, Review, Regression, Release und Testing eingefuehrt.
- `docs/contracts/` und `docs/adr/` als dauerhafte Architekturorte vorbereitet.
- Keine Runtime-/CSS-/Modulmechanismen geaendert.

### 1.3.2-dev.36 Phase 42E.6

- Phase 42 Architekturabschluss dokumentiert.
- Root-Datei `PHASE39B_NOTES.md` entfernt und historisch unter `docs/phases/phase-39.md` eingeordnet.
- `phase-42.md` als finale Hauptreferenz bereinigt.
- Keine Runtime-/CSS-/Modulmechanismen geaendert.

### 1.3.2-dev.36 Phase 42E.5

- Trinkwasser-Mobile-Input-Contract korrigiert.
- Lokale Trinkwasser-`input`-/`change`-Listener fuer normale `[data-field]` Felder entfernt.
- Field-Commits ersetzen den Trinkwasser-Input-Island nicht mehr.
- Draft-Count bleibt als Trinkwasser-spezifischer Collection-Adapter erhalten.
- Keine CSS-Hotfix-Datei und keine neuen Keyboard-Regeln.

### 1.3.2-dev.36 Phase 42E.4

- Phase-42-Dokumentation konsolidiert.
- Hauptuebersicht, Checkliste und Phasen-README aktualisiert.
- Bestaetigte Save-/Selection-/Render-/Scroll-/Keyboard-Vertraege als Referenzstand zusammengefasst.
- Keine Runtime-/CSS-Codeaenderungen.


### 1.3.2-dev.36 Phase 42E.3

- Keyboard-Regression-Guard ergänzt.
- Zentralen Tab-/Enter-Vertrag statisch gegen lokale Modul-Handler abgesichert.
- Integration-Gate um Keyboard-Contract-Audit erweitert.
- Keine Runtime-/CSS-Hotfix-Schicht ergänzt.

## 1.3.2-dev.36 Phase 42E.2 – Legacy Keyboard Handler Removal

- Zentrale Keyboard-Navigation weiter konsolidiert.
- Collection-Inputs werden beim Enter zentral über die Event-Pipeline committed.
- Legacy-Keyboard-Handler in Trinkwasser, Schmutzwasser, moduleRuntime und formActions entfernt.
- Keine neue CSS-Hotfix-Datei.


## 1.3.2-dev.36 Phase 42E.1 – Central Keyboard Navigation Contract

- Zentraler Focus-Graph für Tab/Shift+Tab/Enter/Shift+Enter erweitert.
- Speichern-/Aktualisieren-Controls, Segments und Saved-Cards in die Keyboard-Navigation eingebunden.
- Collection-Input-Handler führen nach Enter-Commit wieder in den zentralen Navigationsvertrag zurück.
- Keine neuen CSS-Hotfix-Dateien.

## 1.3.2-dev.36-phase42d – Reference Contract Migration

- Phase 42D auf Basis von 42C umgesetzt.
- LineSectionController nutzt zentralen Saved-Anchor statt globaler Scroll-Restore-Ketten.
- Lüftung und Pufferspeicher wieder auf vollen Referenzvertrag fuer Saved-Selection migriert.
- Regenwasser-Fallback bereinigt und Selection-Hydration eingegrenzt.
- WRG/Mischluft nutzt fuer Saved-Rows primaer den zentralen RLT-Controller.
- Keine neuen CSS-Hotfixdateien.

## 1.3.2-dev.36 – Scroll Pipeline Isolation

- Phase-36-Dokumentation und Scroll-Audit erneut abgeglichen.
- h,x Saved-Aktionen bleiben konsequent rows-only.
- Pufferspeicher, Regenwasser und WRG/Mischluft aktualisieren bei Saved-Aktionen nur noch Controls/Rows.
- Globale Saved-Scroll-Restore-Kette entfernt, um nachgelagerte Snapbacks zu vermeiden.
- Keine neue CSS-Hotfix-Datei angelegt.

## 1.3.2-dev.36 – Cleanup / Stability Fix

Dev.30/31 additive stability CSS removed from the precache and the final light theme file. Safe-area/header/divider handling was centralized again. Settings accordion blue active fill was removed. Saved-record mutations no longer restore focus during structural list updates, reducing scroll jumps in WRG/Mischluft, Pufferspeicher, Regenwasser and h,x-Diagramm. iOS input zoom guard remains global.

## 1.3.2-dev.36 – Deep Legacy Stability Cleanup

- Safe-Area/Initial-Layout stabilisiert; weiße Start-/Rückkehr-Streifen werden durch zentrale Viewport-Synchronisierung verhindert.
- iOS-Input-Zoom global gehärtet: Inputs, Selects und Textareas erzwingen im mobilen Layout mindestens 16px Schriftgröße.
- Scrollsprünge bei gespeicherten Inhalten in Pufferspeicher, Regenwasser, WRG/Mischluft und h,x-Diagramm weiter stabilisiert.
- Settings-/Hauptmenü-Markierung füllt die komplette Accordion-Card statt nur den Header.
- Keine fachliche Berechnungslogik geändert.

## 1.3.2-dev.29 – UI Polish

- Zentrale Typografie-/Spacing-Polish-Regeln ergänzt.
- Fokuszustände appweit vereinheitlicht.
- Touch-Zielgrößen und Card-Radien final abgesichert.
- Keine fachlichen Änderungen.

- Vollständiger Theme-Audit über Light, Dark und System ergänzt.
- Verbindliche Farbmatrix für Modulfarben und Prozessfarben als Audit abgesichert.
- Kälte/Cyan, Lüftung/WRG/h,x/Türkis, Sanitär/Grün und Druckhaltung/Pufferspeicher/Blau werden gegen Konfiguration und CSS-Vertrag geprüft.
- Speichern/Aktualisieren bleiben globale UI-Buttons und werden gegen Modulfarben-Vererbung abgesichert.
- Keine fachliche Modul-Logik geändert.

## 1.3.2-dev.27 – Final Theme Contract Audit

- Modulidentität, Prozessfarbe und globale UI-Farbe abschließend getrennt.
- Heizung/Kälte/Lüftung-Prozessfarben gegen Light/Dark/System abgesichert.
- Sanitär-Grün, Druckhaltung/Pufferspeicher-Blau und Einheiten-Blau final geprüft.
- Speichern/Aktualisieren bleiben globale UI-Buttons und erben keine Modulfarbe.

## 1.3.2-dev.26 – Dark Accent Resolver Fix

- Dark/System Accent-Resolver an Light-Vertrag angeglichen.
- Kälte/Kühlleistung verwendet wieder Cyan statt Neutralgrau.
- Sanitärmodule verwenden Grün auch für aktive Toggles, nicht nur Card-Rahmen.
- Heizleistung bleibt Orange, Lüftung/WRG/h,x bleiben Türkis.
- Keine Fachlogik geändert.

## 1.3.2-dev.24 – Module-/Prozessfarben Fix

- Modulidentität und Prozesszustand im Theme-Vertrag getrennt.
- Lüftung bleibt als Modul Türkis; Heizleistung nutzt Orange und Kühlleistung/Kälte nutzt Cyan.
- Heizung/Kälte-Prozessumschaltung im Light Theme korrigiert.
- Einheiten-Modul auf blaue Modul-/Navigationsfarbe synchronisiert.

## 1.3.2-dev.23 – Theme Regression Fix

- Kälte-Akzent im Light Theme wieder eindeutig auf Cyan gesetzt.
- Speichern-/Aktualisieren-Buttons von Modul-Akzenten entkoppelt.
- Globale UI-Primärtokens für Save/Edit-Aktionen ergänzt.
- WRG/Mischluft und h,x bleiben auf Türkis.

## 1.3.2-dev.22 – Final UI Hardening

- Light/Dark/System-Komponentenvertrag final gehärtet.
- Modul-Akzente, aktive Controls, Result-Cards und Action-Felder werden zentral über Tokens abgesichert.
- Verbliebene Light-Theme-Konfliktregeln in einen finalen Contract-Block überführt.
- Theme-Audit erweitert, damit neue konkurrierende Modul-Sonderregeln auffallen.
- Keine fachliche Modul-Logik geändert.

## 1.3.2-dev.21 – Light Theme Contract Hardening

Finaler Komponentenvertrag für das Light Theme ergänzt. Toggle-Füllungen, Buttonzustände, Result-Cards und Action-Felder werden über zentrale Accent- und Surface-Tokens abgesichert.

## 1.3.2-dev.20 – Dark Theme Action-Field Guard

Schmutzwasser-Action-Felder zentralisiert: Der Button „Gegenstand hinzufügen“ rendert nun auch im Dark/System Theme ohne umgebende Control-Card. Komponentenregel gilt themeübergreifend; Light/Dark/System bleiben konsistent.

## 1.3.2-dev.19 – Light Theme Finalisierung

- App-Status-Komponenten aus Legacy-CSS ausgelagert
- letzter Light-Theme-Conflict-Guard ergänzt
- Textfarben für Release Notes, Menüs und Modulflächen zentral abgesichert
- aktive Toggles und Buttons folgen erneut ausschließlich Modul-Akzenttokens
- deaktivierte Buttons im Light Mode final normalisiert

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
## 1.3.2-dev.36-phase42b

- Phase 42B abgeschlossen: Saved-/Selection-/Render-/Scroll-Vertraege abgeglichen
- Keine Runtime-Codeaenderungen
- h,x Outlet-Vertrag dokumentiert
- Regenwasser Precommit-/Hydration-Vertrag eingeordnet
- Modulpriorisierung fuer 42C/42D festgelegt
- 1.3.2-dev.36 Phase 43E.1: Workspace-/Module-Außenrahmen in Light/Dark entfernt; Card- und Control-Rahmen bleiben unverändert.
