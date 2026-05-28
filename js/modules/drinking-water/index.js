import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate, CONSUMERS, BUILDING_TYPES, createConsumer, createUsageUnit, createSingleGroup, readUsageUnits, writeUsageUnits, readSingleConsumers, writeSingleConsumers } from './logic.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, inlineStats, mainResult, esc } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { isSameId } from '../../core/savedRecords.js';
import { safeReplaceContent } from '../../core/domUpdate.js';

function consumerOptions() {
  return CONSUMERS.map(c => ({ value: c.id, label: `${c.label} · ${fmt(c.vr, 2)} l/s${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}` }));
}

function draftConsumerList(items, type) {
  if (!items?.length) return '<div class="empty-state empty-state--compact">Noch keine Verbraucher ausgewählt</div>';
  return `<div class="tc-consumer-list dw-consumer-list">${items.map((c, index) => `<div class="tc-consumer-row dw-consumer-row dw-consumer-row--editable">
    <div><strong>${esc(c.label)}</strong><span>${fmt(c.vr * c.count, 2)} l/s gesamt · ${fmt(c.vr, 2)} l/s je Verbraucher${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}${c.permanent ? ' · Dauerverbraucher' : ''}</span></div>
    <label class="mini-edit-field"><span>Anzahl</span><input type="number" min="0" step="1" value="${esc(c.count)}" data-dw-draft-count="${esc(type)}" data-index="${index}" inputmode="numeric"></label>
    <button type="button" data-dw-remove-draft="${esc(type)}" data-index="${index}" aria-label="Verbraucher entfernen">×</button>
  </div>`).join('')}</div>`;
}

function consumerRows(consumers = []) {
  return `<div class="tc-consumer-list dw-consumer-list">${consumers.map(c => `<div class="tc-consumer-row dw-consumer-row"><div><strong>${esc(c.count)} × ${esc(c.label)}</strong><span>${fmt(c.vr * c.count, 2)} l/s gesamt · ${fmt(c.vr,2)} l/s je Verbraucher${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}${c.permanent ? ' · Dauerverbraucher' : ''}</span></div></div>`).join('')}</div>`;
}

function unitRows(units) {
  if (!units.length) return '<div class="empty-state empty-state--compact">Noch keine Nutzungseinheit angelegt</div>';
  const activeId = state.get().activeUnitId;
  return `<div class="line-section-list saved-record-list dw-list">${units.map((unit, index) => `<article class="line-section-card saved-record-card is-collapsed ${isSameId(activeId, unit.id) ? 'is-active' : ''}" data-line-card data-dw-unit-edit="${esc(unit.id)}">
    <div class="line-section-card__head saved-record-card__head">
      <div class="line-section-card__title saved-record-card__title"><strong>${esc(unit.name || 'Nutzungseinheit ' + (index + 1))}</strong><small>${unit.consumerCount} Verbraucher · Σ ${fmt(unit.sumFlow, 2)} l/s · Spitze ${fmt(unit.peakFlow, 2)} l/s</small></div>
      <button type="button" class="line-section-card__toggle saved-record-card__toggle" data-line-toggle aria-expanded="false" aria-label="Details aufklappen"><span>▾</span></button>
      <button type="button" class="line-section-card__delete saved-record-card__delete" data-dw-unit-delete="${esc(unit.id)}" aria-label="Nutzungseinheit löschen">×</button>
    </div>
    <div class="line-section-card__body saved-record-card__body">
      ${inlineStats([
        { label:'Verbraucher', value: unit.consumerCount },
        { label:'Σ NE', value: fmt(unit.sumFlow, 2), unit:'l/s' },
        { label:'Spitze NE', value: fmt(unit.peakFlow, 2), unit:'l/s' },
        { label:'Ansatz', value: unit.simultaneityFactor ? `GL ${fmt(unit.simultaneityFactor, 2)}` : '2 größte Entnahmestellen' }
      ])}
      ${consumerRows(unit.consumers || [])}
    </div>
  </article>`).join('')}</div>`;
}

