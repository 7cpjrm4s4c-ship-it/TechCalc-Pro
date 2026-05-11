import config from './config.js';
import { state } from './state.js';
import { calculate, CONSUMERS, BUILDING_TYPES, createConsumer, createUsageUnit, readUsageUnits, writeUsageUnits, readSingleConsumers, writeSingleConsumers } from './logic.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, inlineStats, mainResult, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

function consumerOptions() {
  return CONSUMERS.map(c => ({ value: c.id, label: `${c.label} · ${fmt(c.vr, 2)} l/s` }));
}

function consumerSelectOptions(selected = '') {
  return CONSUMERS.map(c => `<option value="${esc(c.id)}" ${c.id === selected ? 'selected' : ''}>${esc(c.label)} · ${fmt(c.vr, 2)} l/s</option>`).join('');
}

function draftConsumerList(items, type) {
  if (!items?.length) return '<div class="empty-state empty-state--compact">Noch keine Verbraucher ausgewählt</div>';
  return `<div class="dw-consumer-list">${items.map((c, index) => `<div class="dw-consumer-row">
    <div><strong>${esc(c.count)} × ${esc(c.label)}</strong><span>${fmt(c.vr * c.count, 2)} l/s gesamt · ${fmt(c.vr, 2)} l/s je Verbraucher</span></div>
    <button type="button" data-dw-remove-draft="${esc(type)}" data-index="${index}" aria-label="Verbraucher entfernen">×</button>
  </div>`).join('')}</div>`;
}

function unitRows(units) {
  if (!units.length) return '<div class="empty-state empty-state--compact">Noch keine Nutzungseinheit angelegt</div>';
  return `<div class="dw-list">${units.map((unit, index) => `<details class="dw-accordion" ${index === 0 ? 'open' : ''}>
    <summary>
      <span><strong>${esc(unit.name)}</strong><small>${unit.consumerCount} Verbraucher · Σ ${fmt(unit.sumFlow, 2)} l/s · Spitze ${fmt(unit.peakFlow, 2)} l/s</small></span>
      <button type="button" data-dw-unit-delete="${esc(unit.id)}" aria-label="Nutzungseinheit löschen">×</button>
    </summary>
    <div class="dw-accordion__body">
      ${inlineStats([
        { label:'Verbraucher', value: unit.consumerCount },
        { label:'Σ NE', value: fmt(unit.sumFlow, 2), unit:'l/s' },
        { label:'Spitze NE', value: fmt(unit.peakFlow, 2), unit:'l/s' },
        { label:'Ansatz', value:'2 größte Entnahmestellen' }
      ])}
      <div class="dw-consumer-list">${(unit.consumers||[]).map(c => `<div class="dw-consumer-row"><div><strong>${esc(c.count)} × ${esc(c.label)}</strong><span>${fmt(c.vr * c.count, 2)} l/s gesamt · ${fmt(c.vr,2)} l/s je Verbraucher</span></div></div>`).join('')}</div>

    </div>
  </details>`).join('')}</div>`;
}

function singleRows(singles) {
  if (!singles.length) return '<div class="empty-state empty-state--compact">Noch keine Einzelverbraucher angelegt</div>';
  return `<div class="dw-list">${singles.map((item, index) => `<details class="dw-accordion" ${index === 0 ? 'open' : ''}>
    <summary>
      <span><strong>${esc(item.name)}</strong><small>${item.count} × ${esc(item.label)} · ${fmt(item.vr * item.count,2)} l/s</small></span>
      <button type="button" data-dw-single-delete="${esc(item.id)}" aria-label="Einzelverbraucher löschen">×</button>
    </summary>
    <div class="dw-accordion__body">
      ${inlineStats([
        { label:'Typ', value:item.label },
        { label:'Anzahl', value:item.count },
        { label:'Summendurchfluss', value:fmt(item.vr * item.count,2), unit:'l/s' },
        { label:'Dauerverbraucher', value:item.permanent ? 'Ja' : 'Nein' }
      ])}
    </div>
  </details>`).join('')}</div>`;
}

function selectedFixturesList(r) {
  const aggregate = new Map();
  const add = (consumer) => {
    const key = `${consumer.label}|${consumer.vr}|${consumer.permanent ? '1' : '0'}`;
    const current = aggregate.get(key) || { label: consumer.label, vr: Number(consumer.vr || 0), count: 0, permanent: Boolean(consumer.permanent) };
    current.count += Number(consumer.count) || 1;
    aggregate.set(key, current);
  };
  (r.usageUnits || []).forEach(unit => (unit.consumers || []).forEach(add));
  (r.rawSingles || r.singles || []).forEach(add);
  const rows = [...aggregate.values()];
  if (!rows.length) return '<div class="empty-state empty-state--compact">Noch keine Einrichtungsgegenstände ausgewählt</div>';
  return `<div class="dw-fixture-list dw-fixture-list--plain">${rows.map(item => `<div class="dw-fixture-row"><strong>${esc(item.count)} × ${esc(item.label.replace(' TWW',''))}</strong>${item.permanent ? '<em>Dauerverbraucher</em>' : ''}</div>`).join('')}</div>`;
}


