import { card, renderModuleShell, stack, esc } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { results } from './results.js';
import { createWastewaterViewModel } from './viewModel.js';

export function renderWastewaterFixtures(fixtures = []) {
  if (!Array.isArray(fixtures) || !fixtures.length) {
    return '<div class="empty-state">Noch keine Entwässerungsgegenstände hinzugefügt.</div>';
  }
  return `<div class="tc-consumer-list wastewater-fixtures">${fixtures.map(item => `
    <div class="tc-consumer-row tc-collection-row tc-consumer-row--editable wastewater-fixture-row wastewater-fixture-row--editable" data-collection-row="fixtures" data-collection-id="${esc(item.id)}">
      <div class="tc-collection-row__content">
        <strong>${esc(item.name || 'Entwässerungsgegenstand')}</strong>
        <small>${esc(`ΣDU ${item.totalDu ?? '—'} l/s · DU/Stk. ${item.du ?? '—'} l/s · Einzelanschluss ${item.dn || '—'}`)}</small>
      </div>
      <label class="tc-quantity-field" for="fixture-${esc(item.id)}-quantity">
        <span>Anzahl</span>
        <input id="fixture-${esc(item.id)}-quantity" data-collection-input="fixtures" data-collection-id="${esc(item.id)}" data-collection-field="quantity" inputmode="numeric" value="${esc(item.qty ?? item.quantity ?? 1)}" autocomplete="off">
      </label>
      <button type="button" class="mini-button mini-button--danger" data-tc-action="platform:collection:delete" data-collection="fixtures" data-collection-id="${esc(item.id)}" aria-label="Gegenstand entfernen">×</button>
    </div>
  `).join('')}</div>`;
}

export function renderWastewaterResult(s, r) {
  return renderResultModel(results(s, r), 'green');
}

export function createWastewaterView(config, calculate, lineSectionController) {
  if (!config) throw new Error('createWastewaterView requires config');
  if (typeof calculate !== 'function') throw new Error('createWastewaterView requires calculate');
  if (!lineSectionController) throw new Error('createWastewaterView requires lineSectionController');

  function view(s) {
    const r = calculate(s);
    const vm = createWastewaterViewModel(s, r);
    const inputColumn = stack([
      card('Nutzung', `<div data-ww-dynamic="usage">${vm.usageHtml}</div>`, 'green'),
      card('Leitungsart / Randbedingungen', `<div data-ww-dynamic="line-fields">${vm.lineHtml}</div>`, 'green'),
      card('Entwässerungsgegenstände', stack([
        `<div data-ww-dynamic="fixture-inputs">${vm.fixtureInputHtml}</div>`,
        `<div data-ww-dynamic="fixtures">${renderWastewaterFixtures(r.fixtures || [])}</div>`
      ].join('')), 'green'),
      card('Zusatzabflüsse', `<div data-ww-dynamic="additional-flows">${vm.additionalFlowsHtml}</div>`, 'green'),
      lineSectionController.renderCard(s)
    ].join(''));

    const outputColumn = stack([
      `<div data-ww-dynamic="result">${renderWastewaterResult(s, r)}</div>`
    ].join(''));

    return renderModuleShell(config, `
      <div class="span-6">${inputColumn}</div>
      <div class="span-6">${outputColumn}</div>
    `);
  }

  const dynamicRenderers = {
    renderResult: renderWastewaterResult,
    renderFixtures: renderWastewaterFixtures
  };

  return { view, dynamicRenderers };
}

export default createWastewaterView;
