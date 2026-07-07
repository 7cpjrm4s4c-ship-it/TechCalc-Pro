# Phase 38A — Automated Precache Manifest

## Ziel

Der Service-Worker-Precache wird nicht mehr manuell gepflegt. Alle runtime-relevanten JavaScript- und CSS-Dateien werden vor dem Build automatisch aus der Projektstruktur gelesen und in `service-worker.js` eingetragen.

## Umsetzung

- Neues Script: `scripts/generate-precache-manifest.mjs`
- Automatische Traversierung von:
  - `js/**/*.js`
  - `css/**/*.css`
  - `assets/icons/*`
- Statische Shell-Assets bleiben explizit definiert:
  - `./`
  - `./index.html`
  - `./manifest.json`
  - `./RELEASE_NOTES.md`
- `npm run build` generiert zuerst den Precache und führt danach den Import-/Syntax-Check aus.
- Neuer Guard: `npm run test:phase38a`

## Ergebnis

Phase 38A entfernt die größte manuelle Fehlerquelle im Offline-Pfad. Neue Moduldateien unter `js/` und neue Stylesheets unter `css/` werden künftig automatisch in den Precache aufgenommen.
