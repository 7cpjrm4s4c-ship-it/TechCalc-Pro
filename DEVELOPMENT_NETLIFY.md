# TechCalc Pro 1.3.1 Beta 5 — Netlify Development Package

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

Beta release: `1.3.1-beta.5`
