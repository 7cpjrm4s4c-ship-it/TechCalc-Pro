import config from './config.js';
import { createViewModel } from './viewModel.js';
import { renderResults, renderDiagram, renderSavedProcesses, renderProcessSelection, HX_DYNAMIC } from './renderPipeline.js';
import { card, field, renderModuleShell, stack, grid, signedTempField } from '../../core/renderer.js';
import { fmtInput } from '../../utils/calculations.js';
// Phase 26C.2: chartCard from './diagramRenderer.js' is reached only through renderDiagram(vm.activePath, vm.targetReached) in the central render pipeline; renderHxResultModel is called by renderResults().

function inputCard(s) {
  return card('Luftzustand erfassen', stack([    card('Ausgangszustand', grid([
      signedTempField('tempC', 'Trockenkugeltemperatur θt', fmtInput(s.tempC, 2), 'data-hx-sign'),
      field({ id: 'rhPercent', label: 'Relative Feuchte φ', unit: '%', value: fmtInput(s.rhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    card('Zielzustand', grid([
      signedTempField('targetTempC', 'Zieltemperatur θt', fmtInput(s.targetTempC, 2), 'data-hx-sign'),
      field({ id: 'targetRhPercent', label: 'Relative Zielfeuchte φ', unit: '%', value: fmtInput(s.targetRhPercent, 2) })
    ].join(''), 2), 'cyan', { compact: true }),
    `<div data-hx-dynamic="${HX_DYNAMIC.process}">${renderProcessSelection(s)}</div>`,
    `<div class="tc-actions"><button type="button" class="tc-action tc-action--ghost" data-hx-clear>Diagramm leeren</button></div>`
  ].join('')), 'cyan');
}

export function renderView(s) {
  const vm = createViewModel(s);
  const body = `<div class="hx-layout">
    <div class="hx-layout__left">${stack([
      inputCard(s),
      `<div data-hx-dynamic="${HX_DYNAMIC.results}">${renderResults(vm)}</div>`,
      `<div data-hx-dynamic="${HX_DYNAMIC.savedProcesses}">${renderSavedProcesses(vm)}</div>`
    ].join(''))}</div>
    <div class="hx-layout__right"><div data-hx-dynamic="${HX_DYNAMIC.diagram}">${renderDiagram(vm)}</div></div>
  </div>`;
  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}
