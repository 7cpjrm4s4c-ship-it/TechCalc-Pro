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


# Phase 39C — Dashboard / TSS Icons / UI Controls

- Dashboard-Startseite unter Version 1.3.1 Beta 6 ergänzt.
- Systemicons und UI Controls als eigene SVG/CSS-Schicht umgesetzt.
- Bestehendes Logo und Header-Branding unverändert belassen.