function inputCard(s, r) {
  return stack([
    card('Berechnungsgrundlage', stack([
      selectField({ id:'buildingType', label:'Gebäude-/Nutzungsart', value:s.buildingType, options:BUILDING_TYPES.map(t => ({ value:t.id, label:t.label })) }),
      segmented('waterHeatingMode', [
        { value:'central', label:'Zentrale Warmwasserbereitung' },
        { value:'decentral', label:'Dezentral' }
      ], s.waterHeatingMode, { accent:'blue' }),
      inlineStats([
        { label:'Gleichzeitigkeitsformel', value:r.formulaText },
        { label:'NE-Ansatz', value:'2 größte Entnahmestellen' },
        { label:'Warmwasser', value:r.centralWarmWater ? 'TWW-Zapfstellen werden mitgerechnet' : 'Dezentral, ohne zentrale TWW-Last' }
      ])
    ].join('')), 'blue'),
    card('Nutzungseinheiten', stack([
      `<details class="dw-accordion dw-accordion--form" open><summary><span><strong>Nutzungseinheit zusammenstellen</strong><small>Mehrere Verbraucher auswählen und anschließend als NE speichern</small></span></summary><div class="dw-accordion__body">`,
      field({ id:'unitName', label:'Bezeichnung', value:s.unitName, placeholder:'z. B. Bad Wohnung 1', inputmode:'text' }),
      grid([
        selectField({ id:'unitConsumerType', label:'Verbraucher hinzufügen', value:s.unitConsumerType, options:consumerOptions() }),
        field({ id:'unitCount', label:'Anzahl', value:fmtInput(s.unitCount,0), inputmode:'numeric' })
      ].join(''), 2),
      '<button type="button" class="action-button action-button--secondary" data-dw-draft-add="unit">Verbraucher zur Nutzungseinheit hinzufügen</button>',
      draftConsumerList(s.unitDraftConsumers || [], 'unit'),
      '<button type="button" class="action-button" data-dw-add-unit>Nutzungseinheit speichern</button>',
      '</div></details>',
      `<details class="dw-accordion dw-accordion--saved" ${r.usageUnits.length ? 'open' : ''}><summary><span><strong>Gespeicherte Nutzungseinheiten</strong><small>${r.usageUnits.length} Nutzungseinheiten angelegt</small></span></summary><div class="dw-accordion__body">${unitRows(r.usageUnits)}</div></details>`
    ].join('')), 'blue'),
    card('Einzelverbraucher außerhalb NE', stack([
      `<details class="dw-accordion dw-accordion--form" open><summary><span><strong>Freie Einrichtungsgegenstände zusammenstellen</strong><small>Mehrere Verbraucher außerhalb einer Nutzungseinheit anlegen</small></span></summary><div class="dw-accordion__body">`,
      field({ id:'singleName', label:'Bezeichnung / Gruppe', value:s.singleName, placeholder:'z. B. Außenanlagen / Technikraum', inputmode:'text' }),
      grid([
        selectField({ id:'singleConsumerType', label:'Verbraucher hinzufügen', value:s.singleConsumerType, options:consumerOptions() }),
        field({ id:'singleCount', label:'Anzahl', value:fmtInput(s.singleCount,0), inputmode:'numeric' })
      ].join(''), 2),
      segmented('singlePermanent', [
        { value:'false', label:'Kurzzeitverbraucher' },
        { value:'true', label:'Dauerverbraucher > 15 min' }
      ], String(s.singlePermanent), { accent:'blue' }),
      '<button type="button" class="action-button action-button--secondary" data-dw-draft-add="single">Verbraucher zur Auswahl hinzufügen</button>',
      draftConsumerList(s.singleDraftConsumers || [], 'single'),
      '<button type="button" class="action-button" data-dw-add-single>Einzelverbraucher speichern</button>',
      '</div></details>',
      `<details class="dw-accordion dw-accordion--saved" ${r.singles.length ? 'open' : ''}><summary><span><strong>Gespeicherte Einzelverbraucher</strong><small>${r.singles.length} Einträge außerhalb NE</small></span></summary><div class="dw-accordion__body">${singleRows(r.singles)}</div></details>`
    ].join('')), 'blue')
  ].join(''));
}

