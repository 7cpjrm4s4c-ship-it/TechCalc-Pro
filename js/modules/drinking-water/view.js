import config from './config.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, inlineStats, esc } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { createDrinkingWaterViewModel } from './viewModel.js';
import { renderDrinkingWaterResultModel, consumerRows, unitStats, singleStats, consumerModeSuffix } from './results.js';
import { isSameId } from '../../core/savedRecords.js';

export function draftConsumerList(items, type, waterHeatingMode = 'central') {
  if (!items?.length) return '<div class="empty-state empty-state--compact">Noch keine Verbraucher ausgewählt</div>';
  return `<div class="tc-consumer-list">${items.map((c, index) => `<div class="tc-consumer-row tc-collection-row tc-consumer-row--editable">
    <div><strong>${esc(c.label)}</strong><span>${fmt(c.vr * c.count, 2)} l/s gesamt · ${fmt(c.vr, 2)} l/s je Verbraucher · ${esc(consumerModeSuffix(c, waterHeatingMode))}${c.permanent ? ' · Dauerverbraucher' : ''}</span></div>
    <label class="tc-quantity-field"><span>Anzahl</span><input type="number" min="0" step="1" value="${esc(c.count)}" data-dw-draft-count="${esc(type)}" data-index="${index}" inputmode="numeric"></label>
    <button type="button" class="mini-button mini-button--danger" data-dw-remove-draft="${esc(type)}" data-index="${index}" aria-label="Verbraucher entfernen">×</button>
  </div>`).join('')}</div>`;
}


export function renderUsageUnitRows(units = [], snapshot = {}, waterHeatingMode = 'central') {
  if (!units.length) return '<div class="empty-state empty-state--compact">Noch keine Nutzungseinheit angelegt</div>';
  const activeId = snapshot.activeUnitId;
  const expandedId = snapshot.expandedUnitId;
  return `<div class="line-section-list saved-record-list">${units.map((unit, index) => `<article class="line-section-card saved-record-card ${isSameId(expandedId, unit.id) ? '' : 'is-collapsed'} ${isSameId(activeId, unit.id) ? 'is-active' : ''}" data-line-card data-dw-unit-edit="${esc(unit.id)}">
    <div class="line-section-card__head saved-record-card__head">
      <div class="line-section-card__title saved-record-card__title"><strong>${esc(unit.name || 'Nutzungseinheit ' + (index + 1))}</strong><small>${unit.consumerCount} Verbraucher · Σ ${fmt(unit.sumFlow, 2)} l/s · Spitze ${fmt(unit.peakFlow, 2)} l/s</small></div>
      <button type="button" class="line-section-card__toggle saved-record-card__toggle" data-line-toggle data-dw-toggle-unit="${esc(unit.id)}" aria-expanded="${isSameId(expandedId, unit.id) ? 'true' : 'false'}" aria-label="Details aufklappen"><span>▾</span></button>
      <button type="button" class="line-section-card__delete saved-record-card__delete" data-dw-unit-delete="${esc(unit.id)}" aria-label="Nutzungseinheit löschen">×</button>
    </div>
    <div class="line-section-card__body saved-record-card__body">
      ${inlineStats(unitStats(unit))}
      ${consumerRows(unit.consumers || [], waterHeatingMode)}
    </div>
  </article>`).join('')}</div>`;
}

export function renderSingleRows(groups = [], snapshot = {}, waterHeatingMode = 'central') {
  if (!groups.length) return '<div class="empty-state empty-state--compact">Noch keine Einzelverbraucher angelegt</div>';
  const activeId = snapshot.activeSingleId;
  const expandedId = snapshot.expandedSingleId;
  return `<div class="line-section-list saved-record-list">${groups.map((group, index) => {
    const consumers = group.consumers || [];
    const count = consumers.reduce((sum, c) => sum + (Number(c.count) || 1), 0);
    const sumFlow = consumers.reduce((sum, c) => sum + Number(c.vr || 0) * (Number(c.count) || 1), 0);
    return `<article class="line-section-card saved-record-card ${isSameId(expandedId, group.id) ? '' : 'is-collapsed'} ${isSameId(activeId, group.id) ? 'is-active' : ''}" data-line-card data-dw-single-edit="${esc(group.id)}">
      <div class="line-section-card__head saved-record-card__head">
        <div class="line-section-card__title saved-record-card__title"><strong>${esc(group.name || 'Einzelverbraucher ' + (index + 1))}</strong><small>${count} Verbraucher · ${fmt(sumFlow, 2)} l/s</small></div>
        <button type="button" class="line-section-card__toggle saved-record-card__toggle" data-line-toggle data-dw-toggle-single="${esc(group.id)}" aria-expanded="${isSameId(expandedId, group.id) ? 'true' : 'false'}" aria-label="Details aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete saved-record-card__delete" data-dw-single-delete="${esc(group.id)}" aria-label="Einzelverbraucher löschen">×</button>
      </div>
      <div class="line-section-card__body saved-record-card__body">
        ${inlineStats(singleStats(group))}
        ${consumerRows(consumers, waterHeatingMode)}
      </div>
    </article>`;
  }).join('')}</div>`;
}

