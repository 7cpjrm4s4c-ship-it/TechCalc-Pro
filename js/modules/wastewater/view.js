import { card, renderModuleShell, stack, esc } from '../../core/renderer.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { renderDebugCard } from '../../platform/debugPanel/index.js';
import { results } from './results.js';
import { createWastewaterViewModel } from './viewModel.js';

export function renderWastewaterFixtures(fixtures = []) {
  if (!Array.isArray(fixtures) || !fixtures.length) {
    return '<div class="empty-state">Noch keine Entwässerungsgegenstände hinzugefügt.</div>';
  }
  return `<div class="collection-list collection-list--fixtures">${fixtures.map(item => `
    <div class="collection-item" data-collection-row="fixtures" data-collection-id="${esc(item.id)}">
      <div class="collection-item__main">
        <strong>${esc(item.name || 'Entwässerungsgegenstand')}</strong>
        <span>${esc(`ΣDU ${item.totalDu ?? '—'} l/s · DU/Stk. ${item.du ?? '—'} l/s · Einzelanschluss ${item.dn || '—'}`)}</span>
      </div>
      <div class="collection-item__actions">
        <label class="sr-only" for="fixture-${esc(item.id)}-quantity">Anzahl</label>
        <input id="fixture-${esc(item.id)}-quantity" class="collection-input" data-collection-input="fixtures" data-collection-id="${esc(item.id)}" data-collection-field="quantity" inputmode="numeric" value="${esc(item.qty ?? item.quantity ?? 1)}" autocomplete="off">
        <button type="button" class="icon-button" data-tc-action="platform:collection:delete" data-collection="fixtures" data-collection-id="${esc(item.id)}" aria-label="Gegenstand entfernen">×</button>
      </div>
    </div>
  `).join('')}</div>`;
}

export function renderWastewaterResult(s, r) {
  return renderResultModel(results(s, r), 'green');
}

export function createWastewaterView(config, calculate, wastewaterSavedController) {
  if (!config) throw new Error('createWastewaterView requires config');
  if (typeof calculate !== 'function') throw new Error('createWastewaterView requires calculate');
  if (!wastewaterSavedController) throw new Error('createWastewaterView requires wastewaterSavedController');

  return function view(s) {
    const r = calculate(s);
    const vm = createWastewaterViewModel(s, r);
    const inputColumn = stack([
      card('Nutzung', `<div data-ww-dynamic="usage">${vm.usageHtml}</div>`, 'green'),
      card('Leitungsart / Randbedingungen', `<div data-ww-dynamic="line-fields">${vm.lineHtml}</div>`, 'green'),
      card('Entwässerungsgegenstände', stack([
        `<div data-ww-dynamic="fixture-inputs">${vm.fixtureInputHtml}</div>`,
        `<div data-ww-dynamic="fixtures">${renderWastewaterFixtures(r.fixtures || [])}</div>`
      ].join('')), 'green'),
      card('Zusatzabflüsse', `<div data-ww-dynamic="additional-flows">${vm.additionalFlowsHtml}</div>`, 'green')
    ].join(''));

    const outputColumn = stack([
      `<div data-ww-dynamic="result">${renderWastewaterResult(s, r)}</div>`,
      vm.savedRecordsHtml,
      `<div data-debug-panel>${renderDebugCard()}</div>`
    ].join(''));

    return renderModuleShell(config, `
      <div class="span-6 tc-module-column">${inputColumn}</div>
      <div class="span-6 tc-module-column">${outputColumn}</div>
    `);
  };
}

export default createWastewaterView;
