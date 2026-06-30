# TechCalc Pro 1.3.1 RC 2 – Development / Netlify

Basis: 1.3.1 Beta 31

Schwerpunkt dieses Builds ist RC-1C.1: PDF-Qualität und Wartbarkeit der PDF-Engine.

## Änderungen
- PDF-Engine aus `pdfExport.js` in logisch getrennte Module zerlegt.
- Standard-PDF-Abschnitte auf Vier-Spalten-Raster umgestellt.
- h,x-Diagramm-Export vorbereitet und Prozesspunkte wieder in den Report aufgenommen.
- Sonderzeichen-Normalisierung für native PDF-Ausgabe erweitert.
- Service-Worker-Precache auf `1.3.1-rc.2` aktualisiert.

## Validierung
- PDF-Module Syntaxprüfung durchgeführt.
- Precache-Manifest neu generiert.
