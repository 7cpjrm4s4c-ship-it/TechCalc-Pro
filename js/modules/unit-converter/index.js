import config from './config.js';
import { state } from './state.js';
import { calculate, unitsFor } from './logic.js';
import { card, field, selectField, resultRows, renderModuleShell, stack, grid } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { unitCategories } from '../../utils/units.js';
import { fmt } from '../../utils/calculations.js';

function view(s) {
  const units = unitsFor(s.category);
  const from = units.includes(s.from) ? s.from : units[0];
  const to = units.includes(s.to) ? s.to : units[1] || units[0];
  const result = calculate({ ...s, from, to });

  const conversionCard = card('Kategorie wählen', stack([
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
  ].join('')), 'green');

  const allValuesCard = card('Alle Werte', s.value ? resultRows(units.map(u => ({
    label: u,
    value: fmt(calculate({ ...s, from, to: u }), 2),
    unit: u
  }))) : '<div class="empty-state">Wert eingeben →</div>', 'blue');

  return renderModuleShell(config, `
    <div class="span-6">${conversionCard}</div>
    <div class="span-6">${allValuesCard}</div>
  `);
}
export default {
  config,
  state,
  mount(root) {
    mountModule(root, state, view);
  }
};