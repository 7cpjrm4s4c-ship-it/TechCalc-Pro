import config from './config.js';
import { state } from './state.js';
import { calculate, CONSUMERS, BUILDING_TYPES, createConsumer, createUsageUnit, createSingleGroup, readUsageUnits, writeUsageUnits, readSingleConsumers, writeSingleConsumers } from './logic.js';
import { card, field, selectField, segmented, renderModuleShell, stack, grid, inlineStats, mainResult, esc } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { isSameId } from '../../core/savedRecords.js';

function fieldSelector(key) {
  const safe = String(key || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `[data-field="${safe}"]`;
}

function segmentSelector(key) {
  const safe = String(key || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `[data-segment="${safe}"]`;
}

function consumerOptions() {
  return CONSUMERS.map(c => ({ value: c.id, label: `${c.label} · ${fmt(c.vr, 2)} l/s${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}` }));
}

function draftConsumerList(items, type) {
  if (!items?.length) return '<div class="empty-state empty-state--compact">Noch keine Verbraucher ausgewählt</div>';
  return `<div class="dw-consumer-list">${items.map((c, index) => `<div class="dw-consumer-row dw-consumer-row--editable">
    <div><strong>${esc(c.label)}</strong><span>${fmt(c.vr * c.count, 2)} l/s gesamt · ${fmt(c.vr, 2)} l/s je Verbraucher${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}${c.permanent ? ' · Dauerverbraucher' : ''}</span></div>
    <label class="mini-edit-field"><span>Anzahl</span><input type="number" min="0" step="1" value="${esc(c.count)}" data-dw-draft-count="${esc(type)}" data-index="${index}" inputmode="numeric"></label>
    <button type="button" data-dw-remove-draft="${esc(type)}" data-index="${index}" aria-label="Verbraucher entfernen">×</button>
  </div>`).join('')}</div>`;
}

function consumerRows(consumers = []) {
  return `<div class="dw-consumer-list">${consumers.map(c => `<div class="dw-consumer-row"><div><strong>${esc(c.count)} × ${esc(c.label)}</strong><span>${fmt(c.vr * c.count, 2)} l/s gesamt · ${fmt(c.vr,2)} l/s je Verbraucher${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}${c.permanent ? ' · Dauerverbraucher' : ''}</span></div></div>`).join('')}</div>`;
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
        { label:'Ansatz', value:'2 größte Entnahmestellen' }
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
  return `<div class="dw-fixture-list dw-fixture-list--plain">${rows.map(item => `<div class="dw-fixture-row"><strong>${esc(item.count)} × ${esc(item.label)}</strong>${item.permanent ? '<em>Dauerverbraucher</em>' : ''}</div>`).join('')}</div>`;
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
        { label:'Warmwasser', value:r.centralWarmWater ? 'TWW-Zapfstellen werden mitgerechnet' : 'Dezentral, Warmwasserbereitung mit 0,05 l/s je TWW-Verbraucher' }
      ])
    ].join('')), 'blue'),
    card('Nutzungseinheiten', stack([
      `<details class="dw-accordion dw-accordion--form" data-dw-accordion="uiUnitFormOpen" ${s.uiUnitFormOpen ? 'open' : ''}><summary><span><strong>Nutzungseinheit zusammenstellen</strong><small>Mehrere Verbraucher auswählen und anschließend als NE speichern</small></span></summary><div class="dw-accordion__body">`,
      field({ id:'unitName', label:'Bezeichnung', value:s.unitName, placeholder:'z. B. Bad Wohnung 1', inputmode:'text' }),
      grid([
        selectField({ id:'unitConsumerType', label:'Verbraucher hinzufügen', value:s.unitConsumerType, options:consumerOptions() }),
        field({ id:'unitCount', label:'Anzahl', value:fmtInput(s.unitCount,0), inputmode:'numeric' })
      ].join(''), 2),
      '<button type="button" class="action-button action-button--secondary" data-dw-draft-add="unit">Verbraucher zur Nutzungseinheit hinzufügen</button>',
      `<div data-dw-unit-draft>${draftConsumerList(s.unitDraftConsumers || [], 'unit')}</div>`,
      `<div class="tc-save-actions"><button type="button" class="action-button" data-dw-add-unit ${s.activeUnitId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-dw-update-unit ${s.activeUnitId ? '' : 'disabled'}>Aktualisieren</button></div>`,
      '</div></details>',
      `<details class="dw-accordion dw-accordion--saved" data-dw-accordion="uiUnitSavedOpen" ${s.uiUnitSavedOpen ? 'open' : ''}><summary><span><strong>Gespeicherte Nutzungseinheiten</strong><small data-dw-unit-summary>${r.usageUnits.length} Nutzungseinheiten angelegt</small></span></summary><div class="dw-accordion__body" data-dw-unit-saved>${unitRows(r.usageUnits)}</div></details>`
    ].join('')), 'blue'),
    card('Einzelverbraucher außerhalb NE', stack([
      `<details class="dw-accordion dw-accordion--form" data-dw-accordion="uiSingleFormOpen" ${s.uiSingleFormOpen ? 'open' : ''}><summary><span><strong>Freie Einrichtungsgegenstände zusammenstellen</strong><small>Mehrere Verbraucher außerhalb einer Nutzungseinheit als Gruppe anlegen</small></span></summary><div class="dw-accordion__body">`,
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
      `<details class="dw-accordion dw-accordion--saved" data-dw-accordion="uiSingleSavedOpen" ${s.uiSingleSavedOpen ? 'open' : ''}><summary><span><strong>Gespeicherte Einzelverbraucher</strong><small data-dw-single-summary>${r.singleGroups.length} Gruppen außerhalb NE</small></span></summary><div class="dw-accordion__body" data-dw-single-saved>${singleRows(r.singleGroups)}</div></details>`
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
    card('Hinweis', `<div class="dw-note">Dauerverbraucher werden zum nach Gleichzeitigkeit ermittelten Spitzendurchfluss addiert. Bei zentraler Warmwasserbereitung werden TWW-Zapfstellen zusätzlich berücksichtigt. Bei dezentraler Warmwasserbereitung werden TWW-Verbraucher mit 0,05 l/s für die Warmwasserbereitung angesetzt. 3-Liter-Regel, Probenahmestellen und hygienische Anforderungen sind separat zu prüfen.</div>`, 'blue', { compact:true })
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
  if (result) result.innerHTML = resultCard(r);
  const unitDraft = root.querySelector('[data-dw-unit-draft]');
  if (unitDraft) unitDraft.innerHTML = draftConsumerList(s.unitDraftConsumers || [], 'unit');
  const singleDraft = root.querySelector('[data-dw-single-draft]');
  if (singleDraft) singleDraft.innerHTML = draftConsumerList(s.singleDraftConsumers || [], 'single');
  const unitSaved = root.querySelector('[data-dw-unit-saved]');
  if (unitSaved) unitSaved.innerHTML = unitRows(r.usageUnits);
  const singleSaved = root.querySelector('[data-dw-single-saved]');
  if (singleSaved) singleSaved.innerHTML = singleRows(r.singleGroups);
  const unitSummary = root.querySelector('[data-dw-unit-summary]');
  if (unitSummary) unitSummary.textContent = `${r.usageUnits.length} Nutzungseinheiten angelegt`;
  const singleSummary = root.querySelector('[data-dw-single-summary]');
  if (singleSummary) singleSummary.textContent = `${r.singleGroups.length} Gruppen außerhalb NE`;
}

function syncFieldValues(root, patch) {
  Object.entries(patch).forEach(([key, value]) => {
    root.querySelectorAll(fieldSelector(key)).forEach(el => { el.value = value ?? ''; });
    root.querySelectorAll(segmentSelector(key)).forEach(btn => btn.classList.toggle('is-active', btn.dataset.value === String(value)));
  });
}

function bindDrinkingWater(root, signal) {
  root.addEventListener('input', event => {
    const el = event.target.closest('[data-field]');
    if (!el || !root.contains(el)) return;
    state.set({ [el.dataset.field]: el.value }, { notify:false });
  }, { signal });

  root.addEventListener('change', event => {
    const removeDraft = event.target.closest('[data-dw-remove-draft]');
    if (removeDraft && root.contains(removeDraft)) {
      const s = state.get();
      const key = removeDraft.dataset.dwRemoveDraft === 'unit' ? 'unitDraftConsumers' : 'singleDraftConsumers';
      const next = [...(s[key] || [])];
      next.splice(Number(removeDraft.dataset.index), 1);
      state.set({ [key]: next }, { notify:false });
      refresh(root);
      return;
    }

    if (event.target.closest('[data-dw-add-unit]')) {
      const s = state.get();
      const consumers = [...(s.unitDraftConsumers || [])];
      if (!consumers.length) consumers.push(createConsumer({ typeId:s.unitConsumerType, count:s.unitCount }));
      const units = readUsageUnits();
      const record = createUsageUnit({ name:s.unitName, consumers });
      writeUsageUnits([...units, record]);
      state.set({ unitDraftConsumers: [], activeUnitId:null, unitName:'', uiUnitFormOpen:true, uiUnitSavedOpen:true }, { notify:false });
      root.innerHTML = view(state.get());
      return;
    }

    if (event.target.closest('[data-dw-update-unit]')) {
      const s = state.get();
      if (!s.activeUnitId) return;
      const consumers = [...(s.unitDraftConsumers || [])];
      if (!consumers.length) consumers.push(createConsumer({ typeId:s.unitConsumerType, count:s.unitCount }));
      const units = readUsageUnits();
      const record = createUsageUnit({ name:s.unitName, consumers });
      record.id = s.activeUnitId;
      writeUsageUnits(units.map(item => isSameId(item.id, s.activeUnitId) ? record : item));
      state.set({ activeUnitId:s.activeUnitId, uiUnitFormOpen:true, uiUnitSavedOpen:true }, { notify:false });
      root.innerHTML = view(state.get());
      return;
    }

    if (event.target.closest('[data-dw-add-single]')) {
      const s = state.get();
      const draft = [...(s.singleDraftConsumers || [])];
      if (!draft.length) draft.push(createConsumer({ typeId:s.singleConsumerType, count:s.singleCount, permanent:String(s.singlePermanent)==='true' }));
      const groups = readSingleConsumers();
      const record = createSingleGroup({ name:s.singleName || 'Einzelverbraucher', consumers: draft.map(c => ({ ...c, permanent:String(s.singlePermanent)==='true' })) });
      writeSingleConsumers([...groups, record]);
      state.set({ singleDraftConsumers: [], activeSingleId:null, singleName:'', uiSingleFormOpen:true, uiSingleSavedOpen:true }, { notify:false });
      root.innerHTML = view(state.get());
      return;
    }

    if (event.target.closest('[data-dw-update-single]')) {
      const s = state.get();
      if (!s.activeSingleId) return;
      const draft = [...(s.singleDraftConsumers || [])];
      if (!draft.length) draft.push(createConsumer({ typeId:s.singleConsumerType, count:s.singleCount, permanent:String(s.singlePermanent)==='true' }));
      const groups = readSingleConsumers();
      const record = createSingleGroup({ name:s.singleName || 'Einzelverbraucher', consumers: draft.map(c => ({ ...c, permanent:String(s.singlePermanent)==='true' })) });
      record.id = s.activeSingleId;
      writeSingleConsumers(groups.map(item => isSameId(item.id, s.activeSingleId) ? record : item));
      state.set({ activeSingleId:s.activeSingleId, uiSingleFormOpen:true, uiSingleSavedOpen:true }, { notify:false });
      root.innerHTML = view(state.get());
      return;
    }

    const unitDelete = event.target.closest('[data-dw-unit-delete]');
    if (unitDelete && root.contains(unitDelete)) {
      event.preventDefault(); event.stopPropagation();
      writeUsageUnits(readUsageUnits().filter(item => item.id !== unitDelete.dataset.dwUnitDelete));
      if (isSameId(state.get().activeUnitId, unitDelete.dataset.dwUnitDelete)) state.set({ activeUnitId:null, unitName:'', unitDraftConsumers:[] }, { notify:false });
      root.innerHTML = view(state.get());
      return;
    }

    const singleDelete = event.target.closest('[data-dw-single-delete]');
    if (singleDelete && root.contains(singleDelete)) {
      event.preventDefault(); event.stopPropagation();
      writeSingleConsumers(readSingleConsumers().filter(item => item.id !== singleDelete.dataset.dwSingleDelete));
      if (isSameId(state.get().activeSingleId, singleDelete.dataset.dwSingleDelete)) state.set({ activeSingleId:null, singleName:'', singleDraftConsumers:[] }, { notify:false });
      root.innerHTML = view(state.get());
      return;
    }

    const unitEdit = event.target.closest('[data-dw-unit-edit]');
    if (unitEdit && root.contains(unitEdit)) {
      event.preventDefault(); event.stopPropagation();
      const units = readUsageUnits();
      const unit = units.find(item => isSameId(item.id, unitEdit.dataset.dwUnitEdit));
      if (unit) {
        const patch = { activeUnitId: unit.id, unitName: unit.name, unitDraftConsumers: unit.consumers || [], uiUnitFormOpen:true, uiUnitSavedOpen:true };
        state.set(patch, { notify:false });
        syncFieldValues(root, patch);
        const details = root.querySelector('[data-dw-accordion="uiUnitFormOpen"]');
        if (details) details.open = true;
        root.innerHTML = view(state.get());
      }
      return;
    }

    const singleEdit = event.target.closest('[data-dw-single-edit]');
    if (singleEdit && root.contains(singleEdit)) {
      event.preventDefault(); event.stopPropagation();
      const groups = readSingleConsumers().map(normalizeSingleGroupForEdit).filter(Boolean);
      const group = groups.find(item => isSameId(item.id, singleEdit.dataset.dwSingleEdit));
      if (group) {
        const consumers = (group.consumers || []).map(c => ({ ...c }));
        const patch = {
          activeSingleId: group.id,
          singleName: group.name,
          singleDraftConsumers: consumers,
          singlePermanent: String(consumers.some(c => c.permanent)),
          uiSingleFormOpen:true,
          uiSingleSavedOpen:true
        };
        state.set(patch, { notify:false });
        syncFieldValues(root, patch);
        const details = root.querySelector('[data-dw-accordion="uiSingleFormOpen"]');
        if (details) details.open = true;
        root.innerHTML = view(state.get());
      }
      return;
    }


    const current = state.get();
    const ignored = event.target.closest('[data-dw-unit-edit], [data-dw-single-edit], [data-dw-unit-delete], [data-dw-single-delete], [data-dw-add-unit], [data-dw-update-unit], [data-dw-add-single], [data-dw-update-single], [data-dw-draft-add], [data-dw-remove-draft], [data-dw-draft-count], details, summary, input, select, textarea, button, label, .segmented');
    if (!ignored && (current.activeUnitId || current.activeSingleId)) {
      state.set({ activeUnitId:null, activeSingleId:null, unitName:'', singleName:'', unitDraftConsumers:[], singleDraftConsumers:[] }, { notify:false });
      root.innerHTML = view(state.get());
    }
  }, { signal });
}

export default {
  config,
  state,
  mount(root) {
    const controller = new AbortController();
    root.innerHTML = view(state.get());
    bindDrinkingWater(root, controller.signal);
    return () => controller.abort();
  }
};
