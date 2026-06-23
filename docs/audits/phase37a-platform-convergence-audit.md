# Phase 37A – Platform Convergence Audit

Ziel: alle Module gegen die Referenzarchitektur Heizung, Lüftung, Druckhaltung und Pufferspeicher prüfen. Der Audit verändert keine Runtime-Logik; er erzeugt eine belastbare Cleanup-Backlog-Basis für Phase 37B/37C.

## Executive Summary

- Geprüfte Module: 12
- P1-Findings: 4
- P2-Findings: 7
- Unbenutzte Utility-Export-Kandidaten: 2

## Modul-Scorecard

| Modul | Score | Status | P1 | P2 |
|---|---:|---|---:|---:|
| buffer-storage * | 93 | reference-aligned | 0 | 1 |
| dashboard | 48 | priority-cleanup-required | 3 | 1 |
| drinking-water | 71 | cleanup-required | 1 | 2 |
| heat-recovery | 100 | reference-aligned | 0 | 0 |
| heating-cooling * | 100 | reference-aligned | 0 | 0 |
| hx-diagram | 100 | reference-aligned | 0 | 0 |
| pipe-sizing | 100 | reference-aligned | 0 | 0 |
| pressure-holding * | 93 | reference-aligned | 0 | 1 |
| rainwater | 100 | reference-aligned | 0 | 0 |
| unit-converter | 93 | reference-aligned | 0 | 1 |
| ventilation * | 100 | reference-aligned | 0 | 0 |
| wastewater | 93 | reference-aligned | 0 | 1 |

\* Referenzmodul.

## Wichtigste Cleanup-Felder

1. **P1 · dashboard · module-contract** — Pflichtdateien fehlen: controller.js, viewModel.js, view.js
2. **P1 · dashboard · event-boundary** — Event-Listener außerhalb controller.js gefunden.
3. **P1 · dashboard · render-boundary** — Direkte DOM-HTML-Mutationen außerhalb erlaubter Renderer-Boundaries gefunden.
4. **P1 · drinking-water · event-boundary** — Event-Listener außerhalb controller.js gefunden.
5. **P2 · buffer-storage · css-specialization** — Modulspezifische CSS-Selektoren gefunden; gegen globale Tokens/Komponenten prüfen.
6. **P2 · dashboard · runtime-metadata** — migrationStatus-Breadcrumbs sind noch im Runtime-Config-Objekt.
7. **P2 · drinking-water · event-density** — Controller enthält hohe lokale Listener-Dichte; Delegation gegen EventPipeline prüfen.
8. **P2 · drinking-water · css-specialization** — Modulspezifische CSS-Selektoren gefunden; gegen globale Tokens/Komponenten prüfen.
9. **P2 · pressure-holding · css-specialization** — Modulspezifische CSS-Selektoren gefunden; gegen globale Tokens/Komponenten prüfen.
10. **P2 · unit-converter · css-specialization** — Modulspezifische CSS-Selektoren gefunden; gegen globale Tokens/Komponenten prüfen.
11. **P2 · wastewater · css-specialization** — Modulspezifische CSS-Selektoren gefunden; gegen globale Tokens/Komponenten prüfen.

## CSS-Gate

| Datei | !important | Modul-Selektoren |
|---|---:|---:|
| css/components.css | 1 | 0 |
| css/layout.css | 0 | 0 |
| css/modules.css | 0 | 27 |
| css/tokens.css | 1 | 0 |

## Utility-Kandidaten für Phase 37B

- js/utils/calculations.js :: getMedium
- js/utils/pipes.js :: dnTable

## SVP-Bewertung

Phase 37A ist als Plattform-Konvergenzaudit abgeschlossen. Die P1-Findings aus 37A.1 sowie die Runtime-Metadaten-Schuld aus 37A.2 sind geschlossen. Übrig bleiben bewusst akzeptierte P2-Themen: CSS-Spezialisierungen, eine Drinking-Water-Event-Density-Prüfung und zwei Utility-Kandidaten. Empfehlung: diese Restpunkte nicht mehr in 37A, sondern in Phase 37B als kontrollierte Cleanup-Runde ohne Feature-Arbeit behandeln.
