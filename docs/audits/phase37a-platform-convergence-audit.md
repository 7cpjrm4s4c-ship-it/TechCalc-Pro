# Phase 37A – Platform Convergence Audit

Ziel: alle Module gegen die Referenzarchitektur Heizung, Lüftung, Druckhaltung und Pufferspeicher prüfen. Der Audit verändert keine Runtime-Logik; er erzeugt eine belastbare Cleanup-Backlog-Basis für Phase 37B/37C.

## Executive Summary

- Geprüfte Module: 12
- P1-Findings: 1
- P2-Findings: 2
- Unbenutzte Utility-Export-Kandidaten: 2

## Modul-Scorecard

| Modul | Score | Status | P1 | P2 |
|---|---:|---|---:|---:|
| buffer-storage * | 100 | reference-aligned | 0 | 0 |
| drinking-water | 78 | platform-conformant-with-minor-debt | 1 | 1 |
| heat-recovery | 100 | reference-aligned | 0 | 0 |
| heating-cooling * | 100 | reference-aligned | 0 | 0 |
| hx-diagram | 100 | reference-aligned | 0 | 0 |
| mixed-air | 93 | reference-aligned | 0 | 1 |
| pipe-sizing | 100 | reference-aligned | 0 | 0 |
| pressure-holding * | 100 | reference-aligned | 0 | 0 |
| rainwater | 100 | reference-aligned | 0 | 0 |
| unit-converter | 100 | reference-aligned | 0 | 0 |
| ventilation * | 100 | reference-aligned | 0 | 0 |
| wastewater | 100 | reference-aligned | 0 | 0 |

\* Referenzmodul.

## Wichtigste Cleanup-Felder

1. **P1 · drinking-water · event-boundary** — Event-Listener außerhalb controller.js gefunden.
2. **P2 · drinking-water · event-density** — Controller enthält hohe lokale Listener-Dichte; Delegation gegen EventPipeline prüfen.
3. **P2 · mixed-air · dynamic-renderer** — Lokaler dynamicRenderer.js-Pfad vorhanden; gegen Plattform-Factory prüfen.

## CSS-Gate

| Datei | !important | Modul-Selektoren |
|---|---:|---:|
| css/components.css | 0 | 0 |
| css/layout.css | 13 | 0 |
| css/modules.css | 0 | 0 |
| css/tokens.css | 1 | 0 |

## Utility-Kandidaten für Phase 37B

- js/utils/calculations.js :: getMedium
- js/utils/pipes.js :: dnTable

## SVP-Bewertung

Phase 37A ist als Plattform-Konvergenzaudit abgeschlossen. Die P1-Findings aus 37A.1 sowie die Runtime-Metadaten-Schuld aus 37A.2 sind geschlossen. Übrig bleiben bewusst akzeptierte P2-Themen: CSS-Spezialisierungen, eine Drinking-Water-Event-Density-Prüfung und zwei Utility-Kandidaten. Empfehlung: diese Restpunkte nicht mehr in 37A, sondern in Phase 37B als kontrollierte Cleanup-Runde ohne Feature-Arbeit behandeln.
