import { fmt } from '../../utils/calculations.js';
import { unitCategories } from '../../utils/units.js';
import { calculate, unitsFor } from './logic.js';

export function normalizeUnitSelection(s = {}) {
  const units = unitsFor(s.category);
  const from = units.includes(s.from) ? s.from : units[0];
  const to = units.includes(s.to) ? s.to : units[1] || units[0];
  return { units, from, to };
}

export function unitCategoryLabel(category) {
  return unitCategories[category]?.label || category || '—';
}

export function unitConverterPrimary(s = {}) {
  const { from, to } = normalizeUnitSelection(s);
  const result = calculate({ ...s, from, to });
  return {
    label: `${s.value || '—'} ${from} → ${to}`,
    value: s.value ? fmt(result, 2) : '—',
    unit: s.value ? to : ''
  };
}

export function unitConverterAllValueRows(s = {}) {
  const { units, from } = normalizeUnitSelection(s);
  if (!s.value) return [{ label: 'Status', value: 'Wert eingeben →' }];
  return units.map(unit => ({
    label: unit,
    value: fmt(calculate({ ...s, from, to: unit }), 2),
    unit
  }));
}

export function buildUnitConverterResultModel(s = {}, accent = 'green') {
  const { from, to } = normalizeUnitSelection(s);
  return {
    primary: {
      title: 'Umrechnung',
      primary: unitConverterPrimary(s),
      rows: [
        { label: 'Kategorie', value: unitCategoryLabel(s.category) },
        { label: 'Von', value: from },
        { label: 'Nach', value: to }
      ],
      accent
    },
    groups: [
      {
        title: 'Alle Werte',
        rows: unitConverterAllValueRows({ ...s, from, to }),
        accent: 'blue'
      }
    ]
  };
}

export default {
  normalizeUnitSelection,
  unitCategoryLabel,
  unitConverterPrimary,
  unitConverterAllValueRows,
  buildUnitConverterResultModel
};
