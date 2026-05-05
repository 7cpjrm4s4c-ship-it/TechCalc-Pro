import config from './config.js';
import { state } from './state.js';
import { calculate, unitsFor } from './logic.js';
import { card, field, selectField, resultRows, renderModuleShell, bindCommonInputs, stack, grid } from '../../core/renderer.js';
import { unitCategories } from '../../utils/units.js';
import { fmt } from '../../utils/calculations.js';

function view(s) {
  const units = unitsFor(s.category);
  const from = units.includes(s.from) ? s.from : units[0];
  const to = units.includes(s.to) ? s.to : units[1] || units[0];
  const result = calculate({ ...s, from, to });

  const inputs = card('Kategorie wählen', stack([
    selectField({ id: 'category', label: 'Kategorie', value: s.category, options: Object.entries(unitCategories).map(([value, c]) => ({ value, label: c.label })) }),
    grid([
      field({ id: 'value', label: 'Wert', unit: from, value: s.value }),
      selectField({ id: 'from', label: 'Von', value: from, options: units.map(u => ({ value: u, label: u })) }),
      selectField({ id: 'to', label: 'Nach', value: to, options: units.map(u => ({ value: u, label: u })) })
    ].join(''), 2)
  ].join('')), 'green');

  const outputs = stack([
    card('Ergebnis', resultRows([{ label: 'Konvertierter Wert', value: fmt(result, 4), unit: to }]), 'green'),
    card('Alle Werte', s.value ? resultRows(units.map(u => ({ label: u, value: fmt(calculate({ ...s, from, to: u }), 4), unit: u }))) : '<div class="empty-state">Wert eingeben →</div>', 'blue')
  ].join(''));

  return renderModuleShell(config, `
    <div class="span-6">${inputs}</div>
    <div class="span-6">${outputs}</div>
  `);
}

export default {
  config,
  state,
  mount(root) {
    const render = () => {
      root.innerHTML = view(state.get());
      bindCommonInputs(root, state, render);
    };
    render();
  }
};