function singleRows(groups) {
  if (!groups.length) return '<div class="empty-state empty-state--compact">Noch keine Einzelverbraucher angelegt</div>';
  const activeId = state.get().activeSingleId;
  return `<div class="line-section-list saved-record-list dw-list">${groups.map((group, index) => {
    const consumers = group.consumers || [];
    const count = consumers.reduce((sum, c) => sum + (Number(c.count) || 1), 0);
    const sumFlow = consumers.reduce((sum, c) => sum + Number(c.vr || 0) * (Number(c.count) || 1), 0);
    return `<article class="line-section-card saved-record-card is-collapsed ${isSameId(activeId, group.id) ? 'is-active' : ''}" data-line-card data-dw-single-edit="${esc(group.id)}">
      <div class="line-section-card__head saved-record-card__head">
        <div class="line-section-card__title saved-record-card__title"><strong>${esc(group.name || 'Einzelverbraucher ' + (index + 1))}</strong><small>${count} Verbraucher · ${fmt(sumFlow, 2)} l/s</small></div>
        <button type="button" class="line-section-card__toggle saved-record-card__toggle" data-line-toggle aria-expanded="false" aria-label="Details aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete saved-record-card__delete" data-dw-single-delete="${esc(group.id)}" aria-label="Einzelverbraucher löschen">×</button>
      </div>
      <div class="line-section-card__body saved-record-card__body">
        ${inlineStats([
          { label:'Gruppe', value: group.name },
          { label:'Verbraucher', value: count },
          { label:'Summendurchfluss', value: fmt(sumFlow, 2), unit:'l/s' },
          { label:'Dauerverbraucher', value: consumers.some(c => c.permanent) ? 'Ja' : 'Nein' }
        ])}
        ${consumerRows(consumers)}
      </div>
    </article>`;
  }).join('')}</div>`;
}


function normalizeSingleGroupForEdit(group) {
  if (!group) return null;
  if (Array.isArray(group.consumers)) return { ...group, consumers: group.consumers.map(c => ({ ...c })) };
  const typeId = group.typeId || group.consumerType || group.id;
  const fallback = createConsumer({ typeId, count: group.count || 1, permanent: Boolean(group.permanent) });
  const consumer = {
    ...fallback,
    ...group,
    id: group.consumerId || group.id || fallback.id,
    typeId: fallback.typeId,
    label: group.label || group.name || fallback.label,
    count: Math.max(1, Math.round(Number(group.count) || 1)),
    vr: Number(group.vr ?? fallback.vr),
    pmin: Number(group.pmin ?? fallback.pmin),
    neGroup: group.neGroup || fallback.neGroup,
    hotWater: group.hotWater ?? fallback.hotWater,
    permanent: Boolean(group.permanent)
  };
  return {
    id: group.groupId || group.id || fallback.id,
    name: group.groupName || group.name || group.label || 'Einzelverbraucher',
    consumers: [consumer],
    createdAt: group.createdAt || new Date().toISOString()
  };
}

