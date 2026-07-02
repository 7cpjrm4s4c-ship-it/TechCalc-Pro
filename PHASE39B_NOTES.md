## Version 1.3.1 Beta 8 - PDF Two-Column Report Layout

- UI-Designentwicklung aus Beta 2-6 nicht uebernommen; Ausgangsbasis ist wieder die stabile 1.3.2-dev.1-Entwicklungsbasis.
- PDF-Export kompakter aufgebaut: reduzierter Seitenrand, kompakter Header, zweispaltige Abschnittsdarstellung und kleinere Tabellenabstaende.
- Projektbezogene Firmenlogo-Integration fuer den PDF-Header oben rechts ergaenzt.
- Projektdatei speichert das PDF-Firmenlogo optional als Data-URL mit.
- AGB-Seite technisch an bestehende Qualitaets-Gates fuer Kontakt, Gueltigkeitsdatum und Ruecknavigation angeglichen.

# Phase 39B — Versioned Build Artifact

Status: implemented on top of the current 39C source state.

Release contract:

1. `npm run build` remains a source validation path and does not create deploy output.
2. `npm run build:minified` is the deploy build. It recreates `dist/` from scratch.
3. Netlify uses `npm run build:minified` and publishes only `dist/`.
4. `dist/build-info.json` is generated with package name, package version, artifact id, minification metadata and SHA-256 file manifest.
5. Generated artifacts remain excluded from source validation and source packages via `.gitignore`, `check-js-imports` skip rules and package hygiene guards.

Validation:

- `audit:artifacts`
- `npm test`
- `npm run test:integration`
- `npm run build`
- `npm run build:minified`


## 1.3.1 RC 2

- Logo-Wiederherstellung in der Projekteinstellungs-UI korrigiert.
- Logo-Vorschau für geladene Projektdateien ergänzt.
- Dateiinput bleibt aus Browser-Sicherheitsgründen leer, die App zeigt Status/Vorschau separat.

## 1.3.1 RC 2

RC-1C.1: PDF-Engine-Refactoring und Korrekturen für Trinkwasser, h,x-Diagramm, WRG, Schmutzwasser, Pufferspeicher und Einheiten. Keine Feature-Erweiterung, nur Release-Stabilisierung.


## 1.3.2-dev.1
- RC-1C PDF-Layout-Korrekturen: Spaltenausrichtung, lange Texte, h,x-Diagramm-Vorbereitung, WRG/Trinkwasser-Layout.
