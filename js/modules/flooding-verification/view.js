import { renderModuleShell, stack } from '../../core/renderer.js';
import { renderFormSchema } from '../../core/formSchema.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { floodingSurfaceSchema, floodingCalculationSchema } from './schema.js';

const displayValue = (current, derived, fallback = '') => {
  const currentText = String(current ?? '').trim();
  if (currentText && Number(String(currentText).replace(',', '.')) > 0) return current;
  if (derived != null && derived !== '' && Number.isFinite(Number(derived))) return String(derived).replace('.', ',');
  return currentText || fallback;
};

export function buildCalculationDisplayState(state = {}, result = {}) {
  const retention = result.retention || {};
  const rain = retention.rainByDuration || {};
  return {
    ...state,
    retentionDryWeatherFlowLs: displayValue(state.retentionDryWeatherFlowLs, retention.dryWeatherFlowLs, '0'),
    retentionUpstreamThrottleFlowLs: displayValue(state.retentionUpstreamThrottleFlowLs, retention.upstreamThrottleFlowLs, '0'),
    retentionRainDuration5: displayValue(state.retentionRainDuration5, rain[5]),
    retentionRainDuration10: displayValue(state.retentionRainDuration10, rain[10]),
    retentionRainDuration15: displayValue(state.retentionRainDuration15, rain[15])
  };
}

export function createFloodingVerificationView({ config, calculate, results, lineSectionController } = {}) {
  if (!config || typeof calculate !== 'function' || typeof results !== 'function' || !lineSectionController) {
    throw new Error('createFloodingVerificationView requires config, calculate, results and lineSectionController');
  }

  const renderSurfaceForm = (state, result) => renderFormSchema(floodingSurfaceSchema, state, { title: 'Flächen', accent: 'green', result });
  const renderCalculationForm = (state, result) => renderFormSchema(floodingCalculationSchema, buildCalculationDisplayState(state, result), { title: 'Nachweis', accent: 'green', result });
  const renderResult = (state, result) => renderResultModel(results(state, result), 'green');

  function view(state = {}) {
    const result = calculate(state);
    const inputColumn = stack([
      `<div class="tc-stack" data-flooding-dynamic="surface-form">${renderSurfaceForm(state, result)}</div>`,
      `<div class="tc-stack" data-flooding-dynamic="surface-records">${lineSectionController.renderCard(state)}</div>`,
      `<div class="tc-stack" data-flooding-dynamic="calculation-form">${renderCalculationForm(state, result)}</div>`
    ].join(''));
    const outputColumn = `<div class="tc-stack" data-flooding-dynamic="result">${renderResult(state, result)}</div>`;
    return renderModuleShell(config, `<div class="span-6">${inputColumn}</div><div class="span-6">${outputColumn}</div>`);
  }

  return { view, renderSurfaceForm, renderCalculationForm, renderResult };
}

export default createFloodingVerificationView;
