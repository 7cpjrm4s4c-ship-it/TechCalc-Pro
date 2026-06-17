# Phase 37A – Platform Convergence Audit

Ziel: alle Module gegen die Referenzarchitektur Heizung, Lüftung, Druckhaltung und Pufferspeicher prüfen. Der Audit verändert keine Runtime-Logik; er erzeugt eine belastbare Cleanup-Backlog-Basis für Phase 37B/37C.

## Executive Summary

- Geprüfte Module: 11
- P1-Findings: 2
- P2-Findings: 17
- Unbenutzte Utility-Export-Kandidaten: 2

## Modul-Scorecard

| Modul | Score | Status | P1 | P2 |
|---|---:|---|---:|---:|
| buffer-storage * | 86 | platform-conformant-with-minor-debt | 0 | 2 |
| drinking-water | 79 | platform-conformant-with-minor-debt | 0 | 3 |
| heat-recovery | 93 | reference-aligned | 0 | 1 |
| heating-cooling * | 93 | reference-aligned | 0 | 1 |
| hx-diagram | 93 | reference-aligned | 0 | 1 |
| pipe-sizing | 93 | reference-aligned | 0 | 1 |
| pressure-holding * | 86 | platform-conformant-with-minor-debt | 0 | 2 |
| rainwater | 78 | platform-conformant-with-minor-debt | 1 | 1 |
| unit-converter | 71 | cleanup-required | 1 | 2 |
| ventilation * | 93 | reference-aligned | 0 | 1 |
| wastewater | 86 | platform-conformant-with-minor-debt | 0 | 2 |

\* Referenzmodul.

## Wichtigste Cleanup-Felder

1. **P1 · rainwater · event-boundary** — Event-Listener außerhalb controller.js gefunden.
2. **P1 · unit-converter · module-contract** — Pflichtdateien fehlen: controller.js
3. **P2 · buffer-storage · runtime-metadata** — migrationStatus-Breadcrumbs sind noch im Runtime-Config-Objekt.
4. **P2 · buffer-storage · css-specialization** — Modulspezifische CSS-Selektoren gefunden; gegen globale Tokens/Komponenten prüfen.
5. **P2 · drinking-water · event-density** — Controller enthält hohe lokale Listener-Dichte; Delegation gegen EventPipeline prüfen.
6. **P2 · drinking-water · runtime-metadata** — migrationStatus-Breadcrumbs sind noch im Runtime-Config-Objekt.
7. **P2 · drinking-water · css-specialization** — Modulspezifische CSS-Selektoren gefunden; gegen globale Tokens/Komponenten prüfen.
8. **P2 · heat-recovery · runtime-metadata** — migrationStatus-Breadcrumbs sind noch im Runtime-Config-Objekt.
9. **P2 · heating-cooling · runtime-metadata** — migrationStatus-Breadcrumbs sind noch im Runtime-Config-Objekt.
10. **P2 · hx-diagram · runtime-metadata** — migrationStatus-Breadcrumbs sind noch im Runtime-Config-Objekt.
11. **P2 · pipe-sizing · runtime-metadata** — migrationStatus-Breadcrumbs sind noch im Runtime-Config-Objekt.
12. **P2 · pressure-holding · runtime-metadata** — migrationStatus-Breadcrumbs sind noch im Runtime-Config-Objekt.

## CSS-Gate

| Datei | !important | Modul-Selektoren |
|---|---:|---:|
| css/components.css | 0 | 0 |
| css/layout.css | 0 | 0 |
| css/modules.css | 0 | 27 |
| css/tokens.css | 1 | 0 |

## Utility-Kandidaten für Phase 37B

- js/utils/calculations.js :: getMedium
- js/utils/pipes.js :: dnTable

## SVP-Bewertung

Phase 37A bestätigt: Die Plattform ist stabil, aber noch nicht vollständig konvergiert. Die größten Restschulden liegen nicht in Fachlogik, sondern in Runtime-Metadaten, lokalen Event-Boundaries und wenigen modulspezifischen Renderer-/CSS-Sonderpfaden. Empfehlung: vor Feature-Arbeit Phase 37B als kontrollierte Bereinigung der P1/P2-Findings durchführen.
