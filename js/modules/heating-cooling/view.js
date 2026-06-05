import { MEDIA, fmt, fmtInput } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';
import { card, selectField, segmented, renderModuleShell, stack, grid } from '../../core/renderer.js';
import { renderResultModel, renderResultTable, renderRecommendationCard } from '../../platform/resultRenderer/index.js';
import { buildHeatingCoolingResultModel, buildPipeRecommendationModel, mediumRows } from './results.js';
import { activeCalculationState, inputFields, key } from './controller.js';

export function createHeatingCoolingView({ config, calculate, lineSectionController }) {
  if (!config) throw new Error('createHeatingCoolingView requires config');
  if (typeof calculate !== 'function') throw new Error('createHeatingCoolingView requires calculate');
  if (!lineSectionController) throw new Error('createHeatingCoolingView requires lineSectionController');

  function renderPipeRecommendation(s, r) {
    return renderRecommendationCard({
      ...buildPipeRecommendationModel(r),
      controlsHtml: selectField({ id: 'pipeSystemId', label: 'Rohrmaterial', value: s.pipeSystemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) })
    });
  }

  function view(s) {
    const active = activeCalculationState(s);
    const r = calculate(active);
    const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
    const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';

    const mediumCard = card('Medium', stack([
      selectField({ id: 'mediumId', label: 'Wärmeträger', value: s.mediumId, options: MEDIA.map(m => ({ value: m.id, label: m.label })) }),
      `<div data-hc-dynamic="medium-stats">${renderResultTable(mediumRows(r.medium))}</div>`
    ].join('')), 'blue', { compact: true });

    const inputColumn = stack([
      mediumCard,
      card('Betriebsart', `<div data-hc-dynamic="mode-segment">${segmented('mode', [
        { value: 'heating', label: '● Heizung' },
        { value: 'cooling', label: '● Kälte' }
      ], s.mode, { accent })}</div>`, accent, { compact: true }),
      card(`${modeLabel} — Eingaben`, stack([
        `<div data-hc-dynamic="target-segment">${segmented(key(s, 'CalcTarget'), [
          { value: 'power', label: 'Q Leistung' },
          { value: 'massFlow', label: 'ṁ Massenstrom' },
          { value: 'deltaT', label: 'ΔT Temperatur' }
        ], active.calcTarget, { accent })}</div>`,
        `<div data-hc-dynamic="input-fields">${grid(inputFields(s, active).join(''), 2)}</div>`
      ].join('')), accent),
      `<div data-hc-dynamic="result">${renderResultModel(buildHeatingCoolingResultModel(active, r, accent), accent)}</div>`,
      `<div class="formula" data-hc-dynamic="formula">Q = ṁ × cₚ × ΔT · ρ = ${fmt(r.medium.density, 0)} kg/m³ · cₚ = ${fmt(r.medium.cpWhKgK, 3)} Wh/(kg·K)</div>`
    ].join(''));

    return renderModuleShell(config, `
      <div class="span-6">${inputColumn}</div>
      <div class="span-6">${stack([`<div data-hc-dynamic="pipe-recommendation">${renderPipeRecommendation(s, r)}</div>`, lineSectionController.renderCard(s)].join(''))}</div>
    `);
  }

  const dynamicRenderers = {
    renderMediumStats: (_s, r) => renderResultTable(mediumRows(r.medium)),
    renderModeSegment: (s, _r, _active, accent) => segmented('mode', [
      { value: 'heating', label: '● Heizung' },
      { value: 'cooling', label: '● Kälte' }
    ], s.mode, { accent }),
    renderTargetSegment: (s, _r, active, accent) => segmented(key(s, 'CalcTarget'), [
      { value: 'power', label: 'Q Leistung' },
      { value: 'massFlow', label: 'ṁ Massenstrom' },
      { value: 'deltaT', label: 'ΔT Temperatur' }
    ], active.calcTarget, { accent }),
    renderInputFields: (s, _r, active) => grid(inputFields(s, active).join(''), 2),
    renderResult: (_s, r, active, accent) => renderResultModel(buildHeatingCoolingResultModel(active, r, accent), accent),
    renderFormula: (_s, r) => `Q = ṁ × cₚ × ΔT · ρ = ${fmt(r.medium.density, 0)} kg/m³ · cₚ = ${fmt(r.medium.cpWhKgK, 3)} Wh/(kg·K)`,
    renderPipeRecommendation
  };

  return { view, renderPipeRecommendation, dynamicRenderers };
}

export default createHeatingCoolingView;
