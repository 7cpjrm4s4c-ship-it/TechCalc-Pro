# Phase 36T.2 – Rainwater Platform Primitives

## Ziel
Regenwasser soll keine modul-spezifischen Layout-Ausnahmen mehr benötigen und sich wie die Referenzmodule auf globale Plattform-Primitive stützen.

## Entfernt aus `css/modules.css`
- `.rainwater-result-list`
- `.rainwater-kostra-link`
- `.rainwater-result-group`
- `.rainwater-result-group + .rainwater-result-group`
- `.rainwater-result-group h4`
- `.rainwater-surface-row`
- `.rainwater-surface-row.is-active`
- `.rainwater-result-list .line-section-card.is-active`
- `.module-view[data-module='rainwater'] .card`
- `.module-view[data-module='rainwater'] .result-card`
- `.module-view[data-module='rainwater'] .card__body`

## Entfernt aus `css/components.css`
- `[data-rw-dynamic]` aus generischen Layout-Ausnahmeblöcken
- `[data-rw-dynamic="form"]`
- `[data-rw-dynamic="result"]`

## Begründung
Die Regenwasser-View nutzt bereits:
- `renderModuleShell`
- `span-6`
- `stack()`
- `renderFormSchema`
- `renderResultModel`
- `lineSectionController.renderCard`

Damit reichen globale Card-, Stack-, Result- und Saved-Record-Regeln aus.

## Nicht geändert
- keine JavaScript-Logik
- keine Berechnungslogik
- keine Saved-Record-Pfade
- keine View-Struktur
