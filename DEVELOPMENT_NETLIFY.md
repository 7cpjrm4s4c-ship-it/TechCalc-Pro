# TechCalc Pro – Development / Release Candidate

Aktueller Stand: 1.3.4-dev.1 – Phase 46A Toolchain Cleanup.

## Inhalt

- Basis: 1.3.3-dev.10 / Phase 45E.5 Architecture Review.
- Phase 45E.6 Release Preparation nachgezogen.
- WRG/Mischluft-Modulsplitting vollständig enthalten.
- Legacy-Projektmigration für historische WRG-/Mischluft-Daten und Saved Records enthalten.
- Dokumentation konsolidiert: QM, Modulvertrag, Architecture Baseline, Changelog, Migration Guide und RC-Checkliste.

## Build

Dieses ZIP ist für Netlify-Hosting und weitere RC-Prüfung vorgesehen. Es enthält keinen `dist/`-Ordner und kein `node_modules/`.


## 1.3.4-dev.1 – Phase 46A Toolchain Cleanup

- Toolchain auf aktive Pipeline-Skripte reduziert.
- Nicht verdrahtete historische Audit-Skripte entfernt.
- Neues Toolchain-Hygiene-Audit ergänzt und in `lint` eingebunden.
- Keine fachlichen Anwendungscode-Änderungen.
