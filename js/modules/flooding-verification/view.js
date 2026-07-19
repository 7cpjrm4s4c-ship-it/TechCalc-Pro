import { renderModuleShell } from '../../core/renderer.js';
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
  const effectiveRecurrence = retention.effectiveRecurrenceFrequencyPerYear;
  return {
    ...state,
    retentionRecurrenceFrequencyPerYear: Number.isFinite(Number(effectiveRecurrence))
      ? String(effectiveRecurrence).replace('.', ',')
      : state.retentionRecurrenceFrequencyPerYear,
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
    return renderModuleShell(config, `<div class="tc-module-layout tc-module-layout--2"><div class="tc-module-column"><div class="tc-module-section" data-flooding-dynamic="surface-form">${renderSurfaceForm(state, result)}</div><div class="tc-module-section" data-flooding-dynamic="surface-records">${lineSectionController.renderCard(state)}</div><div class="tc-module-section" data-flooding-dynamic="calculation-form">${renderCalculationForm(state, result)}</div></div><div class="tc-module-column"><div class="tc-module-section" data-flooding-dynamic="result">${renderResult(state, result)}</div></div></div>`);
  }

  return { view, renderSurfaceForm, renderCalculationForm, renderResult };
}

export default createFloodingVerificationView;