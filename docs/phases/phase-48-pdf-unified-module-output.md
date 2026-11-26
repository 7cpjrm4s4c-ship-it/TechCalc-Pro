# Phase 48 – Vereinheitlichte PDF-Ausgabe über alle Module

Status: umgesetzt
Datum: 2026-11-25
Report-Template-Version: `global-report-template-10-unified-module-output`

## Ziel

Die PDF-Ausgabe erzeugt ein einheitliches Bild über alle Module. Bisherige Formatierungsunterschiede zwischen den Modul-PDFs (Rohrdimensionierung, Trinkwasser, Druckhaltung, Schmutzwasser, h,x-Diagramm) werden zentral im Renderer beseitigt.

## Festgestellte Inkonsistenzen (Ist-Aufnahme anhand der Modul-PDFs vom 25.11.2026)

1. Dokumenttitel: die meisten Module nutzen „Berechnungsprotokoll", das h,x-Diagramm jedoch „h,x-Diagramm" als Haupttitel.
2. Fortsetzungsseiten: das h,x-Modul wiederholt auf jeder Folgeseite den vollen Kopfbereich inklusive Projekt-Metadatenblock; alle anderen Module wiederholen nichts.
3. Abschnittstitel: generische Titel werden unverändert mehrfach wiederholt („Trinkwasser" 5-fach, „Berechnung" 3-fach, „Leitungsabschnitt" 2-fach).
4. Abschnittsstil: Leitungsabschnitte (Rohrdimensionierung) und strukturierte Druckhaltungs-Records nutzen den lineBlock-Stil (Titelleiste im Kasten), während Trinkwasser, Schmutzwasser und h,x den standardSection-Stil (Akzentüberschrift + Tabelle) verwenden. Innerhalb eines einzigen Druckhaltungs-PDFs traten beide Stile gemischt auf.

## Zentrale Änderungen (allein im zentralen Renderer, keine Modul-Patches)

1. `core/pdf/pdfDataMapping.js`: Damit der Dokumenttitel vereinheitlicht wird, dass nur noch `flooding-verification` (Behördennachweis) als autoritatives berichtendes Modul vom Standardtitel „Berechnungsprotokoll" ausgenommen ist. `f-gases-check` (Informationsblatt) und EN 378 (Sicherheitsdatenblatt) ergeben sich unverändert aus `specialReportHeading`. Das h,x-Diagramm erhält damit den einheitlichen Titel; die Modulidentität bleibt in der Untertitelzeile erhalten.
2. `core/pdf/pdfLayout.js`:
   - `dedupeSectionTitles`: identisch wiederholte Abschnittstitel erhalten zentral einen Suffix `(i/n)`; einmalige Titel bleiben unverändert.
   - `addPage` erzeugt auf jeder Folgeseite einen einheitlichen, kompakten Fortsetzungsbalken (Marke links, Berichtstitel zeilen rechts, Trennlinie). Der volle Projekt-Metadatenblock bleibt exklusiv auf Seite 1.
   - `build` rendert jeden Abschnitt einheitlich über `renderSection`: reguläre Abschnitte einschließlich bisheriger `isLineSection`-Abschnitte nutzen durchgängig `standardSection`; nur inhalts-spezifische Blocktypen (Hinweise-Block im 1:3-Layout, vollbreite Zusammenstellungen) behalten ihre dedizierten zentralen Renderer.
   - Der h,x-Pfad behält einen Seitenwechsel je gespeichertem Prozess, wiederholt jedoch keinen Kopfbereich mehr; die zugehörigen Diagramme folgen unverändert je Record.
   - Der pensionierte lineBlock-Renderer und `pairedRowsForPdf` (inkl. bevorzugter Zeilenreihenfolge) sind entfernt; einheitliche Zeilenpaarung erfolgt über `pairSequentialRows`.
3. `core/pdf/reportTheme.js`: `REPORT_TEMPLATE_VERSION` auf `global-report-template-10-unified-module-output` erhöht.

## Bewusste Ausschlüsse und Folgeentscheidungen

- Inhaltliche Formeldarstellungen (z. B. LaTeX-artige Formeltexte im Trinkwassermodul) sind Inhalt und kein Layout; eine inhaltliche Vereinheitlichung der Formelnotation ist als Folgeaufgabe dokumentiert.
- Das autoritative Flooding-PDF (Cover, Inhaltsverzeichnis, Executive Summary) ist eine eigene Engine (`authorityPdfReport`) und bleibt unberührt.
- Der Druckhaltungs-Zubehör-Workflow (Sprührohrentgaser, Nachspeisung, Wasseraufbereitung, Sicherheitsventil inkl. Hinweise-Block) bleibt inhaltlich vollständig erhalten; nur die Darstellung ist jetzt einheitlich.

## Tests und Gates

- Neu: `tests/pdf-unified-output-regression.test.mjs` prüft Titel-Dedupe, Fortsetzungsbalken, einmaligen Projektblock, einheitlichen Standardstil, h,x-Standardtitel und verbleibende Hinweise-Blöcke; in `scripts/test-fast.mjs` registriert.
- Angepasst: `tests/hx-enthalpy-power.test.mjs` (Quellcode-Assertions auf neue build/renderSection-Form), `tests/rc11-pdf-pixel-perfect.test.mjs` (Template-Version).
- Gegrünnt: audit-test-contracts (312 Dateien), test-fast-Gate, Integration-Gate, EN-378-PDF- sowie sämtliche pdf-bezogenen Modultests (Drinking-Water, Wastewater, Buffer-Storage, Pressure-Holding inkl. Reflex-Zubehör, F-Gases-PDF, Ventilation), Import- und Cleanup-Audits.