function selectedFixturesList(r) {
  const aggregate = new Map();
  const add = (consumer) => {
    const label = String(consumer.label || '').replace(' TWW','').replace(' WW-Bereitung','');
    const key = `${label}|${consumer.vr}|${consumer.permanent ? '1' : '0'}|${consumer.hotWaterClone ? '1' : '0'}`;
    const current = aggregate.get(key) || { label, vr: Number(consumer.vr || 0), count: 0, permanent: Boolean(consumer.permanent), addon:Boolean(consumer.hotWaterClone) };
    current.count += Number(consumer.count) || 1;
    aggregate.set(key, current);
  };
  (r.usageUnits || []).forEach(unit => (unit.consumers || []).forEach(add));
  ((r.rawSingles && r.rawSingles.length) ? r.rawSingles : (r.singleGroups || []).flatMap(group => group.consumers || [])).forEach(add);
  // Sicherheitsnetz: Ein ausgewählter Einzelverbraucher wird zusätzlich aus dem aktiven Entwurf gelesen,
  // falls der gespeicherte Datenbestand noch aus einer älteren Version stammt.
  const s = state.get();
  if (s.activeSingleId && Array.isArray(s.singleDraftConsumers)) {
    s.singleDraftConsumers.forEach(add);
  }
  const rows = [...aggregate.values()];
  if (!rows.length) return '<div class="empty-state empty-state--compact">Noch keine Einrichtungsgegenstände ausgewählt</div>';
  return `<div class="tc-fixture-list dw-fixture-list dw-fixture-list--plain">${rows.map(item => `<div class="tc-fixture-row dw-fixture-row"><strong>${esc(item.count)} × ${esc(item.label)}</strong>${item.permanent ? '<em>Dauerverbraucher</em>' : ''}</div>`).join('')}</div>`;
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
        { label:'NE-Ansatz', value:'2 größte Entnahmestellen oder GL je NE' },
        { label:'Warmwasser', value:r.centralWarmWater ? 'TWW-Zapfstellen werden mitgerechnet' : 'Dezentral, Warmwasserbereitung mit 0,05 l/s je TWW-Verbraucher' }
      ])
    ].join('')), 'blue'),
    card('Nutzungseinheiten', stack([
      `<details class="tc-accordion dw-accordion dw-accordion--form" data-dw-accordion="uiUnitFormOpen" ${s.uiUnitFormOpen ? 'open' : ''}><summary><span><strong>Nutzungseinheit zusammenstellen</strong><small>Mehrere Verbraucher auswählen und anschließend als NE speichern</small></span></summary><div class="tc-accordion__body dw-accordion__body">`,
      field({ id:'unitName', label:'Bezeichnung', value:s.unitName, placeholder:'z. B. Bad Wohnung 1', inputmode:'text' }),
      grid([
        selectField({ id:'unitConsumerType', label:'Verbraucher hinzufügen', value:s.unitConsumerType, options:consumerOptions() }),
        field({ id:'unitCount', label:'Anzahl', value:fmtInput(s.unitCount,0), inputmode:'numeric' }),
        field({ id:'unitSimultaneityFactor', label:'GL der Nutzungseinheit', value:s.unitSimultaneityFactor || '', placeholder:'optional < 1,0', inputmode:'decimal' })
      ].join(''), 3),
      '<button type="button" class="action-button action-button--secondary" data-dw-draft-add="unit">Verbraucher zur Nutzungseinheit hinzufügen</button>',
      `<div data-dw-unit-draft>${draftConsumerList(s.unitDraftConsumers || [], 'unit')}</div>`,
      `<div class="tc-save-actions"><button type="button" class="action-button" data-dw-add-unit ${s.activeUnitId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-dw-update-unit ${s.activeUnitId ? '' : 'disabled'}>Aktualisieren</button></div>`,
      '</div></details>',
      `<details class="tc-accordion dw-accordion dw-accordion--saved" data-dw-accordion="uiUnitSavedOpen" ${s.uiUnitSavedOpen ? 'open' : ''}><summary><span><strong>Gespeicherte Nutzungseinheiten</strong><small data-dw-unit-summary>${r.usageUnits.length} Nutzungseinheiten angelegt</small></span></summary><div class="tc-accordion__body dw-accordion__body" data-dw-unit-saved>${unitRows(r.usageUnits)}</div></details>`
    ].join('')), 'blue'),
    card('Einzelverbraucher außerhalb NE', stack([
      `<details class="tc-accordion dw-accordion dw-accordion--form" data-dw-accordion="uiSingleFormOpen" ${s.uiSingleFormOpen ? 'open' : ''}><summary><span><strong>Freie Einrichtungsgegenstände zusammenstellen</strong><small>Mehrere Verbraucher außerhalb einer Nutzungseinheit als Gruppe anlegen</small></span></summary><div class="tc-accordion__body dw-accordion__body">`,
      field({ id:'singleName', label:'Bezeichnung / Gruppe', value:s.singleName, placeholder:'z. B. WC EG', inputmode:'text' }),
      grid([
        selectField({ id:'singleConsumerType', label:'Verbraucher hinzufügen', value:s.singleConsumerType, options:consumerOptions() }),
        field({ id:'singleCount', label:'Anzahl', value:fmtInput(s.singleCount,0), inputmode:'numeric' })
      ].join(''), 2),
      segmented('singlePermanent', [
        { value:'false', label:'Kurzzeitverbraucher' },
        { value:'true', label:'Dauerverbraucher > 15 min' }
      ], String(s.singlePermanent), { accent:'blue' }),
      '<button type="button" class="action-button action-button--secondary" data-dw-draft-add="single">Verbraucher zur Gruppe hinzufügen</button>',
      `<div data-dw-single-draft>${draftConsumerList(s.singleDraftConsumers || [], 'single')}</div>`,
      `<div class="tc-save-actions"><button type="button" class="action-button" data-dw-add-single ${s.activeSingleId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-dw-update-single ${s.activeSingleId ? '' : 'disabled'}>Aktualisieren</button></div>`,
      '</div></details>',
      `<details class="tc-accordion dw-accordion dw-accordion--saved" data-dw-accordion="uiSingleSavedOpen" ${s.uiSingleSavedOpen ? 'open' : ''}><summary><span><strong>Gespeicherte Einzelverbraucher</strong><small data-dw-single-summary>${r.singleGroups.length} Gruppen außerhalb NE</small></span></summary><div class="tc-accordion__body dw-accordion__body" data-dw-single-saved>${singleRows(r.singleGroups)}</div></details>`
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
    card('Hinweis', `<div class="tc-note dw-note">Dauerverbraucher werden zum nach Gleichzeitigkeit ermittelten Spitzendurchfluss addiert. Bei zentraler Warmwasserbereitung werden TWW-Zapfstellen zusätzlich berücksichtigt. Bei dezentraler Warmwasserbereitung werden TWW-Verbraucher mit 0,05 l/s für die Warmwasserbereitung angesetzt. 3-Liter-Regel, Probenahmestellen und hygienische Anforderungen sind separat zu prüfen.</div>`, 'blue', { compact:true })
  ].join(''));
}

