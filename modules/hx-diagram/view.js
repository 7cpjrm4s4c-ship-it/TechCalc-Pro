import config from './config.js';
import { createViewModel } from './viewModel.js';
import { renderResults, renderDiagram, renderSavedProcesses, HX_DYNAMIC } from './renderPipeline.js';
import { renderHxInputCard } from './formRenderer.js';
import { renderModuleShell } from '../../core/renderer.js';

function renderHxLayout(vm) {
  return `<div class="tc-module-layout tc-module-layout--2 hx-layout">
    <div class="tc-module-column hx-layout__left">
      ${renderHxInputCard(vm)}
      <div class="tc-module-section" data-hx-dynamic="${HX_DYNAMIC.results}">${renderResults(vm)}</div>
      <div class="tc-module-section" data-hx-dynamic="${HX_DYNAMIC.savedProcesses}">${renderSavedProcesses(vm)}</div>
    </div>
    <div class="tc-module-column hx-layout__right"><div class="tc-module-section" data-hx-dynamic="${HX_DYNAMIC.diagram}">${renderDiagram(vm)}</div></div>
  </div>`;
}

export function renderView(snapshot) {
  const vm = createViewModel(snapshot);
  return renderModuleShell(config, renderHxLayout(vm));
}