# TechCalc Pro – Development Netlify

Aktueller Stand: 1.3.3-dev.7 – Phase 45E.2 Documentation Consolidation & Quality Manual.

Entwicklungsstand für Version 1.3.3 – Phase 45E.2.

## Inhalt

- Basis: 1.3.3-dev.2 Phase 45B.
- Implementierung des Modulsplittings WRG/Mischluft.
- Neues Modul `mixed-air` ergänzt.
- Bestehendes Modul `heat-recovery` auf Wärmerückgewinnung reduziert.
- Legacy-Projektmigration für historische Mischluftfelder ergänzt.

## Build

Dieses Development-ZIP ist für Netlify-Hosting und weitere Entwicklung vorgesehen. Es enthält keinen `dist/`-Ordner und kein `node_modules/`.


## 1.3.3-dev.6 – Phase 45C.2

- Legacy-Saved-Records-Migration für WRG/Mischluft ergänzt.
- Mischluft-Records ohne zuverlässiges Mode-Label werden über Mischluft-Felder erkannt.
- WRG-Saved-Records und Mischluft-Saved-Records werden beim Laden alter Projekte getrennt.
- Regressionstest `phase45c2-legacy-saved-records-migration.test.mjs` ergänzt.


## 1.3.3-dev.6 – Phase 45E.1

Documentation Cleanup, Phase-45D-Abschlussdokument und Aktualisierung des Modulvertrags auf Stand 1.3.3. Keine Anwendungscode-Änderungen.

## 1.3.3-dev.7 – Phase 45E.2

Documentation Consolidation & Quality Management Foundation. Introduces `docs/qm/` as the active quality reference and marks `docs/audits/` as historical evidence. No functional application code changes.
