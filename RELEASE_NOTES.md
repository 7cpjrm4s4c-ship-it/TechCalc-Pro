# TechCalc Pro 1.3.1 RC 5

- PDF-Raster für Heiz/Kälte, Trinkwasser und WRG stabilisiert.
- Lange Werte werden kontrolliert mehrzeilig gesetzt statt in Nachbarspalten zu laufen.
- h,x-Diagramm-Export robuster vorbereitet.
- RC-1C-Korrekturen für professionelle PDF-Ausrichtung.

# TechCalc Pro 1.3.1 RC 2

## RC-1C.1 – PDF-Korrekturen und PDF-Engine-Refactoring

### PDF-Korrekturen
- Trinkwasser-PDF: Tabellenraster vereinheitlicht, damit Werte sauber auf den Linien sitzen.
- Trinkwasser-PDF: Sonderzeichen in Formeln werden PDF-kompatibel normalisiert.
- h,x-Diagramm: Diagramm-Rendering als JPEG-Bild in den nativen PDF-Export vorbereitet.
- h,x-Diagramm: Prozesspunkte aus Diagramm-Karten werden nicht mehr verworfen, sondern als eigener Abschnitt exportiert.
- WRG-/Einheiten-/allgemeine Ergebnisabschnitte: Standardabschnitte verwenden nun ein kompaktes Vier-Spalten-Raster.
- Schmutzwasser/Einheiten: problematische Sonderzeichen werden bereinigt, damit keine Fragezeichen im PDF entstehen.
- Pufferspeicher: längere Bezeichnungen erhalten mehr Label-Breite im Vier-Spalten-Raster.

### Refactoring
Die bisherige monolithische `js/core/pdfExport.js` wurde aufgeteilt:

- `js/core/pdfExport.js` – Einstiegspunkt, Projektformular, Logo-Upload, Export-Button
- `js/core/pdf/pdfText.js` – Textnormalisierung, PDF-Text-Encoding, Typografie-Hilfsfunktionen
- `js/core/pdf/pdfDataMapping.js` – DOM-/Moduldaten zu PDF-Reportdaten
- `js/core/pdf/pdfChartRender.js` – Bild-, Canvas- und SVG-Konvertierung für PDF
- `js/core/pdf/pdfLayout.js` – natives PDF-Layout, Tabellen, Header, Footer, Paginierung
- `js/core/pdf/reportTheme.js` – PDF-Seitengrößen und Theme-Tokens

### RC-Regeln
Keine neuen Features. Diese Version enthält ausschließlich PDF-Stabilisierung, Fehlerkorrekturen und Wartbarkeitsverbesserungen im Rahmen von RC-1C.


## Phase 37E – RC Closure
- Release-Candidate-Closure-Audit bleibt für RC-Builds dokumentiert.


## Phase 38F
- Esbuild-Minification-Audit bleibt für RC-Builds dokumentiert.

## 1.3.1-rc.5

- PDF Layout Engine zentralisiert: feste 4-Spalten-Matrix für alle Module.
- Gerade Wertspalten verwenden eine feste rechte Bezugskante.
- Textumbruch innerhalb der Zellen stabilisiert.
- h,x-Diagramm-Captures werden beschnitten und in eine feste Diagramm-Box eingepasst.
- PDF-Theme-Konfiguration für Raster, Zeilenhöhe und Diagrammflächen ergänzt.

