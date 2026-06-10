import { field, selectField, stack } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { unitCategories } from '../../utils/units.js';
import { fmt } from '../../utils/calculations.js';
import { calculate } from './logic.js';
import { buildUnitConverterResultModel, normalizeUnitSelection } from './results.js';

export function conversionContent(s = {}) {
  const { units, from, to } = normalizeUnitSelection(s);
  const result = calculate({ ...s, from, to });
  return stack([
    selectField({ id: 'category', label: 'Kategorie', value: s.category, options: Object.entries(unitCategories).map(([value, c]) => ({ value, label: c.label })) }),
    field({
      id: 'value',
      label: 'Wert eintragen',
      unit: from,
      unitField: 'from',
      unitOptions: units.map(u => ({ value: u, label: u })),
      value: s.value
    }),
    field({
      id: 'convertedValue',
      label: 'Ausgabe',
      unit: to,
      unitField: 'to',
      unitOptions: units.map(u => ({ value: u, label: u })),
      value: fmt(result, 2),
      disabled: true,
      placeholder: '—'
    })
  ].join(''));
}

export function resultContent(s = {}, accent = 'green') {
  const { from, to } = normalizeUnitSelection(s);
  return renderResultModel(buildUnitConverterResultModel({ ...s, from, to }, accent), accent);
}

export function createUnitConverterViewModel(s = {}) {
  const normalized = normalizeUnitSelection(s);
  const normalizedState = { ...s, from: normalized.from, to: normalized.to };
  return {
    ...normalized,
    conversionHtml: conversionContent(normalizedState),
    resultHtml: resultContent(normalizedState, 'green')
  };
}