function resultCard(r) {
  return stack([
    mainResult('Ergebnis — Trinkwasser', { label:'Spitzendurchfluss', value:fmt(r.peakFlow, 2), unit:'l/s' }, [
      { label:'Σ NE', value:fmt(r.neSumFlow, 2), unit:'l/s' },
      { label:'NE-Spitzen', value:fmt(r.nePeakSum, 2), unit:'l/s' },
      { label:'Einzel', value:fmt(r.singleSumFlow, 2), unit:'l/s' },
      { label:'Gesamt Σ', value:fmt(r.totalSumFlow, 2), unit:'l/s' },
      { label:'Spitze', value:fmt(r.peakFlow, 2), unit:'l/s' },
      { label:'Spitze', value:fmt(r.house.flowM3h, 2), unit:'m³/h' }
    ], 'blue'),
    card('Dimensionierung — Hauseinführung / Wasserzähler', inlineStats([
      { label:'Hauseinführung', value:r.house.dn },
      { label:'Wasserzähler', value:r.house.meter },
      { label:'Q3 Wasserzähler', value:fmt(r.house.q3, 0), unit:'m³/h' },
      { label:'Auslegung', value:'Vorläufig über Spitzendurchfluss' }
    ]), 'blue'),
    card('Zusammenstellung Einrichtungsgegenstände', selectedFixturesList(r), 'blue'),
    card('Hinweis', `<div class="dw-note">Dauerverbraucher werden zum nach Gleichzeitigkeit ermittelten Spitzendurchfluss addiert. Bei zentraler Warmwasserbereitung werden TWW-Zapfstellen zusätzlich berücksichtigt. 3-Liter-Regel, Probenahmestellen und hygienische Anforderungen sind in der weiteren Planung separat zu prüfen. Die endgültige Rohrnetzdimensionierung erfolgt mit Druckverlust, Fließgeschwindigkeit und hydraulisch ungünstigstem Fließweg.</div>`, 'blue', { compact:true })
  ].join(''));
}

function bindDrinkingWater(root, s, rerender) {
  root.querySelectorAll('[data-dw-draft-add]').forEach(btn => btn.addEventListener('click', () => {
    const target = btn.dataset.dwDraftAdd;
    const isUnit = target === 'unit';
    const consumer = createConsumer({
      typeId: isUnit ? s.unitConsumerType : s.singleConsumerType,
      count: isUnit ? s.unitCount : s.singleCount,
      permanent: !isUnit && String(s.singlePermanent) === 'true'
    });
    if (isUnit) state.set({ unitDraftConsumers: [...(s.unitDraftConsumers || []), consumer] });
    else state.set({ singleDraftConsumers: [...(s.singleDraftConsumers || []), consumer] });
  }));

  root.querySelectorAll('[data-dw-remove-draft]').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.dwRemoveDraft === 'unit' ? 'unitDraftConsumers' : 'singleDraftConsumers';
    const next = [...(s[key] || [])];
    next.splice(Number(btn.dataset.index), 1);
    state.set({ [key]: next });
  }));

  root.querySelector('[data-dw-add-unit]')?.addEventListener('click', () => {
    const consumers = [...(s.unitDraftConsumers || [])];
    if (!consumers.length) consumers.push(createConsumer({ typeId:s.unitConsumerType, count:s.unitCount }));
    const units = readUsageUnits();
    units.push(createUsageUnit({ name:s.unitName, consumers }));
    writeUsageUnits(units);
    state.set({ unitDraftConsumers: [] });
  });

  root.querySelector('[data-dw-add-single]')?.addEventListener('click', () => {
    const draft = [...(s.singleDraftConsumers || [])];
    if (!draft.length) draft.push(createConsumer({ typeId:s.singleConsumerType, count:s.singleCount, permanent:String(s.singlePermanent)==='true' }));
    const singles = readSingleConsumers();
    draft.forEach((consumer, index) => singles.push({ ...consumer, name: draft.length > 1 ? `${s.singleName || 'Einzelverbraucher'} ${index + 1}` : (s.singleName || consumer.label), permanent:String(s.singlePermanent)==='true' }));
    writeSingleConsumers(singles);
    state.set({ singleDraftConsumers: [] });
  });

  root.querySelectorAll('[data-dw-unit-delete]').forEach(btn => btn.addEventListener('click', (event) => {
    event.preventDefault(); event.stopPropagation();
    writeUsageUnits(readUsageUnits().filter(item => item.id !== btn.dataset.dwUnitDelete));
    rerender();
  }));
  root.querySelectorAll('[data-dw-single-delete]').forEach(btn => btn.addEventListener('click', (event) => {
    event.preventDefault(); event.stopPropagation();
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
    mountModule(root, state, view, (rootEl, snapshot, render) => {
      bindDrinkingWater(rootEl, snapshot, render);
    });
  }
};
