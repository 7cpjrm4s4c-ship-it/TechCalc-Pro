# Phase 49 – PDF-Export: Review-Nacharbeiten

Status: umgesetzt
Datum: 2026-11-26
Report-Template-Version: `global-report-template-11-review-fixes`
PDF-Vertrag: `docs/contracts/pdf-contract.md` Version 2.2.0 (neue Regel 14; Regeln 10–13 unverändert)
Basis: Branch `feature/pdf-unified-module-output` (PR #39, Report-Template `global-report-template-10-unified-module-output`)

## Ziel

Umsetzung der Review-Befunde A1–A4 zentral im PDF-Renderer und in den zentralen Report-Adaptern. Keine modulspezifischen Layout-Sonderfälle; die autoritative Engine `authorityPdfReport` (EN 378, F-Gase, Überflutungsnachweis) und deren Abschnitts-Dateien (`en378ReportSections.js`, `fGasesReportSections.js`, `floodingReportSections.js`) bleiben unberührt.

## A1 – Abschnitt „Berichtszusammenfassung" entfernt

- `core/pdf/genericReportSections.js`: `reportSummarySection()` entfernt; der Abschnitt wird in `buildGenericReportSections()` nicht mehr vorangestellt.
- **Entscheidung Fallback (offener Punkt aus dem Review):** Liefert ein Modul keinerlei Ergebnisabschnitte, wird kein Fehler geworfen und kein leeres Dokument erzeugt, sondern ein einzelner Abschnitt mit dem Titel des Berichts (ohne Nummerierung, `metadata.reportHeading` bzw. Modultitel) und der Statuszeile `Keine Ergebnisdaten verfügbar` (`emptyResultSection()`). Begründung: Der PDF-Export muss stets ein valides Dokument liefern; der Zustand ist für den Anwender erkennbar ausgewiesen.
- `isMetadataSection()` filtert zusätzlich auch `Eingaben` (mit optionaler Nummerierung), damit kein Modul über `reportDto.sections` versehentlich einen solchen Abschnitt einschleusen kann.

## A2 – Abschnitt „Eingaben" entfernt

- `core/pdf/genericReportSections.js`: `inputSection()` entfernt; `providedSections()` erzeugt keinen `Eingaben`-Fallback mehr aus `reportDto.input`.
- `core/pdf/typedDtoReportAdapter.js`: `inputSection` aus `buildGenericModuleReportDto()` entfernt (inkl. der nun ungenutzten Schema-Eingabezeilen-Helfer `schemaInputRows`/`readFieldValue`/`isFieldVisible`/`optionLabel`).
- `core/pdf/pdfLayout.js`: `isHxMetaSection()` zurückgebaut. Begründung: Nach A1/A2 erzeugt die generische Pipeline diese Abschnitte nicht mehr, und `isMetadataSection()` filtert sie zentral bereits vor dem h,x-Zweig (`keepAllSections`), sodass der Doppelfilter gegenstandslos war. Der h,x-Pfad iteriert jetzt direkt über alle Abschnitte.

## A3 – Ergebnisabschnitte tragen den Namen der gespeicherten Berechnung

- `core/pdf/typedDtoReportAdapter.js`: `savedRecordBaseTitle('savedPipes')` liefert nicht mehr `Leitungsabschnitt`, sondern `Rohrauslegung` (fachlich beschreibend); `savedLineSections` wird zu `Gespeicherte Rohrstränge` statt `Gespeicherte Leitungsabschnitte`. `savedRecordSections()` betitelt den Abschnitt direkt mit `savedRecordTitle()` (name-first, dann `System, DN n`, dann `Basis i`).
- `core/pdf/pdfDataMapping.js` `lineSectionItems()`: Die Bezeichnungszeile des Records hat Vorrang vor dem Abschnittstitel; erst danach folgt der Abschnittstitel, und als letzter Fallback ein neutraler Titel `Berechnung (i/n)` – niemals `Leitungsabschnitt`.
- `modules/ventilation/reportAdapter.js`, `modules/heating-cooling/reportAdapter.js`: Sammel-Abschnittstitel `Gespeicherte Leitungsabschnitte` → `Gespeicherte Berechnungen`; Bezeichnungs-Fallback `Leitungsabschnitt n` → `Berechnung n`. Jeder Record erscheint über seine Bezeichnungszeile unter seinem gespeicherten Namen.
- `core/pdf/ventilationReportSections.js`: Leitungsabschnitt-Gruppen übernehmen den Gruppentitel des DTO statt des generischen `Leitungsabschnitte`.

Abnahme: In den PDF-Textlayern der Modultests kommen `Leitungsabschnitt` und `Gespeicherte Leitungsabschnitte` nicht mehr vor; Abschnittstitel entsprechen den gespeicherten Namen (siehe `tests/pdf-phase49-review-fixes.test.mjs`).

## A4 – h,x-Diagramm fehlte im PDF (Ursache-Wirkung-Kette)

Prüfkette und Befund:

1. **DTO-Erzeugung** (`modules/hx-diagram/index.js` `buildHxReportPayload()`): fehlerfrei – jeder Record mit gültigem Prozesspfad erhält `section.chartIndex` und `reportDto.charts[i].svg`.
2. **Sammlung** (`core/pdf/pdfDataMapping.js` `collectCurrentModule()`): fehlerfrei – `reportDto.charts` bleibt erhalten.
3. **Rasterisierung** (`core/pdf/pdfExport.js` `chartImagesForReport()` → `core/pdf/pdfChartRender.js` `svgToJpeg()` → `cropCanvasToContent()`): **hier schlug die Kette fehl.** `cropCanvasToContent()` enthielt `maxY = Math.min(eight - 1, maxY + padding)` – `eight` ist undefiniert, die Zeile warf eine `ReferenceError`. Diese wurde vom `try/catch` in `svgToJpeg()` still mit `null` quittiert (Warnung im Logger), sodass jedes h,x-SVG (und jedes Canvas-Diagramm) zu `null` wurde. Zusätzlich kompaktierte `chartImagesForReport()` die Bilder mit `if (image) images.push(image)` und der `GlobalPdfReport`-Konstruktor mit `chartImages.filter(Boolean)` – dadurch hätten selbst bei Teilerfolg die `chartIndex`-Zuordnung und die `ImChart`-Namen verschoben werden können.
4. **Ausgabe** (`core/pdf/pdfLayout.js` `build()` h,x-Pfad → `sectionChartBlock()`): `chartImages[section.chartIndex]` war `undefined` → `return false` → kein Diagrammblock, obwohl jeder Prozess eine eigene Seite erhielt.

Fixes:

- `core/pdf/pdfChartRender.js`: `eight - 1` → `height - 1`.
- `core/pdf/pdfExport.js`: `chartImagesForReport()` schreibt `images[index] = await svgToJpeg(...)` (Index bleibt an `section.chartIndex` ausgerichtet; Fehlschlag wird geloggt).
- `core/pdf/pdfLayout.js`: Konstruktor behält `chartImages` ungefiltert und benennt nur erfolgreiche Bilder als `ImChart${index + 1}`; `sectionChartBlock()` überspringt `null`-Slots ohne Verschiebung.

Abnahme: `tests/pdf-phase49-review-fixes.test.mjs` erzeugt den PDF-Byte-Strom für zwei gespeicherte h,x-Prozesse und prüft je Prozess genau ein Bild-XObject (`ImChart1`, `ImChart2`) sowie den Diagrammtitel `<Prozessname> – h,x-Diagramm` im Textlayer.

## Weitere Änderungen

- `core/pdf/reportTheme.js`: `REPORT_TEMPLATE_VERSION` auf `global-report-template-11-review-fixes` erhöht (visuelles PDF-Bild ändert sich durch die entfernten Abschnitte gegenüber Template 10).
- `docs/contracts/pdf-contract.md` auf Version 2.2.0 gehoben, Stand auf Phase 49 / Template 11 aktualisiert; neue Regel 14 (keine `Berichtszusammenfassung`/`Eingaben` in generischen Modul-PDFs, Abschnittstitel = gespeicherter Name, Fallback `Keine Ergebnisdaten verfügbar`). Regeln 10–13 sind unverändert, weil sie die entfernten Abschnitte nicht beschrieben.
- Fortsetzungsbalken, Titel-Dedupe `(i/n)` und der einheitliche `standardSection`-Stil aus Phase 48 bleiben unverändert.

## Tests und Gates

- Neu: `tests/pdf-phase49-review-fixes.test.mjs` (A1–A4, inkl. h,x-PDF-Byte-Strom mit `ImChart1`/`ImChart2` und Diagrammtiteln); in `scripts/test-fast.mjs` registriert.
- Angepasst: `tests/pdf-unified-output-regression.test.mjs` (Template 11, A1/A2/A3-Asserts), `tests/hx-enthalpy-power.test.mjs` (h,x-Abschnitte ohne Meta-Filter, Layout-Quellcode-Asserts), `tests/rc11-pdf-pixel-perfect.test.mjs` (Template-Version), `tests/buffer-storage-pdf-saved-records.test.mjs` und `tests/wastewater-pdf-saved-records.test.mjs` (Abschnittstitel = Record-Name), `scripts/test-heating-cooling-report.mjs` (keine `1. Berichtszusammenfassung`, Sammelabschnitt `Gespeicherte Berechnungen`, Record-Namen als Blöcke).
- Gegrannt: `audit-test-contracts`, `scripts/test-fast.mjs`, Integration-Gate (`scripts/test-integration.mjs`).

## Review-Runde 2 (26.11.2026, Modul-PDFs hx, Druckhaltung, Regenwasser, Überflutung)

### B1 – h,x-PDF enthielt die Card „Erhitzer, Kühler und Befeuchter" nicht

- `modules/hx-diagram/results.js`: `equipmentSizing()` exportiert (bisher nur UI-intern). Es bleibt die einzige Quelle für die Geräteleistungen.
- `modules/hx-diagram/index.js` `buildHxReportPayload()`: Je gespeichertem Record wird ein zusätzlicher Abschnitt `Erhitzer, Kühler und Befeuchter` erzeugt; die Zeilen stammen direkt aus `equipmentSizing(recordInput, recordPath, process)` desselben Record-Kontexts (keine zweite Berechnungslogik, keine Kopie). Beide Abschnitte eines Records tragen `recordIndex`, damit sie auf einer Seite bleiben.
- `core/pdf/pdfLayout.js` h,x-Pfad: Seitenwechsel nur bei Wechsel von `recordIndex` – jeder gespeicherte Prozess bleibt auf einer eigenen Seite (Zustandspunkte, ggf. Diagramm, Geräte-Abschnitt).

### B2 – Hinweise-Block: langer Wasseraufbereitungstext lief aus dem Feld

Ursache: `estimateTextWidth()` in `core/pdf/pdfText.js` schätzte Kleinbuchstaben pauschal mit 0.50 em, real messen PDF-Viewer (Base-14 Helvetica, keine eingebettete Schrift) z. B. `a`/`e`/`n` mit 0.556 em. Dadurch glaubte `splitPdfText()`, dass eine Zeile in das Wertfeld passe, obwohl sie real ca. 10 % breiter war, und lief über die rechte Feldkante hinaus.

Korrektur: `estimateTextWidth()` verwendet die tatsächlichen Helvetica-AFM-Glyphenbreiten (units/1000). Damit stimmen geschätzte und reale Breite überein; der ~298-stellige Wasseraufbereitungs-Hinweis wird in ≤ 3 Zeilen innerhalb von `valueW` umbrochen, kürzere Hinweise bleiben einzeilig, Zeilenhöhe und Seitenumbruch des Blocks richten sich an der tatsächlichen Zeilenzahl aus (unverändertes `notesBlock`-Layout).

### B3 – Regenwasser „Hinweise / Prüfhinweise" im einheitlichen Hinweise-Stil

- `core/pdf/rainwaterReportSections.js`: Der Warnungen-Abschnitt wird nicht mehr mit `fullWidthRows: true` erzeugt, sondern als `isNotesBlock: true` mit Zeilen `[Label, Text, '']` (Label leer, da kein kurzer Prüfbegriff vorliegt). Damit rendert er zentral über `notesBlock()` im selben 1:3-Kastenstil wie die Druckhaltung.

### B4 – Überflutungsnachweis: Fortsetzungsbalken erst ab Seite 4

Ursache: `installAuthorityCoverPage()` erzeugte Inhaltsverzeichnis (Seite 2) und erste Protokollseite (Seite 3) per `addPage()`; `addPage()` zeichnet ab der zweiten Seite den Fortsetzungsbalken – Seite 2 und 3 erhielten so zusätzlich zur großen Kopfzeile fälschlich den Balken.

Korrektur zentral: `addPage({ continuation })` in `core/pdf/pdfLayout.js` – mit `continuation: false` wird der Balken unterdrückt. Die Authority-Engine nutzt die Option für ihre beiden Vorspann-`addPage()`-Aufrufe (`core/pdf/authorityPdfReport.js`). Seiten 1–3 tragen ausschließlich die großen Kopfzeilen; ab Seite 4 erscheint der Balken auf jeder Folgeseite; der PROJEKT-Block bleibt exakt einmal auf Seite 3.

### Tests Runde 2

- Neu: `tests/pdf-phase49-review-round2.test.mjs` (B1: Equipment-Abschnitt je Prozess mit exakt den `equipmentSizing()`-Zeilen im PDF-Textlayer; B2: realer Wasseraufbereitungstext ≤ 3 Zeilen, jede Zeile innerhalb `valueW`, kurze Hinweise einzeilig; B3: `isNotesBlock` statt `fullWidthRows`, Rendering über `notesBlock()`; B4: Flooding-Fixture mit 5 Seiten – Balken nicht auf Seiten 1–3, ab Seite 4 überall, PROJEKT genau einmal auf Seite 3); in `scripts/test-fast.mjs` registriert.
- Angepasst: `tests/hx-enthalpy-power.test.mjs` und `tests/pdf-phase49-review-fixes.test.mjs` (Equipment-Abschnitte, `recordIndex`, Layout-Quellcode-Asserts).
- Gegrannt: `audit-test-contracts`, `scripts/test-fast.mjs`, Integration-Gate, Flooding-Phase-47C-Gate (51 Dateien), EN-378-PDF-Tests.

## Review-Runde 3 (26.11.2026, Modul-PDFs Regenwasser und Druckhaltung)

### C1 – Regenwasser: Nummerierung des Hinweise-Blocks entfernt

- `core/pdf/rainwaterReportSections.js`: Der Warnungen-Abschnitt heißt nicht mehr `${sections.length+1}. Hinweise / Prüfhinweise`, sondern schlicht `Hinweise / Prüfhinweise` – unabhängig von der Anzahl der Flächenabschnitte, die ihre unveränderte Nummerierung behalten.
- Kontrolle generische Pipeline: Es wurden keine weiteren generischen Abschnittserzeuger mit Lücken-Nummerierung gefunden. Die durchgehende Nummerierung in `modules/drinking-water/index.js` (`sectionNumber++`) sowie der nummerierte Aufbau von EN 378 und Überflutungsnachweis bleiben unangetastet; der Fallback `Abschnitt ${index+1}` in `genericReportSections.js` ist konstruktionsbedingt lückenlos und bleibt.

### C2 – Titel-Dedupe `(i/n)` vollständig entfernt

- `core/pdf/pdfLayout.js`: `dedupeSectionTitles()` entfernt; `build()` reicht die Abschnittstitel aus `reportSections()` unverändert durch. Wiederholte Titel (z. B. `Sprührohrentgaser`, `Hinweise`, zwei gleiche Record-Namen) erscheinen ohne Suffix. Das Fortsetzungs-Suffix `(Fortsetzung)` bei Seitenumbrüchen bleibt davon unberührt.
- `docs/contracts/pdf-contract.md` auf Version 2.3.0 gehoben; Regel 13 ersetzt durch „Identische Abschnittstitel innerhalb eines Dokuments bleiben unverändert“. Report-Template bleibt `global-report-template-11-review-fixes`.
- Tests: `tests/pdf-unified-output-regression.test.mjs` assertet jetzt doppeltes, unverändertes Auftreten identischer Titel und das Fehlen jeglicher `(i/n)`-Suffixe; `tests/pdf-phase49-review-round2.test.mjs` ergänzt C1 (exakter Titel ohne Präfix) und C2 (Equipment-Titel exakt, ohne Suffix).

### Tests Runde 3

- Angepasst: `tests/pdf-unified-output-regression.test.mjs`, `tests/pdf-phase49-review-round2.test.mjs`.
- Gegrannt: `audit-test-contracts`, `scripts/test-fast.mjs`, Integration-Gate, Flooding-47C-Gate, alle pdf-bezogenen Modultests (Drinking-Water, Wastewater, Buffer-Storage, Pressure-Holding, Ventilation, F-Gases, h,x, rc11).