function view(s) {
  const r = calculate(s);
  return renderModuleShell(config, `
    <div class="span-6" data-dw-input>${inputCard(s, r)}</div>
    <div class="span-6" data-dw-result>${resultCard(r)}</div>
  `);
}

function refresh(root) {
  const s = state.get();
  const r = calculate(s);
  const result = root.querySelector('[data-dw-result]');
  if (result) safeReplaceContent(result, resultCard(r));
  const unitDraft = root.querySelector('[data-dw-unit-draft]');
  if (unitDraft) safeReplaceContent(unitDraft, draftConsumerList(s.unitDraftConsumers || [], 'unit')); 
  const singleDraft = root.querySelector('[data-dw-single-draft]');
  if (singleDraft) safeReplaceContent(singleDraft, draftConsumerList(s.singleDraftConsumers || [], 'single')); 
  const unitSaved = root.querySelector('[data-dw-unit-saved]');
  if (unitSaved) safeReplaceContent(unitSaved, unitRows(r.usageUnits));
  const singleSaved = root.querySelector('[data-dw-single-saved]');
  if (singleSaved) safeReplaceContent(singleSaved, singleRows(r.singleGroups));
  const unitSummary = root.querySelector('[data-dw-unit-summary]');
  if (unitSummary) unitSummary.textContent = `${r.usageUnits.length} Nutzungseinheiten angelegt`;
  const singleSummary = root.querySelector('[data-dw-single-summary]');
  if (singleSummary) singleSummary.textContent = `${r.singleGroups.length} Gruppen außerhalb NE`;
}

function rerender(root) {
  safeReplaceContent(root, view(state.get()));
}

function draftKey(type) {
  return type === 'unit' ? 'unitDraftConsumers' : 'singleDraftConsumers';
}

function addDraftConsumer(type) {
  const s = state.get();
  if (type === 'unit') {
    state.set({
      unitDraftConsumers: [...(s.unitDraftConsumers || []), createConsumer({ typeId:s.unitConsumerType, count:s.unitCount })]
    }, { notify:false });
    return;
  }
  state.set({
    singleDraftConsumers: [...(s.singleDraftConsumers || []), createConsumer({ typeId:s.singleConsumerType, count:s.singleCount, permanent:String(s.singlePermanent)==='true' })]
  }, { notify:false });
}

function removeDraftConsumer(type, index) {
  const key = draftKey(type);
  const next = [...(state.get()[key] || [])];
  next.splice(Number(index), 1);
  state.set({ [key]: next }, { notify:false });
}

function updateDraftCount(type, index, value) {
  const key = draftKey(type);
  const next = [...(state.get()[key] || [])];
  const i = Number(index);
  if (next[i]) next[i] = { ...next[i], count: Math.max(0, Number(value || 0)) };
  state.set({ [key]: next }, { notify:false });
}

function draftOrCurrentUnitConsumers(s) {
  const consumers = [...(s.unitDraftConsumers || [])];
  if (!consumers.length) consumers.push(createConsumer({ typeId:s.unitConsumerType, count:s.unitCount }));
  return consumers;
}

function draftOrCurrentSingleConsumers(s) {
  const permanent = String(s.singlePermanent) === 'true';
  const consumers = [...(s.singleDraftConsumers || [])];
  if (!consumers.length) consumers.push(createConsumer({ typeId:s.singleConsumerType, count:s.singleCount, permanent }));
  return consumers.map(c => ({ ...c, permanent }));
}

