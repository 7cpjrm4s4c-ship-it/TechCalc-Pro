import { renderDynamicSections } from './renderPipeline.js';

export function isDynamicHxDiagramAction(meta = {}) {
  const action = typeof meta === 'string' ? meta : String(meta?.action || '');
  if (action === 'initial') return false;

  // Phase 36V.1:
  // The central event pipeline emits generic field actions such as:
  // - field:tab:refresh
  // - field:enter:refresh
  // - field:input:select
  // - input:confirm
  //
  // h,x must treat these as dynamic updates. Otherwise moduleRuntime performs a
  // full root render after Tab/Enter, replacing the focused input and breaking
  // keyboard navigation.
  return action.startsWith('platform:field:')
    || action.startsWith('field:')
    || action === 'input:confirm'
    || action.startsWith('hx:')
    || action.startsWith('line:')
    || action.startsWith('saved:');
}

export function updateHxDiagramDynamic(root, snapshot = {}, meta = {}) {
  return renderDynamicSections(root, snapshot, meta);
}

export default updateHxDiagramDynamic;
