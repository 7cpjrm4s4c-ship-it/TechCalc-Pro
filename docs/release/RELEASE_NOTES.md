## Unveröffentlicht – Bedienbarkeit, Barrierefreiheit und Performance
- Trinkwasser: Verbraucher werden erst durch bestätigte Klick-/Tap-Aktivierung hinzugefügt. Wischen ab den Hinzufügen-Buttons bleibt möglich; frühe Pointer-/Touchstart-Aktionen und die zeitbasierte Klicksperre entfallen.
- Scrollrücksetzungen bei Modulwechseln zentralisiert; unveränderte Positionen lösen keine erneuten Scrollaufrufe aus. Veraltete Wiederherstellungen werden bei neuer Bedienung oder Modulwechsel abgebrochen.
- Viewport-Ereignisse gebündelt; unveränderte CSS-Größen werden nicht erneut geschrieben und Hintergrundprüfungen beendet.
- Einstellungen als benannter modaler Dialog mit gesperrtem Hintergrund, zyklischer Tastaturführung und Fokusrückgabe.
- Zentrale Auswahlschalter melden ihren gedrückten Zustand konsistent, auch nach dynamischen Aktualisierungen.
- Abgeschlossene Performance-Spans bereinigen ihre nativen Browser-Einträge. Render- und Mount-Messungen enthalten Budget und Ergebnis.
- Strukturelles Rendering liest die Elementhöhe nur bei notwendiger Scrollstabilisierung.
- Neue Verhaltensprüfungen für Tastaturbedienung und die begrenzte Speicherung von Messdaten.
- CSS im Deploy-Artefakt in einer Datei zusammengeführt; Offline-Vorladen an das Bundle angepasst.
- Der zentrale Store vergleicht bei Teilaktualisierungen nur betroffene Felder; reine Render-Abonnements erzeugen keinen ungenutzten Zustandssnapshot.
- Dynamische Bedienelemente erhalten benannte Gruppen; Vorzeichenschalter werden per Tastatur erreicht und primäre Ergebnisse als Status gemeldet.
- Die Theme-Auswahl ist entsprechend ihren gedrückten Schaltflächen als benannte Gruppe ausgezeichnet.
- Browsermatrix für die Semantik aller 15 Module und den Umbruch bei 320 CSS-Pixeln erweitert.

## Version 2.1.1 – Service-Worker-Cache-Versionierung, Druckhaltungserweiterungen und PDF-Vereinheitlichung
- Version 2.1.1 hebt den Service-Worker-Cache an (`CACHE_NAME = 'techcalc-pro-2.1.1'`), damit bereits geladene Clients (z. B. Edge/Chrome unter Windows 11) die aktualisierten Stylesheets erhalten; Stylesheets (.css) werden netzwerk-first mit Cache-Fallback ausgeliefert, die Service-Worker-Registrierung erfolgt mit `updateViaCache: 'none'`.

