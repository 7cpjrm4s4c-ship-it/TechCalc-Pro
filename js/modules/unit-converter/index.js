import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { buildUnitConverterResultModel, normalizeUnitSelection } from './results.js';
import { card, field, selectField, renderModuleShell, stack } from '../../core/renderer.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { unitCategories } from '../../utils/units.js';
import { fmt } from '../../utils/calculations.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';

function view(s) {
  const { units, from, to } = normalizeUnitSelection(s);
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

  const resultCards = renderResultModel(buildUnitConverterResultModel({ ...s, from, to }, 'green'), 'green');

  return renderModuleShell(config, `
    <div class="span-6">${conversionCard}</div>
    <div class="span-6">${resultCards}</div>
  `);
}
export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  // Unit converter fields change the available unit selectors and result list.
  // Without a dedicated dynamic renderer, every state change must use the
  // platform full-render path; otherwise createPlatformModule treats the
  // custom view as dynamic-only and no visible conversion update happens.
  isDynamicAction: () => false
});
