## Version 1.3.1 Beta 24 - PDF Leitungsabschnitt Raster

Basis: 1.3.1 Beta 22. Fokus: professionelle Ausrichtung gespeicherter Einträge im nativen PDF-Export.

## Version 1.3.1 Beta 24 - PDF Logo Persistence Fix

Basis: 1.3.1 Beta 20. Fokus: Firmenlogo-Speicherung, Bildrendering und Logo-Slot-Hoehe im PDF.

## Version 1.3.1 Beta 24 - PDF Corporate Design


### PDF Export
- Browserdruck entfernt und durch native PDF-Erzeugung ersetzt.
- Keine Browser-URL, kein Browser-Datum und keine Browser-Uhrzeit mehr im PDF-Footer.
- Einheitliche A4-Seiten mit zentralem Report-Template.
- Footer reduziert auf dezente Seitenzahl unten rechts.
- Leitungsabschnitte bleiben kompakt und zweispaltig aufgebaut.


- PDF-Leitungsabschnitte als kompakte Detailkarten mit gespeicherten Abschnittsnamen.
- Redundante Bezeichnung-Zeile im Detailblock entfernt.
- Key-Value-Raster nutzt die Seitenbreite effizienter.

- UI-Designentwicklung aus Beta 2-6 nicht uebernommen; Ausgangsbasis ist wieder die stabile 1.3.0-Entwicklungsbasis.
- PDF-Export kompakter aufgebaut: reduzierter Seitenrand, kompakter Header, zweispaltige Abschnittsdarstellung und kleinere Tabellenabstaende.
- Projektbezogene Firmenlogo-Integration fuer den PDF-Header oben rechts ergaenzt.
- Projektdatei speichert das PDF-Firmenlogo optional als Data-URL mit.
- AGB-Seite technisch an bestehende Qualitaets-Gates fuer Kontakt, Gueltigkeitsdatum und Ruecknavigation angeglichen.

# TechCalc Pro 1.3.0 — Netlify Development Package

This package contains the full source tree for continued development and Netlify-based preview/deployment.

## Requirements

- Node.js 22 or newer recommended
- npm

## Install

```bash
npm ci
```

## Local validation

```bash
npm test
npm run test:integration
npm run build
npm run build:minified
```

## Netlify deployment

Netlify uses `netlify.toml`:

```toml
[build]
  command = "npm run build:minified"
  publish = "dist"
```

Netlify must deploy the generated `dist/` directory, not the repository root.

## Package policy

- `dist/` is generated and must not be committed.
- `node_modules/` is generated and must not be committed.
- `.npmrc` points to the public npm registry.
- Service-worker cache metadata is generated from `package.json` and `RELEASE_NOTES.md`.

## Release version

Official release: `1.3.0`