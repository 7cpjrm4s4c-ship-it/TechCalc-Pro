export function isDynamicHxDiagramAction(meta = '') {
  const action = typeof meta === 'string' ? meta : String(meta?.action || '');

  // Field typing must not rebuild the h,x diagram on every keystroke.
  // All semantic actions such as process selection, sign toggle, save/update/delete
  // and clear intentionally fall through to the platform full-render path so the
  // result model and SVG diagram are rebuilt immediately.
  return action.startsWith('platform:field:');
}

export function updateHxDiagramDynamic() {
  return true;
}