### Druckhaltung (pressure-holding)
- **MAG-Aufteilung (PR #36):** Große MAG-Nennvolumina werden nicht mehr als einzelnes großes Gefäß ausgegeben, sondern auf mehrere gleich große Gefäße ≤ 1000 l aufgeteilt: `n = min { n ≥ 1 : nextReflexN(Vn/n) ≤ 1000 }`, je Gefäß `nextReflexN(Vn/n)` aus der Reflex-N-Reihe. Beispiele: 2400 l → 3 × 800 l, 1200 l → 2 × 600 l, 900 l → 1 × 1000 l, 1050 l → 2 × 600 l. Der bisherige Reflex G/SL-Fallback (1500–5000 l) entfällt für normale MAG vollständig; die dynamische Druckhaltung (Reflexomat/Variomat) bleibt unberührt. Neue Ergebnisgrößen: `vesselCount`, `vesselVolumeL`, `totalSelectedVolumeL`; `productLabel` = "n × Reflex N <v>". Primärergebnis bleibt das rechnerisch erforderliche Nennvolumen `vnMag` (unverändert).
- **pSV-Plausibilitätshinweis (PR #36):** Nur bei `holdingType = 'mag'` Warnung (kein Fehler), wenn `pSV` die Reflex-Empfehlung unterschreitet: `pSV ≥ p0 + 1,5 bar` (pSV ≤ 5 bar) bzw. `pSV ≥ p0 + 2,0 bar` (pSV > 5 bar), mit Klartext inkl. empfohlenem Mindestwert und Quellenangabe.
- **Reflex Zubehör (PR #37):** Erweiterung um Reflex Zubehör nach dem Reflex-Planungshandbuch "Planen Berechnen Ausrüsten":
  - **Servitec-Entgasung (S. 57-61):** Feldgruppe "Entgasung" mit SEGMENT "Servitec verwenden" und SELECT "Servitec-Typ"; Funktion `selectServitec({ systemVolumeL, medium, tMaxC, peBar })` mit Typen: Mini (≤1000 l Wasser, ≤60°C, 0,5-2,5 bar), S (≤6000 l Wasser / ≤4000 l Glykol, ≤70°C, 0,5-4,5 bar), 35/60/75/95/120 T (bis 220000 l); Warnungen bei pe außerhalb Arbeitsdruckbereich, tMax über Typgrenze, Volumen über Tabellenwert.
  - **Nachspeisung Fillset/Fillcontrol (S. 44-45):** Feldgruppe "Nachspeisung" mit SEGMENT "Nachspeisung", DECIMAL "Fließdruck", SELECT "Systemtrennung", DECIMAL "Leitungslänge"; Produktdaten: Fillset Compact/Fillset/Fillset Impuls (kvs 1,5), Fillcontrol Plus (kvs 1,4), Fillcontrol Plus Compact (kvs 0,4), Fillcontrol Auto Compact (kvs 0,18, Pumpe 8,5 bar), Fillcontrol Auto (kvs 0,18, Pumpe 5,5 bar); Prüffungen: Fließdruck ≥ p0 + 1,3 bar, Leitungslänge < 10 m → Wasserschlagdämpfer, ≥ 10 m → kleines Refix-Ausdehnungsgefäß (2 l).
  - **Fillsoft Wasseraufbereitung (S. 51-55):** Feldgruppe "Wasseraufbereitung" mit SELECT "Verfahren" und DECIMAL "GHst"; Enthärtung: KW Fillsoft I = 3000 l·°dH, Fillsoft II = 6000 l·°dH; Formeln: Vf = KW / GHst, n = ceil(VA · GHst / KW), VN = n · KW / GHst - VA; Entsalzung mit Pflicht-Hinweis zur begrenzten Kapazitätsberechnung.
  - **Sicherheitsventil-Größenempfehlung (S. 68-69):** Abblaseleistungstabelle als Datenstruktur; Größenempfehlung: 1 l/(h·kW), speziell für Reflex-Druckhaltestationen bei 5 bar: ≤ 1000 l → G ½ (3100 l/h), > 1000 l → G 1 (10600 l/h); Warnung bei unzureichender Abblaseleistung.
  - Migration: `includeServitec` → `useServitec` mit Default 'true' für bestehende Nutzer; neue Default-Werte für `servitecType` ('auto'), `feedType` ('manual'), `waterTreatmentMethod` ('softening').
- **PDF-Erweiterungen für Druckhaltung:** Neue Abschnitte für Zubehör in PDF-Export; deutsche Labels/Einheiten für MAG-Aufteilung und pSV-Hinweise.

### Lüftung (ventilation)
- **Volumenstrom-Zeile für Kälte-Abschnitte (PR #38):** Behebt den fachlichen Ausgabefehler im PDF-Export: Gespeicherte Kälte-Leitungsabschnitte werden mit derselben Zeilenstruktur wie Heiz-Abschnitte ausgegeben, inklusive "Volumenstrom" mit korrektem Wert. Neuer Export-Resolver `resolveLineSectionVolumeFlowM3h` rekonstruiert den Volumenstrom beim Aufbau der Report-Zeilen aus den gespeicherten Eingabedaten (`inputState` via `ventilation()`), alternativ aus Massenstrom/Luftdichte bei Zulufttemperatur oder aus Leistung/Wärmewert/ΔT der gespeicherten Rechnung. Speichern (`buildVentilationLineSectionRecord`) und Laden (`savedVentilationPatch`) stellen den Volumenstrom modusunabhängig wieder her; `ventilationLineSectionStats` gibt alle 7 Zeilentypen immer aus – ein fehlender Wert erscheint als "—", keine Zeile wird stillschweigend entfernt (Verschluck-Verbot). `parseGermanNumber` in `core/pdf/pdfDataMapping.js` normalisiert deutsche Tausenderpunkte korrekt ("80.000 m³/h" wird nicht mehr als "80 m³/h" ausgegeben).

### PDF-Vereinheitlichung (PR #39)
- Einheitlicher Dokumenttitel "Berechnungsprotokoll" für alle Rechenmodule inklusive h,x-Diagramm; nur autoritative Berichte (Überflutungsnachweis, F-Gase-Informationsblatt, EN-378-Sicherheitsdatenblatt) behalten ihren Sondertitel.
- Einheitlicher Fortsetzungsbalken (Marke, Berichtstitel, Trennlinie) auf jeder Folgeseite; der volle Projekt-Metadatenblock erscheint nur auf Seite 1.
- Einheitlicher Abschnittsstil (standardSection) für alle regulären Abschnitte; der lineBlock-Stil ist entfernt. Hinweise-Blöcke (1:3-Layout) und vollbreite Zusammenstellungen behalten ihre dedizierten zentralen Renderer.
- Identisch wiederholte Abschnittstitel erhalten zentral einen Suffix (i/n).
- Report-Template-Version: `global-report-template-10-unified-module-output`.
- **Phase 49 – Review-Nacharbeiten:**
  - Abschnitt "Berichtszusammenfassung" entfernt; Fallback bei fehlenden Ergebnisabschnitten: einzelner Abschnitt mit Berichtstitel (ohne Nummerierung) und Status "Keine Ergebnisdaten verfügbar".
  - Abschnitt "Eingaben" entfernt (generic pipeline).
  - Ergebnisabschnitte tragen den Namen der gespeicherten Berechnung; "Leitungsabschnitt"/"Gespeicherte Leitungsabschnitte" als Titel entfernt. Fallbacks: Record-Name → "System, DN n" → "Rohrauslegung i" / "Berechnung (i/n)".
  - Fix: `cropCanvasToContent()` warf wegen `eight - 1` (undefiniert) eine `ReferenceError`; Korrektur: `height - 1`; Chart-Indizes bleiben an `section.chartIndex` ausgerichtet (`ImChart1`, `ImChart2`).
  - Report-Template auf `global-report-template-11-review-fixes` erhöht.
  - **Review-Runde 2:**
    - h,x: `buildHxReportPayload()` erzeugt je gespeichertem Prozess einen zusätzlichen Abschnitt "Erhitzer, Kühler und Befeuchter" aus `equipmentSizing()`.
    - Druckhaltung Hinweise: Breitenschätzung korrigiert (echte Helvetica-AFM-Glyphenbreiten in `core/pdf/pdfText.js`).
    - Regenwasser: "Hinweise / Prüfhinweise" wird als `isNotesBlock: true` (1:3-Stil) statt `fullWidthRows` gerendert.
    - Überflutung: `addPage({ continuation: false })` unterdrückt den Fortsetzungsbalken auf Vorspannseiten (Deckblatt, Inhaltsverzeichnis, erste Protokollseite).
  - **Review-Runde 3:**
    - Regenwasser: "Hinweise / Prüfhinweise" trägt kein Nummernpräfix mehr.
    - Titel-Dedupe: `dedupeSectionTitles()` entfernt – wiederholte Abschnittstitel erscheinen unverändert ohne `(i/n)`-Suffix; `(Fortsetzung)`-Suffix bei Seitenumbrüchen bleibt unberührt.
- PDF-Contract auf **2.3.0** gehoben (Regel 13 ersetzt durch "Identische Abschnittstitel bleiben unverändert"); neue Regel 14.
- Neue Regressionstests: `tests/pdf-unified-output-regression.test.mjs`, `tests/pdf-phase49-review-fixes.test.mjs`, `tests/pdf-phase49-review-round2.test.mjs`.
- Dokumentation: `docs/contracts/pdf-contract.md` auf 2.3.0 erweitert, `docs/phases/phase-48-pdf-unified-module-output.md`, `docs/phases/phase-49-pdf-export-review-nacharbeiten.md`.

### Qualität
- Alle Release-Gates grün: `npm run lint`, `npm test`, `npm run test:en378`, `npm run test:f-gases`, `npm run test:integration`, `npm run version:check`, `npm run precache:check`, `npm run audit:release-readiness`.
- Playwright E2E lokal: alle Tests passed (45-46 passed, 2 skipped).
- Neue Unit-Tests: `pressure-holding-mag-split.test.mjs`, `pressure-holding-reflex-accessories.test.mjs`, `ventilation-cooling-volume-flow-pdf.test.mjs`.
- PDF-spezifische Regressionstests für alle betroffenen Module erweitert.

## Version 2.1.0 – Aufstellungsorte nach EN 378-3
### Neu
- Vollständige Abdeckung aller Aufstellungsorte nach EN 378-3, Abschnitte 4.2 bis 4.6, mit eigenen Prüfpfaden, Eingabefeldern und Statusausgaben: im Freien (4.2), Maschinenraum (4.3), Personen-Aufenthaltsbereich (4.4), technischer Raum (4.5) und belüftetes Gehäuse (4.6). Die Pfade 4.2 und 4.3 sind Bestandteil dieses Releases einschließlich ihrer überarbeiteten, maschinenraumspezifischen Prüfungen.
- Prüfpfad für den technischen Raum nach EN 378-3, 4.5: abgeschlossene Räume mit Verdichter oder Druckbehälter werden wie Maschinenräume behandelt; Raumabschluss, Raumtrennung von Aufenthaltsbereichen und Verdichter-/Druckbehälterangaben sind Bestandteil der Bewertung.
- Prüfpfad für belüftete Gehäuse nach EN 378-3, 4.6 einschließlich Gehäusevolumen, Lüftungskanal nach Herstellerangaben (EN 378-2, 6.2.15), Frischluftversorgung, Belüftung ins Freie und Ort des Gehäuses für die toxizitätsbezogene Füllmenge nach Tabelle C.1, Spalte IV.
- Türprüfung für Maschinenräume mit R-717 nach EN 378-3, 5.14.3.4 ergänzt (Auslöser: Füllmenge über praktischem Grenzwert × Raumvolumen).
### Verbesserungen
- Alternative Vorkehrungen nach EN 378-1, Anhang C: die C.3-Variante wird nur freigeschaltet, wenn die C.3.1-Bedingungen erfüllt sind (Kältemittel A1 oder A2L, Füllmenge höchstens 150 kg bzw. 1,5 × m3); nicht anwendbare Varianten werden mit Klartext als „nicht anwendbar“ ausgewiesen statt stillschweigend ignoriert.
- Konsistenzprüfung der Aufstellungsort-Klassen: Klasse II ist im Personen-Aufenthaltsbereich unter den normativen Bedingungen (EN 378-1, 5.3 c und 5.3 d) und Klasse III im technischen Raum mit Maschinenraum-Behandlung nach EN 378-3, 4.5 zulässig; die Konsistenzprüfungen stellen dies ohne Scheinkonflikte fest.
- UI- und PDF-Ausgaben bereinigt: Bezeichnungen der Aufstellort-Optionen in deutschem Klartext, gekürzter PDF-Zusammenfassungsblock, fehlende Eingaben werden mit Klartext statt Schlüsseln gemeldet.
- Zustandsübergänge beim Wechsel von Aufstellort, Kältemittel, Klasse und Füllmenge bereinigt: feldgruppenspezifische Rücksetzungen für alle Aufstellorte, keine veralteten Bestätigungen im Zustand; Altstrukturen und nicht mehr genutzte Hilfsfunktionen entfernt.
### Qualität
- Regressionstests für die Prüfpfade 4.4, 4.5 und 4.6, die Türprüfung, Zustandsübergänge, Konsistenzprüfungen und PDF-Abschnitte ergänzt.
- Release-Gates `npm run lint`, `npm test`, `npm run test:en378`, `npm run audit:en378`, `npm run version:check`, `npm run precache:check` und `npm run audit:release-readiness` sind grün.

## Version 2.0.0 – Core-Runtime und Framework-Kernel
### Neu
- Die Laufzeitstruktur ist auf die kanonischen Bereiche `core/` und `modules/` ausgerichtet.
- Der Framework-Kernel-Vertrag dokumentiert Core als alleinige Quelle für app-weite Laufzeitverantwortungen.
- Der zentrale Datenpfad ist über `core/data` festgelegt; frühere Kompatibilitätsgrenzen unter `js/` sind nicht mehr Teil der Zielarchitektur.
- App-weite Verantwortlichkeiten wie Runtime, Verträge, Daten, Diagnostik, Events, Formulare, PDF, Rendering, State, Storage, Styles, UI und UX sind Core-Verantwortung.
- Fachmodule bleiben auf Metadaten, Konfiguration, Zustand, Schema, Berechnungslogik, Ergebnismapping, Reportadapter, Saved-Record-Adapter und modulbezogene Controller- oder View-Logik begrenzt.

### Verbesserungen
- Import-, Precache-, Release-Readiness-, Package-Hygiene- und Integrationsprüfungen wurden auf die neue Runtime-Struktur ausgerichtet.
- Die Release Notes werden unter `docs/release/RELEASE_NOTES.md` geführt; die frühere Root-Ablage wurde aus der Runtime-Precache-Prüfung entfernt.
- Die Netlify-NPM-Registry-Konfiguration ist explizit über `.npmrc` abgesichert.
- Der Playwright-GitHub-Actions-Workflow ist für die E2E-Gates wiederhergestellt.
- Der ausschließlich für Entwicklung vorgesehene Blob-Transformer-Worker besitzt einen eigenen Security Guard.

### Qualität
- Der Framework-Kernel wird durch `npm run audit:framework-kernel` geprüft.
- Die vollständigen Gates bleiben über `npm test`, `npm run test:f-gases`, `npm run test:flooding` und `npm run test:integration` abgesichert.
- Die Release-Version wurde auf `2.0.0` angehoben; `package.json`, Manifest, Service Worker und Release-Readiness sind darauf synchronisiert.

## Version 1.6.1 – PDF-Export-Vereinheitlichung
### Verbesserungen
- Der PDF-Export der Berechnungsmodule läuft über die zentrale Typed-DTO-PDF-Engine.
- Heizung/Kälte und Lüftung dienen als Referenz für den einheitlichen Protokollaufbau der allgemeinen Berechnungsmodule.
- Rohrdimensionierung, Schmutzwasser, Regenwasser, Mischluft, Wärmerückgewinnung, Trinkwasser, Druckhaltung, Pufferspeicher, Einheitenumrechnung und h,x-Diagramm wurden an den einheitlichen PDF-Aufbau angeglichen.
- Gespeicherte Datensätze werden als eigene Abschnitte mit deutschen Volltextbezeichnungen, einheitlicher Zahlenformatierung und passenden Einheiten ausgegeben.
- h,x-Prozesse werden mit zugehörigem Diagramm je gespeichertem Prozess auf eigenen Seiten dargestellt.
- F-Gase nutzt im PDF die Überschrift „Informationsblatt“, EN 378 die Überschrift „Sicherheitsdatenblatt“.
- Firmenlogo und TechCalc-Branding-Opt-out bleiben erhalten; der nicht mehr benötigte Abschlussblock wurde aus den allgemeinen Berechnungsprotokollen entfernt.
### Behoben
- Englische Feldnamen, doppelte Rohdaten und technische Zwischenstrukturen wurden aus den berechnungsbezogenen PDF-Ausgaben entfernt.
- Liter- und Tausenderwerte in Druckhaltung und Pufferspeicher werden korrekt formatiert.
- Schmutzwasser- und Trinkwasserexporte enthalten die relevanten Berechnungs-, Dimensionierungs- und Einrichtungsgegenstandsangaben.
- Abschnittsweise Seitenumbrüche reduzieren doppelte Fortsetzungsdarstellungen in mehrseitigen Protokollen.
### Qualität
- Der bisherige Legacy-DOM-PDF-Export wurde entfernt beziehungsweise deaktiviert abgesichert.
- Der PDF-Export verwendet den vom Moduladapter zwischengespeicherten Berechnungs- und Ergebnisstand und stößt keine neue Fachberechnung an.
- PDF-spezifische Regressionstests für gespeicherte Datensätze, Modulberichte, h,x-Diagramme, Druckhaltung, Pufferspeicher, Schmutzwasser und Trinkwasser wurden ergänzt oder erweitert.

## Version 1.6.0 – EN 378 Sicherheitscheck
### Neu
- EN-378-Sicherheitscheck als eigenständiges Modul für die sicherheitstechnische Bewertung von Kälte-, Klima- und Wärmepumpenanlagen integriert.
- Import gespeicherter Anlagen-Snapshots aus dem F-Gase-Check ergänzt; importierte Daten werden als Kopie in der EN-378-Bewertung verwendet.
- Bewertung von Kältemittel, Füllmenge, Raumvolumen, Aufstellort, Zugangsbereich, Nutzung, Lüftung und Sicherheitsmaßnahmen ergänzt.
- EN-378-Füllmengenbewertung nach Anhang C mit getrennten Prüfpfaden für Toxizität, Brennbarkeit und alternative Risikomaßnahmen integriert.
- Planer-Leitfaden mit erforderlichen Maßnahmen, offenen Prüfpunkten und Hinweisen zur Aufstellung, Lüftung, Detektion, Alarmierung und Dokumentation ergänzt.
- PDF-Bericht für EN-378-Bewertungen über den zentralen PDF-Reportpfad integriert.
### Verbesserungen
- Kältemittelplattform um EN-378-Sicherheitsdaten, praktische Grenzwerte, ATEL/ODL-, LFL-, QLMV- und QLAV-Daten erweitert.
- Projektpersistenz für F-Gase-Anlagen-Snapshots und EN-378-Bewertungen über den zentralen Projektmodul-Adapter ergänzt.
- Saved-record-Darstellung für F-Gase und EN 378 an den zentralen Renderer und die bestehenden UI-Zustände angeglichen.
- Ausgaben in UI und PDF auf deutsche Volltextbezeichnungen ohne interne Schlüssel stabilisiert.
- Mobile Darstellung und kontextabhängige Eingabebereiche für EN 378 verbessert.
### Behoben
- Gespeicherte F-Gase-Anlagen-Snapshots werden nun in Projektdaten übernommen und nach dem Laden wieder bereitgestellt.
- EN-378-Bewertungen behalten importierte Anlagenstände, gespeicherte Bewertungseinträge und PDF-Daten projektübergreifend bei.
- Der bestehende Flooding-Projektadaptervertrag bleibt trotz zusätzlicher Moduladapter unverändert erhalten.
## Version 1.5.1 – PDF-Branding
### Neu
- TechCalc-Pro-Branding kann in den Projekteinstellungen für den PDF-Export gezielt ein- oder ausgeblendet werden.
- Die Einstellung ist standardmäßig aktiviert und wird projektbezogen gespeichert; bestehende Projekte behalten damit das bisherige PDF-Verhalten.
### Verbesserungen
- Bei deaktiviertem Branding werden TechCalc-Pro-Icon, Produktname und „HLSK QUICK TOOLS“ durchgängig aus dem PDF entfernt – einschließlich Deckblatt und Inhaltsverzeichnis des Überflutungsnachweises.
- Das Firmenlogo bleibt unabhängig von der TechCalc-Pro-Branding-Option im PDF erhalten.
- Die Branding-Option wird als kompakter iOS-orientierter Toggle-Switch dargestellt und ist für Light und Dark Mode abgestimmt.
- Tastaturfokus und bestehende Bedienbarkeit der PDF-Einstellungen bleiben erhalten.
## Version 1.5.0 – F-Gase-Check
### Neu
- F-Gase-Check für Kälte-, Klima- und Wärmepumpenanlagen integriert.
- Gemeinsame Kältemittelplattform mit GWP-, Sicherheitsklassen- und regulatorischen Daten ergänzt.
- Regulatorische Prüfung für Inverkehrbringen, Service, Dichtheitskontrolle, Leckage-Erkennung, Dokumentation, Zertifizierung und Betreiberpflichten ergänzt.
- Versionierte Anlagen-Snapshots, Saved Records und PDF-Ausgabe integriert.
### Verbesserungen
- Regulatorische Zeitbezüge für Inverkehrbringen, Inbetriebnahme und Bestandsprüfung getrennt.
- Kältemittel werden bevorzugt mit R-Bezeichnungen dargestellt.
- PDF-Tabellen verwenden zentral ein einheitliches Vier-Spalten-Raster mit mehrzeiligem Umbruch.
- Zentraler PDF-Textumbruch verhindert willkürliche Einzelbuchstaben-Trennungen.
- Tastaturnavigation bei Select-Feldern über dynamische Renderzyklen stabilisiert.
### Behoben
- Leere Kältemittelzustände können das F-Gase-Modul nicht mehr beim Laden abbrechen.
- Hermetische Ausnahme nach § 2 Abs. 3 ChemKlimaschutzV wird nur bei erfülltem Status und Kennzeichnung angewendet.
- Service- und Quotenhinweis sind fachlich getrennt und konsistent beschriftet.
## Version 1.4.0 – Final Release
### Freigabe
TechCalc Pro 1.4.0 ist als Produktionsversion freigegeben. Der Überflutungs- und Rückhaltenachweis sowie alle zugehörigen Qualitäts-, Plattform- und PDF-Arbeiten sind abgeschlossen.
### Neu
- Überflutungs- und Rückhaltenachweis als eigenständiges Fachmodul vollständig integriert.
- DIN-1986-100-Nachweis, bedingte DWA-A-117-Rückhaltebemessung und Dauerstufenvergleich ergänzt.
- Flächen-Snapshot-Import aus dem Regenwassermodul ohne Rückschreibung umgesetzt.
- Professionelle Diagnostik, Plausibilitätsprüfung und Ergebnisinterpretation ergänzt.
- Behörden-PDF mit Deckblatt, Inhaltsverzeichnis, Tabellen, Diagrammen und Pagination fertiggestellt.
### Verbesserungen
- Zentraler Modul-, Layout- und Spacing-Vertrag über alle Module vereinheitlicht.
- Browser-, Viewport-, Theme-, Offline-, Projekt- und PDF-Regression erweitert.
- Mischluft-, WRG- und Legacy-Projektlebenszyklus stabilisiert.
