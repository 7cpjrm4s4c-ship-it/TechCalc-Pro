# TechCalc Pro 1.3.0 - Phase 21E

## Rohrdimensionierung Hardening

- Phase `phase-21e-hardening` in `pipe-sizing/config.js` ergänzt.
- Regression `pipe-sizing-phase21e-hardening.test.mjs` ergänzt.
- Quality Gate um 21E-Regression erweitert.
- Plattformvertrag Rohrdimensionierung verifiziert:
  - `createPlatformModule`
  - `createPipeSizingDynamicRenderer`
  - `createLineSectionController`
  - `renderResultModel`
  - `controller.js` / `viewModel.js` / `view.js`
- Legacy-Pfade geprüft:
  - kein `mountModule`
  - kein `bindSavedRecordWorkflow`
  - kein `createSavedRecordActions`
  - keine `data-pipe-save/load/delete` Altpfade
  - keine modulinterne DOM-Patchlogik außerhalb `platform/dynamicRenderer`

## Tests

- `npm test` vollständig bestanden.
- Import-/Syntaxprüfung bestanden.

## Phase 22B.3 – Unit Converter Result Renderer
- Einheitenergebnis auf renderResultModel() umgestellt.
- Neues js/modules/unit-converter/results.js ergaenzt.
- Legacy resultRows-Nutzung aus unit-converter/index.js entfernt.
- Regression unit-converter-phase22b3-result-renderer.test.mjs ins Quality Gate aufgenommen.