export function renderInputCard(vm) {
  const s = vm.state;
  const r = vm.result;
  return stack([
    card(vm.waterHeating.basisTitle, stack([
      selectField({ id:'buildingType', label:'Gebäude-/Nutzungsart', value:s.buildingType, options:vm.buildingOptions }),
      segmented('waterHeatingMode', [
        { value:'central', label:'Zentrale Warmwasserbereitung' },
        { value:'decentral', label:'Dezentral' }
      ], s.waterHeatingMode, { accent:vm.accent, action:'platform:segment:waterHeatingMode' }),
      inlineStats([
        { label:'Gleichzeitigkeitsformel', value:r.formulaText },
        { label:'NE-Ansatz', value:'2 größte Entnahmestellen oder GL je NE' },
        { label:'Warmwasser', value:vm.waterHeating.warmWaterText }
      ])
    ].join('')), vm.accent),
    card(vm.waterHeating.unitCardTitle, stack([
      `<details class="tc-accordion" data-dw-accordion="uiUnitFormOpen" ${s.uiUnitFormOpen ? 'open' : ''}><summary><span class="tc-accordion__summary-text"><strong>Nutzungseinheit zusammenstellen</strong><small>${esc(vm.waterHeating.unitHelp)}</small></span></summary><div class="tc-accordion__body tc-stack">`,
      field({ id:'unitName', label:'Bezeichnung', value:s.unitName, placeholder:'z. B. Bad Wohnung 1', inputmode:'text' }),
      grid([
        selectField({ id:'unitConsumerType', label:vm.waterHeating.unitConsumerLabel, value:s.unitConsumerType, options:vm.consumerOptions }),
        field({ id:'unitCount', label:'Anzahl', value:fmtInput(s.unitCount,0), inputmode:'numeric' }),
        field({ id:'unitSimultaneityFactor', label:'GL der Nutzungseinheit', value:s.unitSimultaneityFactor || '', placeholder:'optional < 1,0', inputmode:'decimal' })
      ].join(''), 3),
      '<button type="button" class="action-button action-button--secondary" data-dw-draft-add="unit">Verbraucher zur Nutzungseinheit hinzufügen</button>',
      `<div data-dw-unit-draft>${draftConsumerList(s.unitDraftConsumers || [], 'unit', s.waterHeatingMode)}</div>`,
      `<div class="tc-save-actions"><button type="button" class="action-button" data-dw-add-unit ${s.activeUnitId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-dw-update-unit ${s.activeUnitId ? '' : 'disabled'}>Aktualisieren</button></div>`,
      '</div></details>',
      `<details class="tc-accordion" data-dw-accordion="uiUnitSavedOpen" ${s.uiUnitSavedOpen ? 'open' : ''}><summary><span class="tc-accordion__summary-text"><strong>Gespeicherte Nutzungseinheiten</strong><small data-dw-unit-summary>${vm.savedUsageUnits.length} Nutzungseinheiten angelegt</small></span></summary><div class="tc-accordion__body tc-stack" data-dw-unit-saved>${renderUsageUnitRows(vm.savedUsageUnits, s, s.waterHeatingMode)}</div></details>`
    ].join('')), vm.accent),
    card(vm.waterHeating.singleCardTitle, stack([
      `<details class="tc-accordion" data-dw-accordion="uiSingleFormOpen" ${s.uiSingleFormOpen ? 'open' : ''}><summary><span class="tc-accordion__summary-text"><strong>Freie Einrichtungsgegenstände zusammenstellen</strong><small>${esc(vm.waterHeating.singleHelp)}</small></span></summary><div class="tc-accordion__body tc-stack">`,
      field({ id:'singleName', label:'Bezeichnung / Gruppe', value:s.singleName, placeholder:'z. B. WC EG', inputmode:'text' }),
      grid([
        selectField({ id:'singleConsumerType', label:vm.waterHeating.singleConsumerLabel, value:s.singleConsumerType, options:vm.consumerOptions }),
        field({ id:'singleCount', label:'Anzahl', value:fmtInput(s.singleCount,0), inputmode:'numeric' })
      ].join(''), 2),
      segmented('singlePermanent', [
        { value:'false', label:'Kurzzeitverbraucher' },
        { value:'true', label:'Dauerverbraucher > 15 min' }
      ], String(s.singlePermanent), { accent:vm.accent }),
      '<button type="button" class="action-button action-button--secondary" data-dw-draft-add="single">Verbraucher zur Gruppe hinzufügen</button>',
      `<div data-dw-single-draft>${draftConsumerList(s.singleDraftConsumers || [], 'single', s.waterHeatingMode)}</div>`,
      `<div class="tc-save-actions"><button type="button" class="action-button" data-dw-add-single ${s.activeSingleId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-dw-update-single ${s.activeSingleId ? '' : 'disabled'}>Aktualisieren</button></div>`,
      '</div></details>',
      `<details class="tc-accordion" data-dw-accordion="uiSingleSavedOpen" ${s.uiSingleSavedOpen ? 'open' : ''}><summary><span class="tc-accordion__summary-text"><strong>Gespeicherte Einzelverbraucher</strong><small data-dw-single-summary>${vm.savedSingleGroups.length} Gruppen außerhalb NE</small></span></summary><div class="tc-accordion__body tc-stack" data-dw-single-saved>${renderSingleRows(vm.savedSingleGroups, s, s.waterHeatingMode)}</div></details>`
    ].join('')), vm.accent)
  ].join(''));
}

export function renderResultCard(vm){
  return stack(renderDrinkingWaterResultModel(vm.resultModel, vm.accent));
}

export function renderView(s) {
  const vm = createDrinkingWaterViewModel(s);
  return renderModuleShell(config, `
    <div class="span-6" data-dw-dynamic="input">${renderInputCard(vm)}</div>
    <div class="span-6" data-dw-dynamic="result">${renderResultCard(vm)}</div>
  `);
}

export default renderView;
