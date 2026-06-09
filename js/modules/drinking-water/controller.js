import { state } from './state.js';
import { calculate, createConsumer, createUsageUnit, createSingleGroup, readUsageUnits, writeUsageUnits, readSingleConsumers, writeSingleConsumers } from './logic.js';
import { isSameId } from '../../core/savedRecords.js';
import { safeReplaceContent } from '../../core/domUpdate.js';
import { createDrinkingWaterViewModel } from './viewModel.js';
import { renderInputCard, renderResultCard, draftConsumerList } from './view.js';

function syncSavedRecordsPatch(patch = {}, action = 'dw:saved-sync') {
  const next = { ...patch };
  if (Object.prototype.hasOwnProperty.call(next, 'savedUsageUnits')) writeUsageUnits(next.savedUsageUnits || []);
  if (Object.prototype.hasOwnProperty.call(next, 'savedSingleConsumers')) writeSingleConsumers(next.savedSingleConsumers || []);
  state.set(next, { action, notify:false });
}

export function normalizeDrinkingWaterSavedState(snapshot = {}) {
  const savedUsageUnits = Array.isArray(snapshot.savedUsageUnits) && snapshot.savedUsageUnits.length ? snapshot.savedUsageUnits : readUsageUnits();
  const savedSingleConsumers = Array.isArray(snapshot.savedSingleConsumers) && snapshot.savedSingleConsumers.length ? snapshot.savedSingleConsumers : readSingleConsumers();
  return { ...snapshot, savedUsageUnits, savedSingleConsumers };
}

