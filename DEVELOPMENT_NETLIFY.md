# TechCalc Pro – Development / Netlify

Aktueller Stand: 1.3.4-dev.3 – Phase 46C Accessibility Baseline.

## Inhalt

- Basis: 1.3.4-dev.2 / Phase 46B Security Hardening.
- Release 1.3.3 final enthalten.
- WRG/Mischluft-Modulsplitting vollständig enthalten.
- Legacy-Projektmigration für historische WRG-/Mischluft-Daten und Saved Records enthalten.
- Dokumentation konsolidiert: QM, Modulvertrag, Architecture Baseline, Changelog, Migration Guide und RC-Checkliste.

## Build

Dieses ZIP ist für Netlify-Hosting und weitere Entwicklung vorgesehen. Es enthält keinen `dist/`-Ordner und kein `node_modules/`.

## 1.3.4-dev.1 – Phase 46A Toolchain Cleanup

- Toolchain auf aktive Pipeline-Skripte reduziert.
- Nicht verdrahtete historische Audit-Skripte entfernt.
- Toolchain-Hygiene-Audit ergänzt und in `lint` eingebunden.

## 1.3.4-dev.2 – Phase 46B Security Hardening

- DOM-Sink-Audit für `innerHTML` und verbotene HTML-/Code-Sinks ergänzt.
- Release-Notes-Renderer gehärtet: Browserpfad rendert über DOM-Knoten und `textContent`.
- `scripts/audit-dom-sinks-phase46b.mjs` in `npm run lint` eingebunden.
- Security-Hardening-Dokumentation ergänzt.

## 1.3.4-dev.3 – Phase 46C Accessibility Baseline

- WCAG 2.1 AA als internes Accessibility-Zielniveau im QM festgelegt.
- Statischer Accessibility-Audit ergänzt und in `npm run lint` eingebunden.
- Zugänglicher Name für den Projektdatei-Input ergänzt.
- Phase-46C-Dokumentation ergänzt.
