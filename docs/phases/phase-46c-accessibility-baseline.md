# Phase 46C – Accessibility Baseline

Version: 1.3.4-dev.3

## Ziel

Phase 46C legt einen verbindlichen Accessibility-Basisstandard für TechCalc Pro fest und ergänzt eine automatisierte statische Prüfung für zentrale UI-Verträge.

## Ausgangslage

Die App enthielt bereits ARIA-Attribute, Tastaturverträge und sichtbare Fokus-/Theme-Regeln. Im QM war jedoch kein konkretes externes Zielniveau benannt. Zudem war Accessibility nicht als eigener Audit in `npm run lint` eingebunden.

## Analyse

Geprüft wurden:

- `index.html` als App-Shell,
- vorhandene ARIA- und Fokusverträge,
- `docs/qm/QM-011-Accessibility.md`,
- bestehende Keyboard-, Theme- und Render-Contracts.

## Design Review

Als Zielniveau wurde **WCAG 2.1 AA** als interner Qualitätsmaßstab festgelegt. Die automatisierte Prüfung bleibt bewusst statisch und ohne neue externe Abhängigkeit, damit sie stabil in der bestehenden Toolchain läuft.

## Implementierung

- `QM-011-Accessibility.md` vollständig aktualisiert.
- `scripts/audit-accessibility-phase46c.mjs` ergänzt.
- Audit in `npm run lint` eingebunden.
- Projektdatei-Input mit zugänglichem Namen ergänzt.
- Version auf `1.3.4-dev.3` gesetzt.

## Regression

Erwartete Gates:

- `npm run lint`
- `npm test`
- `npm run test:integration`
- `npm run build`
- `npm run build:minified`

## Ergebnis

Die Accessibility-Baseline ist dokumentiert und technisch in die Standard-Lint-Pipeline eingebunden. Weitere UI-Erweiterungen müssen sich an WCAG 2.1 AA und den bestehenden Keyboard-/Theme-/Render-Contracts orientieren.

## Risiken

Der statische Audit prüft nur Basisverträge. Screenreader-, Kontrast- und axe-core-Prüfungen bleiben als manuelle bzw. spätere browserbasierte Ergänzung erforderlich.

## Referenzen

- `docs/qm/QM-011-Accessibility.md`
- `docs/contracts/keyboard-contract.md`
- `docs/contracts/theme-contract.md`
- `docs/contracts/render-contract.md`
- `scripts/audit-accessibility-phase46c.mjs`
