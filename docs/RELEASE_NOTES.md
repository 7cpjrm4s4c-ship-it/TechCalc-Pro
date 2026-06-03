## Phase 17C.12 - Regenwasser Segment Dynamic Update

- Plattform-Segmente committen konfigurierte Felder jetzt bereits auf pointerdown/touchstart.
- Regenwasser-Switch Dachfläche / Grundstücksfläche aktualisiert schemaabhängige Labels und Felder sofort.
- Keine Regenwasser-DOM-Sonderregel, kein domPatch, kein querySelector-Patch.
- Neue Regression `rainwater-phase17c12-switch`.

## Phase 17C.10 - Referenzmodule SavedRecord-Vertrag bereinigt

- Regenwasser und Schmutzwasser nutzen jetzt fuer Speichern/Aktualisieren den Heizung/Kälte-Vertrag `line:save` / `line:update`.
- konkurrierende `saved:add` / `saved:update` Pfade sowie alte SavedRecord-Bridge-/Context-Aufloesung entfernt.
- Save-/Update-Buttons rendern mit `data-line-save` / `data-line-update`.
- Segment-Switches laufen ohne zusaetzliche konkurrierende Capture-Schicht ueber die zentrale Event-Pipeline.
- `npm test` erfolgreich.


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
