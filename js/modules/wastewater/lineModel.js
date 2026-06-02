export function lineFamilyValue(lineType) {
  if (String(lineType).startsWith('single-')) return 'single';
  if (String(lineType).startsWith('branch-')) return 'branch';
  if (lineType === 'ground-full' || lineType === 'ventilation') return 'ground-outside';
  return lineType || 'single-unvented';
}

export function lineVentilationValue(lineType) {
  return String(lineType).endsWith('-vented') && !String(lineType).endsWith('unvented') ? 'vented' : 'unvented';
}

export function resolveLineType(family, ventilation, previous = 'single-unvented') {
  if (family === 'single') return ventilation === 'vented' ? 'single-vented' : 'single-unvented';
  if (family === 'branch') return ventilation === 'vented' ? 'branch-vented' : 'branch-unvented';
  return family || previous;
}
