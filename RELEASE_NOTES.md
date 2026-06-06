# TechCalc Pro 1.3.0 – Phase 20B.2

## Druckhaltung – Saved-Record-Controller Migration

- Druckhaltung Saved Records von legacy `bindSavedRecordWorkflow` auf zentrale `createSavedRecordActions` umgestellt.
- Gespeicherte Anlagen nutzen jetzt `renderSavedRecordPanel` und `renderSavedRecordList`.
- Legacy-Selektoren `data-ph-save`, `data-ph-update`, `data-ph-select`, `data-ph-delete` entfernt.
- `activePlantId` und `expandedPlantId` im Modulstate ergänzt.
- `CENTRAL_SAVED_RECORDS` Capability aktiviert.
- Save/Update committen Feldwerte vor Snapshot-Erzeugung zentral über `commitAllFields`.
- Regression ergänzt: `pressure-holding-phase20b2-saved-record-controller.test.mjs`.
- Quality Gate bestanden.
