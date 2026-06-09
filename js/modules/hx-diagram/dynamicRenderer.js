export function isDynamicHxDiagramAction(action = '') {
  return String(action || '').startsWith('platform:field:')
    || String(action || '').startsWith('platform:segment:')
    || String(action || '').startsWith('hx:');
}

export function updateHxDiagramDynamic() {
  return false;
}