function saveUnit(root, update = false) {
  const s = state.get();
  if (update && !s.activeUnitId) return;
  const record = createUsageUnit({
    name:s.unitName,
    consumers:draftOrCurrentUnitConsumers(s),
    simultaneityFactor:s.unitSimultaneityFactor
  });
  const units = readUsageUnits();
  if (update) {
    record.id = s.activeUnitId;
    writeUsageUnits(units.map(item => isSameId(item.id, s.activeUnitId) ? record : item));
  } else {
    writeUsageUnits([...units, record]);
  }
  state.set({
    unitDraftConsumers: [],
    activeUnitId: update ? s.activeUnitId : null,
    activeSingleId:null,
    unitName: update ? s.unitName : '',
    unitSimultaneityFactor: update ? s.unitSimultaneityFactor : '',
    uiUnitFormOpen:true,
    uiUnitSavedOpen:true
  }, { notify:false });
  rerender(root);
}

function saveSingle(root, update = false) {
  const s = state.get();
  if (update && !s.activeSingleId) return;
  const record = createSingleGroup({
    name:s.singleName || 'Einzelverbraucher',
    consumers:draftOrCurrentSingleConsumers(s)
  });
  const groups = readSingleConsumers();
  if (update) {
    record.id = s.activeSingleId;
    writeSingleConsumers(groups.map(item => isSameId(item.id, s.activeSingleId) ? record : item));
  } else {
    writeSingleConsumers([...groups, record]);
  }
  state.set({
    singleDraftConsumers: [],
    activeUnitId:null,
    activeSingleId: update ? s.activeSingleId : null,
    singleName: update ? s.singleName : '',
    uiSingleFormOpen:true,
    uiSingleSavedOpen:true
  }, { notify:false });
  rerender(root);
}

function deleteUnit(root, id) {
  writeUsageUnits(readUsageUnits().filter(item => !isSameId(item.id, id)));
  if (isSameId(state.get().activeUnitId, id)) {
    state.set({ activeUnitId:null, unitName:'', unitSimultaneityFactor:'', unitDraftConsumers:[] }, { notify:false });
  }
  rerender(root);
}

function deleteSingle(root, id) {
  writeSingleConsumers(readSingleConsumers().filter(item => !isSameId(item.id, id)));
  if (isSameId(state.get().activeSingleId, id)) {
    state.set({ activeSingleId:null, singleName:'', singleDraftConsumers:[] }, { notify:false });
  }
  rerender(root);
}

function editUnit(root, id) {
  const unit = readUsageUnits().find(item => isSameId(item.id, id));
  if (!unit) return;
  state.set({
    activeUnitId:unit.id,
    activeSingleId:null,
    unitName:unit.name,
    unitSimultaneityFactor:unit.simultaneityFactor || '',
    singleName:'',
    unitDraftConsumers:unit.consumers || [],
    singleDraftConsumers:[],
    uiUnitFormOpen:true,
    uiUnitSavedOpen:true
  }, { notify:false });
  rerender(root);
}

function editSingle(root, id) {
  const group = readSingleConsumers().map(normalizeSingleGroupForEdit).filter(Boolean).find(item => isSameId(item.id, id));
  if (!group) return;
  const consumers = (group.consumers || []).map(c => ({ ...c }));
  state.set({
    activeUnitId:null,
    activeSingleId:group.id,
    unitName:'',
    unitDraftConsumers:[],
    singleName:group.name,
    singleDraftConsumers:consumers,
    singlePermanent:String(consumers.some(c => c.permanent)),
    uiSingleFormOpen:true,
    uiSingleSavedOpen:true
  }, { notify:false });
  rerender(root);
}

function clearActiveEdit(root) {
  const current = state.get();
  if (!current.activeUnitId && !current.activeSingleId) return;
  state.set({
    activeUnitId:null,
    activeSingleId:null,
    unitName:'',
    unitSimultaneityFactor:'',
    singleName:'',
    unitDraftConsumers:[],
    singleDraftConsumers:[]
  }, { notify:false });
  rerender(root);
}

