import config from './config.js';
import { state } from './state.js';
import { calculate, CONSUMERS, BUILDING_TYPES, consumerById, createConsumer, createUsageUnit, readUsageUnits, writeUsageUnits, readSingleConsumers, writeSingleConsumers } from './logic.js';
import { card, field, selectField, segmented, renderModuleShell, bindCommonInputs, stack, grid, inlineStats, mainResult } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

function esc(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function consumerOptions() {
  return CONSUMERS.map(c => ({ value: c.id, label: `${c.label} · ${fmt(c.vr, 2)} l/s` }));
}

function unitRows(units) {
  if (!units.length) return '<div class="empty-state empty-state--compact">Noch keine Nutzungseinheit angelegt</div>';
  return `<div class="dw-list">${units.map(unit => `<article class="line-section-card dw-item">
    <div class="line-section-card__head"><strong>${esc(unit.name)}</strong><button type="button" data-dw-unit-delete="${esc(unit.id)}" aria-label="Nutzungseinheit löschen">×</button></div>
    ${inlineStats([
      { label:'Verbraucher', value: unit.consumerCount },
      { label:'Summendurchfluss NE', value: fmt(unit.sumFlow, 2), unit:'l/s' },
      { label:'Spitzendurchfluss NE', value: fmt(unit.peakFlow, 2), unit:'l/s' }
    ])}
    <div class="dw-consumers">${(unit.consumers||[]).map(c => `<span>${esc(c.count)} × ${esc(c.label)} <small>${fmt(c.vr,2)} l/s</small></span>`).join('')}</div>
    <div class="dw-add-row">
      <select data-dw-unit-consumer="${esc(unit.id)}">${CONSUMERS.map(c => `<option value="${esc(c.id)}">${esc(c.short)} · ${fmt(c.vr,2)} l/s</option>`).join('')}</select>
      <input data-dw-unit-count="${esc(unit.id)}" type="text" inputmode="numeric" value="1" aria-label="Anzahl">
      <button type="button" class="mini-button" data-dw-unit-add-consumer="${esc(unit.id)}">Hinzufügen</button>
    </div>
  </article>`).join('')}</div>`;
}

function singleRows(singles) {
  if (!singles.length) return '<div class="empty-state empty-state--compact">Noch keine Einzelverbraucher angelegt</div>';
  return `<div class="dw-list">${singles.map(item => `<article class="line-section-card dw-item">
    <div class="line-section-card__head"><strong>${esc(item.name)}</strong><button type="button" data-dw-single-delete="${esc(item.id)}" aria-label="Einzelverbraucher löschen">×</button></div>
    ${inlineStats([
      { label:'Typ', value:item.label },
      { label:'Anzahl', value:item.count },
      { label:'Summendurchfluss', value:fmt(item.vr * item.count,2), unit:'l/s' },
      { label:'Dauerverbraucher', value:item.permanent ? 'Ja' : 'Nein' }
    ])}
  </article>`).join('')}</div>`;
}

function inputCard(s, r) {
  return stack([
    card('Berechnungsgrundlage', stack([
      selectField({ id:'buildingType', label:'Gebäude-/Nutzungsart', value:s.buildingType, options:BUILDING_TYPES.map(t => ({ value:t.id, label:t.label })) }),
      inlineStats([
        { label:'Gleichzeitigkeitsformel', value:r.formulaText },
        { label:'Normlogik', value:'NE: maximal zwei größte Entnahmestellen' }
      ])
    ].join('')), 'blue'),
    card('Nutzungseinheit anlegen', stack([
      field({ id:'unitName', label:'Bezeichnung', value:s.unitName, placeholder:'z. B. Bad Wohnung 1', inputmode:'text' }),
      grid([
        selectField({ id:'unitConsumerType', label:'Erster Verbraucher', value:s.unitConsumerType, options:consumerOptions() }),
        field({ id:'unitCount', label:'Anzahl', value:fmtInput(s.unitCount,0), inputmode:'numeric' })
      ].join(''), 2),
      '<button type="button" class="action-button" data-dw-add-unit>Nutzungseinheit speichern</button>',
      unitRows(r.usageUnits)
    ].join('')), 'blue'),
    card('Einzelverbraucher außerhalb NE', stack([
      field({ id:'singleName', label:'Bezeichnung', value:s.singleName, placeholder:'z. B. Außenzapfstelle', inputmode:'text' }),
      grid([
        selectField({ id:'singleConsumerType', label:'Verbraucher', value:s.singleConsumerType, options:consumerOptions() }),
        field({ id:'singleCount', label:'Anzahl', value:fmtInput(s.singleCount,0), inputmode:'numeric' })
      ].join(''), 2),
      segmented('singlePermanent', [
        { value:'false', label:'Kurzzeitverbraucher' },
        { value:'true', label:'Dauerverbraucher > 15 min' }
      ], String(s.singlePermanent), { accent:'blue' }),
      '<button type="button" class="action-button" data-dw-add-single>Einzelverbraucher speichern</button>',
      singleRows(r.singles)
    ].join('')), 'blue')
  ].join(''));
}

function resultCard(r) {
  return stack([
    mainResult('Ergebnis — Trinkwasser', { label:'Spitzendurchfluss', value:fmt(r.peakFlow, 2), unit:'l/s' }, [
      { label:'Summendurchfluss Nutzungseinheiten', value:fmt(r.neSumFlow, 2), unit:'l/s' },
      { label:'NE-Spitzen addiert', value:fmt(r.nePeakSum, 2), unit:'l/s' },
      { label:'Einzelverbraucher', value:fmt(r.singleSumFlow, 2), unit:'l/s' },
      { label:'Gesamt-Summendurchfluss', value:fmt(r.totalSumFlow, 2), unit:'l/s' },
      { label:'Spitzendurchfluss', value:fmt(r.peakFlow, 2), unit:'l/s' },
      { label:'Spitzendurchfluss', value:fmt(r.house.flowM3h, 2), unit:'m³/h' }
    ], 'blue'),
    card('Dimensionierung — Hauseinführung / Wasserzähler', inlineStats([
      { label:'Hauseinführung', value:r.house.dn },
      { label:'Wasserzähler', value:r.house.meter },
      { label:'Q3 Wasserzähler', value:fmt(r.house.q3, 0), unit:'m³/h' },
      { label:'Auslegung', value:'Vorläufig über Spitzendurchfluss' }
    ]), 'blue'),
    card('Hinweis', `<div class="formula">Dauerverbraucher werden zum nach Gleichzeitigkeit ermittelten Spitzendurchfluss addiert. Die endgültige Dimensionierung der Rohrnetze erfolgt mit Druckverlust, Fließgeschwindigkeit und hydraulisch ungünstigstem Fließweg.</div>`, 'blue', { compact:true })
  ].join(''));
}

function bindDrinkingWater(root, s, rerender) {
  root.querySelector('[data-dw-add-unit]')?.addEventListener('click', () => {
    const consumer = createConsumer({ typeId:s.unitConsumerType, count:s.unitCount });
    const units = readUsageUnits();
    units.push(createUsageUnit({ name:s.unitName, consumer }));
    writeUsageUnits(units);
    rerender();
  });
  root.querySelector('[data-dw-add-single]')?.addEventListener('click', () => {
    const singles = readSingleConsumers();
    singles.push(createConsumer({ typeId:s.singleConsumerType, count:s.singleCount, name:s.singleName, permanent:String(s.singlePermanent)==='true' }));
    writeSingleConsumers(singles);
    rerender();
  });
  root.querySelectorAll('[data-dw-unit-delete]').forEach(btn => btn.addEventListener('click', () => {
    writeUsageUnits(readUsageUnits().filter(item => item.id !== btn.dataset.dwUnitDelete));
    rerender();
  }));
  root.querySelectorAll('[data-dw-single-delete]').forEach(btn => btn.addEventListener('click', () => {
    writeSingleConsumers(readSingleConsumers().filter(item => item.id !== btn.dataset.dwSingleDelete));
    rerender();
  }));
  root.querySelectorAll('[data-dw-unit-add-consumer]').forEach(btn => btn.addEventListener('click', () => {
    const unitId = btn.dataset.dwUnitAddConsumer;
    const typeId = root.querySelector(`[data-dw-unit-consumer="${CSS.escape(unitId)}"]`)?.value;
    const count = root.querySelector(`[data-dw-unit-count="${CSS.escape(unitId)}"]`)?.value || '1';
    const units = readUsageUnits();
    const unit = units.find(item => item.id === unitId);
    if (unit && typeId) {
      unit.consumers = [...(unit.consumers || []), createConsumer({ typeId, count })];
      writeUsageUnits(units);
      rerender();
    }
  }));
}

function view(s) {
  const r = calculate(s);
  return renderModuleShell(config, `
    <div class="span-6">${inputCard(s, r)}</div>
    <div class="span-6">${resultCard(r)}</div>
  `);
}

export default {
  config,
  state,
  mount(root) {
    const render = () => {
      const s = state.get();
      root.innerHTML = view(s);
      bindCommonInputs(root, state);
      bindDrinkingWater(root, s, render);
    };
    state.subscribe(render);
    render();
  }
};
