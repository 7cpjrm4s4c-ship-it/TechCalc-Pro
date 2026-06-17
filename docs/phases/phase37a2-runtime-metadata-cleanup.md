# Phase 37A.2 – Runtime Metadata Cleanup

## Ziel

Phase 37A.2 bereinigt die im Platform-Convergence-Audit verbliebenen `runtime-metadata`-Findings. Die historischen `migrationStatus`-Breadcrumbs wurden aus allen Modul-Configs entfernt, damit Produktions-Runtime-Objekte keine Migrationshistorie mehr tragen.

## Änderungen

- `migrationStatus` aus 11 Modul-Configs entfernt:
  - `buffer-storage`
  - `drinking-water`
  - `heat-recovery`
  - `heating-cooling`
  - `hx-diagram`
  - `pipe-sizing`
  - `pressure-holding`
  - `rainwater`
  - `unit-converter`
  - `ventilation`
  - `wastewater`
- `test:phase37a2` ergänzt.
- Platform-Convergence-Audit erneut ausgeführt.

## Ergebnis

- P1-Findings: 0
- P2-Findings: 6
- Runtime-Metadata-Findings: 0

## Bewertung

Die Bereinigung ist bewusst risikoarm: keine Fachlogik, keine Renderer, keine Event-Pipeline und keine Persistenzpfade wurden geändert. Die Migrationshistorie bleibt über Dokumentation und Git nachvollziehbar, nicht mehr über Runtime-Config-Payload.
