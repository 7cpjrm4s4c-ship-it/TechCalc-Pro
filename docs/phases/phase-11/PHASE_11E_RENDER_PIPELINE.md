# Phase 11E — Render Pipeline Finalisierung

Phase 11E schliesst den Plattformumbau zwischen Store/Event-Pipeline und DOM-Render ab.

## Ziel

Die App darf Modulansichten nicht mehr ueber verstreute Full-Render-Logik aktualisieren. Der Renderpfad ist jetzt zentral:

1. `centralStore` empfaengt State-Updates.
2. `eventPipeline` schreibt Eingaben, Selects und Switches in den Store.
3. `mountModule` delegiert Rendering an `renderCoordinator`.
4. `renderCoordinator` entscheidet zentral ueber DOM-Ersatz, Fokus- und Scroll-Erhaltung.
5. `afterRender` bindet nur noch notwendige Lifecycle-Hooks.

## Neue zentrale Komponente

- `js/core/renderCoordinator.js`

Verantwortlichkeiten:

- ein Renderpfad pro Modulmount
- DOM-Ersatz nur bei veraenderter View
- zentrale Post-Render-Lifecycle-Ausfuehrung
- getrennte Behandlung von Feldaktionen und strukturellen Aktionen
- reduzierte mobile Scroll-Restaurierung bei normalen Eingaben
- gezielte Scroll-Erhaltung nur bei strukturellen Aenderungen wie Saved Records, Reset, Delete oder Modulwechsel

## Warum das wichtig ist

Bisher haben Module, Mounting, Scroll-Fixes und Event-Pipeline teilweise konkurrierend gerendert. Das fuehrte zu:

- mobilen Scroll-Spruengen
- verlorenen Select-/Switch-Updates
- Eingaben, die erst nach Screen-Klick berechnet wurden
- Saved Records, die optisch vorhanden waren, aber nicht stabil selektierbar waren

Phase 11E reduziert diesen Hybrid-Zustand. Fachliche Modulfixes sollen ab jetzt auf einem stabileren Plattformpfad erfolgen.

## Qualitaetssicherung

Neu:

- `tests/render-coordinator.test.mjs`
- `test:render-coordinator`
- Quality Gate erweitert
- Mobile-Scroll-Audit auf `renderCoordinator` angepasst

## Noch offen

Phase 11E finalisiert den zentralen Renderpfad, migriert aber noch nicht jedes Modul vollstaendig auf reine Schema-Views. Die naechsten Schritte sind:

1. Heizung/Kälte erneut gegen den finalen Renderpfad testen und bereinigen.
2. Modulweise Legacy-Adapter entfernen.
3. Saved-Record-Aktionen in allen Modulen auf zentrale Actions konsolidieren.
4. CSS-Schulden weiter abbauen.
