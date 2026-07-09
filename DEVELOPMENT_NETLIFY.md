# TechCalc Pro – Development / Release Candidate

Aktueller Stand: 1.3.4-dev.2 – Phase 46B Security Hardening.

## Inhalt

- Basis: 1.3.3-dev.10 / Phase 45E.5 Architecture Review.
- Phase 45E.6 Release Preparation nachgezogen.
- WRG/Mischluft-Modulsplitting vollständig enthalten.
- Legacy-Projektmigration für historische WRG-/Mischluft-Daten und Saved Records enthalten.
- Dokumentation konsolidiert: QM, Modulvertrag, Architecture Baseline, Changelog, Migration Guide und RC-Checkliste.

## Build

Dieses ZIP ist für Netlify-Hosting und weitere RC-Prüfung vorgesehen. Es enthält keinen `dist/`-Ordner und kein `node_modules/`.


## 1.3.4-dev.2 – Phase 46B Security Hardening

- Toolchain auf aktive Pipeline-Skripte reduziert.
- Nicht verdrahtete historische Audit-Skripte entfernt.
- Neues Toolchain-Hygiene-Audit ergänzt und in `lint` eingebunden.
- Keine fachlichen Anwendungscode-Änderungen.

## 1.3.4-dev.2 – Phase 46B Security Hardening

- DOM-Sink-Audit für `innerHTML` und verbotene HTML-/Code-Sinks ergänzt.
- Release-Notes-Renderer gehärtet: Browserpfad rendert über DOM-Knoten und `textContent`.
- `scripts/audit-dom-sinks-phase46b.mjs` in `npm run lint` eingebunden.
- Security-Hardening-Dokumentation ergänzt.
