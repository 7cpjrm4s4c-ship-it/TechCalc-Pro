# Phase 43B – Repository Cleanup

Basis: `1.3.2-dev.36-phase43a`

## Ziel

Phase 43B bereinigt die Dokumentations- und Repository-Struktur ohne Runtime-, CSS- oder Moduländerungen. Die Root-Ebene und die aktive `docs/`-Struktur sollen nur noch produktions- und entwicklungsrelevante Dateien enthalten.

## Änderungen

- Detaillierte Phase-36- und Phase-38-Artefakte nach `docs/archive/legacy-phase-docs/` verschoben.
- Einzelne Phase-40/41-Dokumente aus der Top-Level-`docs/`-Ebene nach `docs/phases/` verschoben.
- Historische `docs/phase-notes/` nach `docs/archive/legacy-phase-docs/phase-notes/` verschoben.
- `docs/archive/README.md` ergänzt.
- `docs/archive/legacy-phase-docs/README.md` ergänzt.
- `docs/README.md`, `docs/phases/README.md` und `docs/phases/phase-43.md` aktualisiert.

## Keine Änderungen

- Keine Runtime-Änderungen.
- Keine CSS-Änderungen.
- Keine Modul- oder Controller-Änderungen.
- Keine neuen Architekturverträge.

## Repository-Regel

Ab Phase 43B gilt:

1. Neue aktive Phasendokumente werden unter `docs/phases/` abgelegt.
2. Dauerhafte Engineering-Regeln werden unter `docs/engineering/` abgelegt.
3. Dauerhafte Architekturverträge werden unter `docs/contracts/` abgelegt.
4. Architekturentscheidungen werden unter `docs/adr/` abgelegt.
5. Historische Detailnotizen und Zwischenartefakte werden unter `docs/archive/` abgelegt.
6. Root-Dateien werden nur für Runtime, Build, Deployment und aktuelle Release-Kommunikation verwendet.

## Validierung

- `npm test`
- `npm run test:integration`
- `npm run build`