export function hydrateDrinkingWaterSavedState() {
  const current = state.get();
  const patch = {};
  if ((!Array.isArray(current.savedUsageUnits) || !current.savedUsageUnits.length) && readUsageUnits().length) patch.savedUsageUnits = readUsageUnits();
  if ((!Array.isArray(current.savedSingleConsumers) || !current.savedSingleConsumers.length) && readSingleConsumers().length) patch.savedSingleConsumers = readSingleConsumers();
  if (Object.keys(patch).length) state.set(patch, { action:'dw:migrate-saved-records', notify:false });
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


function preserveScrollPosition(callback) {
  const scroller = document.scrollingElement || document.documentElement;
  const scrollTop = scroller?.scrollTop ?? window.scrollY ?? 0;
  const scrollLeft = scroller?.scrollLeft ?? window.scrollX ?? 0;
  callback();
  if (scroller) {
    scroller.scrollTop = scrollTop;
    scroller.scrollLeft = scrollLeft;
  } else if (typeof window.scrollTo === 'function') {
    window.scrollTo(scrollLeft, scrollTop);
  }
}

export function refreshDrinkingWater(root) {
  preserveScrollPosition(() => {
    const s = state.get();
    const vm = createDrinkingWaterViewModel(s);
    const result = root.querySelector('[data-dw-dynamic="result"]');
    if (result) safeReplaceContent(result, renderResultCard(vm));
    const input = root.querySelector('[data-dw-dynamic="input"]');
    if (input) safeReplaceContent(input, renderInputCard(vm));
  });
}

function draftKey(type) {
  return type === 'unit' ? 'unitDraftConsumers' : 'singleDraftConsumers';
}

function addDraftConsumer(type) {
  const s = state.get();
  if (type === 'unit') {
    state.set({ unitDraftConsumers: [...(s.unitDraftConsumers || []), createConsumer({ typeId:s.unitConsumerType, count:s.unitCount })] }, { action:'dw:draft-add', notify:false });
    return;
  }
  state.set({ singleDraftConsumers: [...(s.singleDraftConsumers || []), createConsumer({ typeId:s.singleConsumerType, count:s.singleCount, permanent:String(s.singlePermanent)==='true' })] }, { action:'dw:draft-add', notify:false });
}

function removeDraftConsumer(type, index) {
  const key = draftKey(type);
  const next = [...(state.get()[key] || [])];
  next.splice(Number(index), 1);
  state.set({ [key]: next }, { action:'dw:draft-remove', notify:false });
}

function updateDraftCount(type, index, value) {
  const key = draftKey(type);
  const next = [...(state.get()[key] || [])];
  const i = Number(index);
  if (next[i]) next[i] = { ...next[i], count: Math.max(0, Number(value || 0)) };
  state.set({ [key]: next }, { action:'dw:draft-count', notify:false });
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
  const record = createUsageUnit({ name:s.unitName, consumers:draftOrCurrentUnitConsumers(s), simultaneityFactor:s.unitSimultaneityFactor });
  const units = normalizeDrinkingWaterSavedState(state.get()).savedUsageUnits;
  if (update) {
    record.id = s.activeUnitId;
    syncSavedRecordsPatch({ savedUsageUnits: units.map(item => isSameId(item.id, s.activeUnitId) ? record : item) }, 'dw:unit-update');
  } else {
    syncSavedRecordsPatch({ savedUsageUnits: [...units, record] }, 'dw:unit-save');
  }
  state.set({ unitDraftConsumers: [], activeUnitId: update ? s.activeUnitId : null, activeSingleId:null, unitName: update ? s.unitName : '', unitSimultaneityFactor: update ? s.unitSimultaneityFactor : '', uiUnitFormOpen:true, uiUnitSavedOpen:true }, { action:'dw:unit-save', notify:false });
  refreshDrinkingWater(root);
}

function saveSingle(root, update = false) {
  const s = state.get();
  if (update && !s.activeSingleId) return;
  const record = createSingleGroup({ name:s.singleName || 'Einzelverbraucher', consumers:draftOrCurrentSingleConsumers(s) });
  const groups = normalizeDrinkingWaterSavedState(state.get()).savedSingleConsumers;
  if (update) {
    record.id = s.activeSingleId;
    syncSavedRecordsPatch({ savedSingleConsumers: groups.map(item => isSameId(item.id, s.activeSingleId) ? record : item) }, 'dw:single-update');
  } else {
    syncSavedRecordsPatch({ savedSingleConsumers: [...groups, record] }, 'dw:single-save');
  }
  state.set({ singleDraftConsumers: [], activeUnitId:null, activeSingleId: update ? s.activeSingleId : null, singleName: update ? s.singleName : '', uiSingleFormOpen:true, uiSingleSavedOpen:true }, { action:'dw:single-save', notify:false });
  refreshDrinkingWater(root);
}

function deleteUnit(root, id) {
  syncSavedRecordsPatch({ savedUsageUnits: normalizeDrinkingWaterSavedState(state.get()).savedUsageUnits.filter(item => !isSameId(item.id, id)) }, 'dw:unit-delete');
  if (isSameId(state.get().activeUnitId, id)) state.set({ activeUnitId:null, unitName:'', unitSimultaneityFactor:'', unitDraftConsumers:[] }, { action:'dw:unit-delete', notify:false });
  refreshDrinkingWater(root);
}

function deleteSingle(root, id) {
  syncSavedRecordsPatch({ savedSingleConsumers: normalizeDrinkingWaterSavedState(state.get()).savedSingleConsumers.filter(item => !isSameId(item.id, id)) }, 'dw:single-delete');
  if (isSameId(state.get().activeSingleId, id)) state.set({ activeSingleId:null, singleName:'', singleDraftConsumers:[] }, { action:'dw:single-delete', notify:false });
  refreshDrinkingWater(root);
}

function editUnit(root, id) {
  const unit = normalizeDrinkingWaterSavedState(state.get()).savedUsageUnits.find(item => isSameId(item.id, id));
  if (!unit) return;
  state.set({ activeUnitId:unit.id, activeSingleId:null, unitName:unit.name, unitSimultaneityFactor:unit.simultaneityFactor || '', singleName:'', unitDraftConsumers:unit.consumers || [], singleDraftConsumers:[], uiUnitFormOpen:true, uiUnitSavedOpen:true }, { action:'dw:unit-edit', notify:false });
  refreshDrinkingWater(root);
}

function editSingle(root, id) {
  const group = normalizeDrinkingWaterSavedState(state.get()).savedSingleConsumers.map(normalizeSingleGroupForEdit).filter(Boolean).find(item => isSameId(item.id, id));
  if (!group) return;
  const consumers = (group.consumers || []).map(c => ({ ...c }));
  state.set({ activeUnitId:null, activeSingleId:group.id, unitName:'', unitDraftConsumers:[], singleName:group.name, singleDraftConsumers:consumers, singlePermanent:String(consumers.some(c => c.permanent)), uiSingleFormOpen:true, uiSingleSavedOpen:true }, { action:'dw:single-edit', notify:false });
  refreshDrinkingWater(root);
}

function clearActiveEdit(root) {
  const current = state.get();
  if (!current.activeUnitId && !current.activeSingleId) return;
  state.set({ activeUnitId:null, activeSingleId:null, unitName:'', unitSimultaneityFactor:'', singleName:'', unitDraftConsumers:[], singleDraftConsumers:[] }, { action:'dw:clear-active', notify:false });
  refreshDrinkingWater(root);
}

function updateAccordionState(event) {
  const details = event.target.closest?.('[data-dw-accordion]');
  if (!details) return;
  const key = details.dataset.dwAccordion;
  queueMicrotask(() => state.set({ [key]: details.open }, { action:'dw:accordion', notify:false }));
}

export function bindDrinkingWaterActions(root) {
  hydrateDrinkingWaterSavedState();
  if (root.__tcDrinkingWaterActionsBound) return;
  root.__tcDrinkingWaterActionsBound = true;
  root.addEventListener('input', event => {
    const el = event.target.closest('[data-field]');
    if (!el || !root.contains(el)) return;
    state.set({ [el.dataset.field]: el.value }, { action:'dw:input', notify:false });
  });

  root.addEventListener('change', event => {
    const draftCount = event.target.closest('[data-dw-draft-count]');
    if (draftCount && root.contains(draftCount)) {
      updateDraftCount(draftCount.dataset.dwDraftCount, draftCount.dataset.index, draftCount.value);
      refreshDrinkingWater(root);
      return;
    }
    const field = event.target.closest('[data-field]');
    if (field && root.contains(field)) {
      state.set({ [field.dataset.field]: field.value }, { action:'dw:change', notify:false });
      refreshDrinkingWater(root);
      return;
    }
    updateAccordionState(event);
  });

  root.addEventListener('toggle', updateAccordionState, true);

  root.addEventListener('keydown', event => {
    const field = event.target.closest('[data-field]');
    if (!field || !root.contains(field) || event.key !== 'Enter') return;
    event.preventDefault();
    state.set({ [field.dataset.field]: field.value }, { action:'dw:enter', notify:false });
    refreshDrinkingWater(root);
  });

  root.addEventListener('click', event => {
    const target = event.target;
    const unitToggle = target.closest('[data-dw-toggle-unit]');
    if (unitToggle && root.contains(unitToggle)) { event.preventDefault(); event.stopPropagation(); const id = unitToggle.dataset.dwToggleUnit; state.set({ expandedUnitId: isSameId(state.get().expandedUnitId, id) ? null : id }, { action:'dw:unit-toggle', notify:false }); refreshDrinkingWater(root); return; }
    const singleToggle = target.closest('[data-dw-toggle-single]');
    if (singleToggle && root.contains(singleToggle)) { event.preventDefault(); event.stopPropagation(); const id = singleToggle.dataset.dwToggleSingle; state.set({ expandedSingleId: isSameId(state.get().expandedSingleId, id) ? null : id }, { action:'dw:single-toggle', notify:false }); refreshDrinkingWater(root); return; }

    const removeDraft = target.closest('[data-dw-remove-draft]');
    if (removeDraft && root.contains(removeDraft)) { event.preventDefault(); event.stopPropagation(); removeDraftConsumer(removeDraft.dataset.dwRemoveDraft, removeDraft.dataset.index); refreshDrinkingWater(root); return; }
    const draftAdd = target.closest('[data-dw-draft-add]');
    if (draftAdd && root.contains(draftAdd)) { event.preventDefault(); event.stopPropagation(); addDraftConsumer(draftAdd.dataset.dwDraftAdd); refreshDrinkingWater(root); return; }
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
    if (segment && root.contains(segment)) { event.preventDefault(); event.stopPropagation(); state.set({ [segment.dataset.segment]: segment.dataset.value }, { action:'dw:segment', notify:false }); refreshDrinkingWater(root); return; }

    const ignored = target.closest('[data-dw-unit-edit], [data-dw-single-edit], [data-dw-unit-delete], [data-dw-single-delete], [data-dw-add-unit], [data-dw-update-unit], [data-dw-add-single], [data-dw-update-single], [data-dw-draft-add], [data-dw-remove-draft], [data-dw-draft-count], [data-line-toggle], details, summary, input, select, textarea, button, label, .segmented');
    if (!ignored) {
      refreshDrinkingWater(root);
      clearActiveEdit(root);
    }
  });
}

export default bindDrinkingWaterActions;
