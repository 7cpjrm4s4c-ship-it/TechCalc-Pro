import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { buildUnitConverterResultModel, normalizeUnitSelection } from './results.js';
import { card, field, selectField, renderModuleShell, stack } from '../../core/renderer.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createUnitConverterDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { unitCategories } from '../../utils/units.js';
import { fmt } from '../../utils/calculations.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';

function renderConversionCardBody(s, units, from, to) {
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

function renderConversion(s, units, from, to) {
  return renderConversionCardBody(s, units, from, to);
}

function renderResult(s, accent = 'green') {
  const { from, to } = normalizeUnitSelection(s);
  return renderResultModel(buildUnitConverterResultModel({ ...s, from, to }, accent), accent);
}

const unitConverterDynamicRenderer = createUnitConverterDynamicRenderer({
  calculate,
  fmt,
  normalizeUnitSelection,
  renderConversion,
  renderResult
});

function view(s) {
  const { units, from, to } = normalizeUnitSelection(s);
  const conversionCard = card('Kategorie wählen', `<div data-unit-dynamic="conversion">${renderConversionCardBody({ ...s, from, to }, units, from, to)}</div>`, 'green');

  return renderModuleShell(config, `
    <div class="span-6">${conversionCard}</div>
    <div class="span-6"><div data-unit-dynamic="result">${renderResult({ ...s, from, to }, 'green')}</div></div>
  `);
}

function updateUnitConverterDynamic(root, s, meta = {}) {
  unitConverterDynamicRenderer.update(root, s, meta);
}

function isDynamicUnitConverterAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  dynamicUpdate: updateUnitConverterDynamic,
  isDynamicAction: isDynamicUnitConverterAction
});
