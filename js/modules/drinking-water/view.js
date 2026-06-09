import config from './config.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, inlineStats, esc } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { createDrinkingWaterViewModel } from './viewModel.js';
import { renderUsageUnitRows, renderSingleRows } from './controller.js';
import { renderDrinkingWaterResultModel } from './results.js';

export function draftConsumerList(items, type) {
  if (!items?.length) return '<div class="empty-state empty-state--compact">Noch keine Verbraucher ausgewählt</div>';
  return `<div class="tc-consumer-list">${items.map((c, index) => `<div class="tc-consumer-row dw-consumer-row--editable">
    <div><strong>${esc(c.label)}</strong><span>${fmt(c.vr * c.count, 2)} l/s gesamt · ${fmt(c.vr, 2)} l/s je Verbraucher${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}${c.permanent ? ' · Dauerverbraucher' : ''}</span></div>
    <label class="mini-edit-field"><span>Anzahl</span><input type="number" min="0" step="1" value="${esc(c.count)}" data-dw-draft-count="${esc(type)}" data-index="${index}" inputmode="numeric"></label>
    <button type="button" data-dw-remove-draft="${esc(type)}" data-index="${index}" aria-label="Verbraucher entfernen">×</button>
  </div>`).join('')}</div>`;
}

export function renderInputCard(vm) {
  const s = vm.state;
  const r = vm.result;
  return stack([
    card('Berechnungsgrundlage', stack([
      selectField({ id:'buildingType', label:'Gebäude-/Nutzungsart', value:s.buildingType, options:vm.buildingOptions }),
      segmented('waterHeatingMode', [
        { value:'central', label:'Zentrale Warmwasserbereitung' },
        { value:'decentral', label:'Dezentral' }
      ], s.waterHeatingMode, { accent:vm.accent }),
      inlineStats([
        { label:'Gleichzeitigkeitsformel', value:r.formulaText },
        { label:'NE-Ansatz', value:'2 größte Entnahmestellen oder GL je NE' },
        { label:'Warmwasser', value:r.centralWarmWater ? 'TWW-Zapfstellen werden mitgerechnet' : 'Dezentral, Warmwasserbereitung mit 0,05 l/s je TWW-Verbraucher' }
      ])
    ].join('')), vm.accent),
    card('Nutzungseinheiten', stack([
      `<details class="tc-accordion dw-save-dialog" data-dw-accordion="uiUnitFormOpen" ${s.uiUnitFormOpen ? 'open' : ''}><summary><span class="tc-accordion__summary-text dw-save-dialog__summary"><strong>Nutzungseinheit zusammenstellen</strong><small>Mehrere Verbraucher auswählen und anschließend als NE speichern</small></span></summary><div class="tc-accordion__body tc-stack dw-save-dialog__body">`,
      field({ id:'unitName', label:'Bezeichnung', value:s.unitName, placeholder:'z. B. Bad Wohnung 1', inputmode:'text' }),
      grid([
        selectField({ id:'unitConsumerType', label:'Verbraucher hinzufügen', value:s.unitConsumerType, options:vm.consumerOptions }),
        field({ id:'unitCount', label:'Anzahl', value:fmtInput(s.unitCount,0), inputmode:'numeric' }),
        field({ id:'unitSimultaneityFactor', label:'GL der Nutzungseinheit', value:s.unitSimultaneityFactor || '', placeholder:'optional < 1,0', inputmode:'decimal' })
      ].join(''), 3),
      '<button type="button" class="action-button action-button--secondary" data-dw-draft-add="unit">Verbraucher zur Nutzungseinheit hinzufügen</button>',
      `<div data-dw-unit-draft>${draftConsumerList(s.unitDraftConsumers || [], 'unit')}</div>`,
      `<div class="tc-save-actions"><button type="button" class="action-button" data-dw-add-unit ${s.activeUnitId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-dw-update-unit ${s.activeUnitId ? '' : 'disabled'}>Aktualisieren</button></div>`,
      '</div></details>',
      `<details class="tc-accordion dw-save-dialog dw-save-dialog--saved" data-dw-accordion="uiUnitSavedOpen" ${s.uiUnitSavedOpen ? 'open' : ''}><summary><span class="tc-accordion__summary-text dw-save-dialog__summary"><strong>Gespeicherte Nutzungseinheiten</strong><small data-dw-unit-summary>${vm.savedUsageUnits.length} Nutzungseinheiten angelegt</small></span></summary><div class="tc-accordion__body tc-stack dw-save-dialog__body" data-dw-unit-saved>${renderUsageUnitRows(vm.savedUsageUnits, s)}</div></details>`
    ].join('')), vm.accent),
    card('Einzelverbraucher außerhalb NE', stack([
      `<details class="tc-accordion dw-save-dialog" data-dw-accordion="uiSingleFormOpen" ${s.uiSingleFormOpen ? 'open' : ''}><summary><span class="tc-accordion__summary-text dw-save-dialog__summary"><strong>Freie Einrichtungsgegenstände zusammenstellen</strong><small>Mehrere Verbraucher außerhalb einer Nutzungseinheit als Gruppe anlegen</small></span></summary><div class="tc-accordion__body tc-stack dw-save-dialog__body">`,
      field({ id:'singleName', label:'Bezeichnung / Gruppe', value:s.singleName, placeholder:'z. B. WC EG', inputmode:'text' }),
      grid([
        selectField({ id:'singleConsumerType', label:'Verbraucher hinzufügen', value:s.singleConsumerType, options:vm.consumerOptions }),
        field({ id:'singleCount', label:'Anzahl', value:fmtInput(s.singleCount,0), inputmode:'numeric' })
      ].join(''), 2),
      segmented('singlePermanent', [
        { value:'false', label:'Kurzzeitverbraucher' },
        { value:'true', label:'Dauerverbraucher > 15 min' }
      ], String(s.singlePermanent), { accent:vm.accent }),
      '<button type="button" class="action-button action-button--secondary" data-dw-draft-add="single">Verbraucher zur Gruppe hinzufügen</button>',
      `<div data-dw-single-draft>${draftConsumerList(s.singleDraftConsumers || [], 'single')}</div>`,
      `<div class="tc-save-actions"><button type="button" class="action-button" data-dw-add-single ${s.activeSingleId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-dw-update-single ${s.activeSingleId ? '' : 'disabled'}>Aktualisieren</button></div>`,
      '</div></details>',
      `<details class="tc-accordion dw-save-dialog dw-save-dialog--saved" data-dw-accordion="uiSingleSavedOpen" ${s.uiSingleSavedOpen ? 'open' : ''}><summary><span class="tc-accordion__summary-text dw-save-dialog__summary"><strong>Gespeicherte Einzelverbraucher</strong><small data-dw-single-summary>${vm.savedSingleGroups.length} Gruppen außerhalb NE</small></span></summary><div class="tc-accordion__body tc-stack dw-save-dialog__body" data-dw-single-saved>${renderSingleRows(vm.savedSingleGroups, s)}</div></details>`
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
