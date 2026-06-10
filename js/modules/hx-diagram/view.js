import config from './config.js';
import { createViewModel } from './viewModel.js';
import { renderResults, renderDiagram, renderSavedProcesses, HX_DYNAMIC } from './renderPipeline.js';
import { renderHxInputCard } from './formRenderer.js';
import { renderModuleShell, stack } from '../../core/renderer.js';

function renderHxLayout(vm) {
  return `<div class="hx-layout">
    <div class="hx-layout__left">${stack([
      renderHxInputCard(vm),
      `<div data-hx-dynamic="${HX_DYNAMIC.results}">${renderResults(vm)}</div>`,
      `<div data-hx-dynamic="${HX_DYNAMIC.savedProcesses}">${renderSavedProcesses(vm)}</div>`
    ].join(''))}</div>
    <div class="hx-layout__right"><div data-hx-dynamic="${HX_DYNAMIC.diagram}">${renderDiagram(vm)}</div></div>
  </div>`;
}

export function renderView(snapshot) {
  const vm = createViewModel(snapshot);
  return renderModuleShell(config, `<div class="span-12">${renderHxLayout(vm)}</div>`);
}
