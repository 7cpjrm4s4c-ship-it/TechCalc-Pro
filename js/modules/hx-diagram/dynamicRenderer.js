import { renderDynamicSections } from './renderPipeline.js';

export function isDynamicHxDiagramAction(meta = {}) {
  const action = typeof meta === 'string' ? meta : String(meta?.action || '');
  if (action === 'initial') return false;
  return action.startsWith('platform:field:')
    || action.startsWith('hx:')
    || action.startsWith('line:')
    || action.startsWith('saved:');
}

export function updateHxDiagramDynamic(root, snapshot = {}, meta = {}) {
  return renderDynamicSections(root, snapshot, meta);
}

export default updateHxDiagramDynamic;
