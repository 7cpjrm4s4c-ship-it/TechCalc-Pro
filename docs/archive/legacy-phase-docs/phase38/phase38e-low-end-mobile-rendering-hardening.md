# Phase 38E — Low-End Mobile Rendering Hardening

## Ziel

Low-End- und ältere Mobile-Browser sollen ohne teure oder nicht unterstützte Blur-Flächen stabile, lesbare UI-Surfaces rendern.

## Änderungen

- `backdrop-filter` und `-webkit-backdrop-filter` mit aktivem Blur/Saturate liegen nur noch innerhalb von `@supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))`.
- Für `.glass-surface`, `.card`, `.tc-card`, `.app-header`, `body::before` und `.module-nav` wurden opakere Fallback-Hintergründe gesetzt.
- Bestehende Schutzregeln mit `backdrop-filter: none` bleiben außerhalb von `@supports`, weil sie explizit Blur verhindern.
- Neuer Audit: `scripts/audit-low-end-mobile-rendering-phase38e.mjs`.
- Integration-Gate erweitert.

## Validierung

- `npm test`
- `npm run test:integration`
- `npm run build`
