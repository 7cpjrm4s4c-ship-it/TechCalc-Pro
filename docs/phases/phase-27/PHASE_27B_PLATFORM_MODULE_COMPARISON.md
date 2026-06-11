# Phase 27B - Platform Module Comparison

## Ziel

Phase 27B ueberfuehrt das in 27A definierte Audit-Framework in einen objektiven Modulvergleich. Alle elf Fachmodule werden gegen dieselben Architektur-Dimensionen bewertet.

## Referenzcluster

Als Referenzcluster gelten:

- `heat-recovery` fuer Fachmodule mit Saved Records und Dynamic Renderer
- `buffer-storage` fuer Saved-Record-Fachmodule mit klarer Plattformtrennung
- `hx-diagram` fuer Fachmodule mit Saved Records, Dynamic Renderer und Diagram Renderer

## Ergebnisartefakte

- `scripts/audit-platform-module-comparison-phase27b.mjs`
- `platform-module-comparison-phase27b.json`
- `tests/platform-module-comparison-phase27b.test.mjs`

## Bewertete Dimensionen

Die Matrix bewertet:

- Platform Mount
- State Contract
- Controller Separation
- ViewModel Separation
- View Purity
- Result Renderer
- Dynamic Renderer
- Diagram Renderer
- Saved Records
- Render Pipeline
- Numeric Locale Handling
- UX Stability
- Test Coverage

## Engineering-Entscheidung

27B fuehrt noch keine funktionalen Umbauten aus. Die Phase erzeugt eine belastbare Audit-Baseline fuer 27C, 27D und 27E.

Der Report enthaelt:

- Score-Matrix je Modul
- Durchschnittswerte je Modul
- Schwachstellen je Dimension
- P1/P2/P3/P4-Risiken
- priorisierten Remediation Backlog

## Akzeptanzkriterien

- Alle elf Module werden auditiert.
- Die drei Referenzmodule sind explizit markiert.
- h,x weist weiterhin eine eigene `diagramRenderer.js`-Boundary nach.
- Der Report ist deterministisch generierbar.