function bindDrinkingWater(root, signal) {
  root.addEventListener('input', event => {
    const el = event.target.closest('[data-field]');
    if (!el || !root.contains(el)) return;
    state.set({ [el.dataset.field]: el.value }, { notify:false });
  }, { signal });

  root.addEventListener('change', event => {
    const field = event.target.closest('[data-field]');
    if (field && root.contains(field)) {
      state.set({ [field.dataset.field]: field.value }, { notify:false });
      refresh(root);
      return;
    }

    const draftCount = event.target.closest('[data-dw-draft-count]');
    if (draftCount && root.contains(draftCount)) {
      updateDraftCount(draftCount.dataset.dwDraftCount, draftCount.dataset.index, draftCount.value);
      refresh(root);
    }
  }, { signal });

  root.addEventListener('keydown', event => {
    const field = event.target.closest('[data-field]');
    if (!field || !root.contains(field) || event.key !== 'Enter') return;
    event.preventDefault();
    state.set({ [field.dataset.field]: field.value }, { notify:false });
    refresh(root);
  }, { signal });

  root.addEventListener('pointerdown', event => {
    const ignored = event.target.closest('[data-field], input, select, textarea, button, a, summary, details, [role="button"], [data-line-card], .segmented');
    if (ignored) return;
    refresh(root);
  }, { capture:true, signal });

  root.addEventListener('click', event => {
    const target = event.target;

    const toggle = target.closest('[data-line-toggle]');
    if (toggle && root.contains(toggle)) {
      event.preventDefault();
      event.stopPropagation();
      const card = toggle.closest('[data-line-card]');
      const collapsed = card?.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      return;
    }

    const removeDraft = target.closest('[data-dw-remove-draft]');
    if (removeDraft && root.contains(removeDraft)) {
      event.preventDefault();
      event.stopPropagation();
      removeDraftConsumer(removeDraft.dataset.dwRemoveDraft, removeDraft.dataset.index);
      refresh(root);
      return;
    }

    const draftAdd = target.closest('[data-dw-draft-add]');
    if (draftAdd && root.contains(draftAdd)) {
      event.preventDefault();
      event.stopPropagation();
      addDraftConsumer(draftAdd.dataset.dwDraftAdd);
      refresh(root);
      return;
    }

    const addUnit = target.closest('[data-dw-add-unit]');
    if (addUnit && root.contains(addUnit)) { event.preventDefault(); event.stopPropagation(); saveUnit(root, false); return; }

    const updateUnit = target.closest('[data-dw-update-unit]');
    if (updateUnit && root.contains(updateUnit)) { event.preventDefault(); event.stopPropagation(); saveUnit(root, true); return; }

    const addSingle = target.closest('[data-dw-add-single]');
    if (addSingle && root.contains(addSingle)) { event.preventDefault(); event.stopPropagation(); saveSingle(root, false); return; }

    const updateSingle = target.closest('[data-dw-update-single]');
    if (updateSingle && root.contains(updateSingle)) { event.preventDefault(); event.stopPropagation(); saveSingle(root, true); return; }

    const unitDelete = target.closest('[data-dw-unit-delete]');
    if (unitDelete && root.contains(unitDelete)) { event.preventDefault(); event.stopPropagation(); deleteUnit(root, unitDelete.dataset.dwUnitDelete); return; }

    const singleDelete = target.closest('[data-dw-single-delete]');
    if (singleDelete && root.contains(singleDelete)) { event.preventDefault(); event.stopPropagation(); deleteSingle(root, singleDelete.dataset.dwSingleDelete); return; }

    const unitEdit = target.closest('[data-dw-unit-edit]');
    if (unitEdit && root.contains(unitEdit)) { event.preventDefault(); event.stopPropagation(); editUnit(root, unitEdit.dataset.dwUnitEdit); return; }

    const singleEdit = target.closest('[data-dw-single-edit]');
    if (singleEdit && root.contains(singleEdit)) { event.preventDefault(); event.stopPropagation(); editSingle(root, singleEdit.dataset.dwSingleEdit); return; }

    const segment = target.closest('[data-segment]');
    if (segment && root.contains(segment)) {
      event.preventDefault();
      event.stopPropagation();
      state.set({ [segment.dataset.segment]: segment.dataset.value }, { notify:false });
      rerender(root);
      return;
    }

    const ignored = target.closest('[data-dw-unit-edit], [data-dw-single-edit], [data-dw-unit-delete], [data-dw-single-delete], [data-dw-add-unit], [data-dw-update-unit], [data-dw-add-single], [data-dw-update-single], [data-dw-draft-add], [data-dw-remove-draft], [data-dw-draft-count], [data-line-toggle], details, summary, input, select, textarea, button, label, .segmented');
    if (!ignored) {
      refresh(root);
      clearActiveEdit(root);
    }
  }, { signal });
}

export default {
  config,
  schema,
  state,
  mount(root) {
    const controller = new AbortController();
    safeReplaceContent(root, view(state.get()));
    bindDrinkingWater(root, controller.signal);
    return () => controller.abort();
  }
};
