
## Phase 17C.8
- SavedRecord-Vertrag von Heizung/Kälte auf Regenwasser und Schmutzwasser übertragen.
- SavedRecord-Bridge aus aktivem Pfad entfernt; direkte zentrale Actions.
- Regenwasser-Segmentwechsel mit zusätzlichem settled Re-Render.

## Phase 17C.9 - SavedRecord-Vertrag Heizung/Kälte

- Regenwasser und Schmutzwasser verwenden fuer gespeicherte Eintraege jetzt den Heizung/Kälte-kompatiblen `data-line-*` Root-Capture-Vertrag.
- Alte SavedRecord-Bridge aus `platform/moduleRuntime` entfernt.
- Markieren, Bearbeiten, Accordion und Loeschen laufen wieder ueber einen eindeutigen Store-Pfad.
- Regenwasser-Segmentwechsel erzwingt weiterhin sofortigen Schema-Rebuild fuer `r(5,5)` / `r(5,2)`.
- Regression `reference-modules-phase17c9-heating-saved-contract` ergaenzt.
