import { state } from './state.js';
import { calculate, createConsumer, createUsageUnit, createSingleGroup, readUsageUnits, writeUsageUnits, readSingleConsumers, writeSingleConsumers } from './logic.js';
import { isSameId } from '../../core/savedRecords.js';
import { safeReplaceContent } from '../../core/domUpdate.js';
import { createDrinkingWaterViewModel } from './viewModel.js';
import { renderInputCard, renderResultCard, draftConsumerList } from './view.js';
import { runWithoutScrollJump } from '../../core/scrollManager.js';
import { handlePlatformFieldNavigation } from '../../core/focusManager.js';


function commitVisibleFields(root) {
  if (!root?.querySelectorAll) return;
  const patch = {};
  root.querySelectorAll('[data-field]').forEach(el => {
    if (el?.dataset?.field) patch[el.dataset.field] = el.value;
  });
  if (Object.keys(patch).length) state.set(patch, { action:'dw:commit-visible-fields', notify:false });
}

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




function commitWaterHeatingModeSegment(root, segment, event = null) {
  if (!segment || !root?.contains?.(segment)) return false;
  if (segment.dataset.segment !== 'waterHeatingMode') return false;
  const value = segment.dataset.value === 'decentral' ? 'decentral' : 'central';
  const current = state.get();
  if (String(current.waterHeatingMode || 'central') === value) {
    root.querySelectorAll('[data-segment="waterHeatingMode"]').forEach(button => {
      const selected = String(button.dataset.value) === value;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    return true;
  }

  event?.preventDefault?.();
  event?.stopPropagation?.();
  event?.stopImmediatePropagation?.();

  root.querySelectorAll('[data-segment="waterHeatingMode"]').forEach(button => {
    const selected = String(button.dataset.value) === value;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', String(selected));
  });

  state.set({ waterHeatingMode: value }, { action:'platform:segment:waterHeatingMode', notify:false });
  refreshDrinkingWater(root);
  queueMicrotask?.(() => refreshDrinkingWater(root));
  setTimeout(() => refreshDrinkingWater(root), 0);
  return true;
}

function installWaterHeatingModeSegmentBridge(root) {
  if (!root || root.__tcDrinkingWaterWaterHeatingSegmentBound) return;
  root.__tcDrinkingWaterWaterHeatingSegmentBound = true;
  const direct = event => {
    const segment = event.target?.closest?.('[data-segment="waterHeatingMode"]');
    if (!segment || !root.contains(segment)) return;
    commitWaterHeatingModeSegment(root, segment, event);
  };
  root.addEventListener('pointerdown', direct, true);
  root.addEventListener('touchstart', direct, { capture:true, passive:false });
}

function releaseKeyboardNavigationLock(root, delay = 120) {
  if (typeof document === 'undefined') return;
  const release = () => {
    const active = document.activeElement;
    const activeField = active?.matches?.('input[data-field], textarea[data-field]') && root?.contains?.(active);
    if (!activeField) document.body?.classList?.remove('tc-keyboard-open');
  };
  if (delay > 0) setTimeout(release, delay);
  else release();
}

function installNavigationPersistenceGuard(root) {
  if (!root || root.__tcDrinkingWaterNavPersistenceBound) return;
  root.__tcDrinkingWaterNavPersistenceBound = true;

  const scheduleRelease = () => {
    releaseKeyboardNavigationLock(root, 80);
    releaseKeyboardNavigationLock(root, 240);
    releaseKeyboardNavigationLock(root, 520);
  };

  root.addEventListener('focusout', event => {
    if (!event.target?.closest?.('input[data-field], textarea[data-field]')) return;
    scheduleRelease();
  }, true);

  root.addEventListener('blur', event => {
    if (!event.target?.closest?.('input[data-field], textarea[data-field]')) return;
    scheduleRelease();
  }, true);

  root.addEventListener('change', event => {
    if (!event.target?.closest?.('input[data-field], textarea[data-field]')) return;
    scheduleRelease();
  }, true);

  root.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    if (!event.target?.closest?.('input[data-field], textarea[data-field]')) return;
    scheduleRelease();
  }, true);

  const viewport = typeof window !== 'undefined' ? window.visualViewport : null;
  if (viewport && !root.__tcDrinkingWaterVisualViewportGuardBound) {
    root.__tcDrinkingWaterVisualViewportGuardBound = true;
    viewport.addEventListener('resize', scheduleRelease, { passive: true });
    viewport.addEventListener('scroll', scheduleRelease, { passive: true });
  }
}

function preserveScrollPosition(callback) {
  return runWithoutScrollJump(callback, { frames: 2, delays: [40, 120] });
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
  releaseKeyboardNavigationLock(root, 0);
  releaseKeyboardNavigationLock(root, 180);
}

function draftKey(type) {
  return type === 'unit' ? 'unitDraftConsumers' : 'singleDraftConsumers';
}

function addDraftConsumer(type, root = null) {
  commitVisibleFields(root);
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
  return runWithoutScrollJump(() => {
  commitVisibleFields(root);
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
  }, { frames: 10, delays: [0, 40, 120, 260, 520] });
}

function saveSingle(root, update = false) {
  return runWithoutScrollJump(() => {
  commitVisibleFields(root);
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
  }, { frames: 10, delays: [0, 40, 120, 260, 520] });
}

function deleteUnit(root, id) {
  return runWithoutScrollJump(() => {
  syncSavedRecordsPatch({ savedUsageUnits: normalizeDrinkingWaterSavedState(state.get()).savedUsageUnits.filter(item => !isSameId(item.id, id)) }, 'dw:unit-delete');
  if (isSameId(state.get().activeUnitId, id)) state.set({ activeUnitId:null, unitName:'', unitSimultaneityFactor:'', unitDraftConsumers:[] }, { action:'dw:unit-delete', notify:false });
  refreshDrinkingWater(root);
  }, { frames: 12, delays: [0, 40, 120, 260, 520, 820] });
}

function deleteSingle(root, id) {
  return runWithoutScrollJump(() => {
  syncSavedRecordsPatch({ savedSingleConsumers: normalizeDrinkingWaterSavedState(state.get()).savedSingleConsumers.filter(item => !isSameId(item.id, id)) }, 'dw:single-delete');
  if (isSameId(state.get().activeSingleId, id)) state.set({ activeSingleId:null, singleName:'', singleDraftConsumers:[] }, { action:'dw:single-delete', notify:false });
  refreshDrinkingWater(root);
  }, { frames: 12, delays: [0, 40, 120, 260, 520, 820] });
}

function editUnit(root, id) {
  const current = state.get();
  if (isSameId(current.activeUnitId, id)) {
    clearActiveEdit(root);
    return;
  }
  const unit = normalizeDrinkingWaterSavedState(current).savedUsageUnits.find(item => isSameId(item.id, id));
  if (!unit) return;
  state.set({ activeUnitId:unit.id, activeSingleId:null, unitName:unit.name, unitSimultaneityFactor:unit.simultaneityFactor || '', singleName:'', unitDraftConsumers:unit.consumers || [], singleDraftConsumers:[], uiUnitFormOpen:Boolean(current.uiUnitFormOpen), uiUnitSavedOpen:true }, { action:'dw:unit-edit', notify:false });
  refreshDrinkingWater(root);
}

function editSingle(root, id) {
  const current = state.get();
  if (isSameId(current.activeSingleId, id)) {
    clearActiveEdit(root);
    return;
  }
  const group = normalizeDrinkingWaterSavedState(current).savedSingleConsumers.map(normalizeSingleGroupForEdit).filter(Boolean).find(item => isSameId(item.id, id));
  if (!group) return;
  const consumers = (group.consumers || []).map(c => ({ ...c }));
  state.set({ activeUnitId:null, activeSingleId:group.id, unitName:'', unitDraftConsumers:[], singleName:group.name, singleDraftConsumers:consumers, singlePermanent:String(consumers.some(c => c.permanent)), uiSingleFormOpen:Boolean(current.uiSingleFormOpen), uiSingleSavedOpen:true }, { action:'dw:single-edit', notify:false });
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
  installNavigationPersistenceGuard(root);
  installWaterHeatingModeSegmentBridge(root);
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
  root.addEventListener('pointerdown', event => {
    const draftAdd = event.target?.closest?.('[data-dw-draft-add]');
    if (!draftAdd || !root.contains(draftAdd)) return;
    event.preventDefault();
    event.stopPropagation();
    root.dataset.tcDwDraftAddAt = String(Date.now());
    addDraftConsumer(draftAdd.dataset.dwDraftAdd, root);
    refreshDrinkingWater(root);
  }, true);

  root.addEventListener('touchstart', event => {
    const draftAdd = event.target?.closest?.('[data-dw-draft-add]');
    if (!draftAdd || !root.contains(draftAdd)) return;
    event.preventDefault();
    event.stopPropagation();
    root.dataset.tcDwDraftAddAt = String(Date.now());
    addDraftConsumer(draftAdd.dataset.dwDraftAdd, root);
    refreshDrinkingWater(root);
  }, { capture:true, passive:false });


  const handleFieldConfirmNavigation = event => {
    const field = event.target.closest('[data-field]');
    if (!field || !root.contains(field) || (event.key !== 'Enter' && event.key !== 'Tab')) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    state.set({ [field.dataset.field]: field.value }, { action:event.key === 'Tab' ? 'dw:tab' : 'dw:enter', notify:false });
    refreshDrinkingWater(root);
    handlePlatformFieldNavigation(root, field, event, { select:true });
  };
  root.addEventListener('keydown', handleFieldConfirmNavigation, true);

  root.addEventListener('click', event => {
    const target = event.target;
    const unitToggle = target.closest('[data-dw-toggle-unit]');
    if (unitToggle && root.contains(unitToggle)) { event.preventDefault(); event.stopPropagation(); const id = unitToggle.dataset.dwToggleUnit; state.set({ expandedUnitId: isSameId(state.get().expandedUnitId, id) ? null : id }, { action:'dw:unit-toggle', notify:false }); refreshDrinkingWater(root); return; }
    const singleToggle = target.closest('[data-dw-toggle-single]');
    if (singleToggle && root.contains(singleToggle)) { event.preventDefault(); event.stopPropagation(); const id = singleToggle.dataset.dwToggleSingle; state.set({ expandedSingleId: isSameId(state.get().expandedSingleId, id) ? null : id }, { action:'dw:single-toggle', notify:false }); refreshDrinkingWater(root); return; }

    const removeDraft = target.closest('[data-dw-remove-draft]');
    if (removeDraft && root.contains(removeDraft)) { event.preventDefault(); event.stopPropagation(); removeDraftConsumer(removeDraft.dataset.dwRemoveDraft, removeDraft.dataset.index); refreshDrinkingWater(root); return; }
    const draftAdd = target.closest('[data-dw-draft-add]');
    if (draftAdd && root.contains(draftAdd)) { event.preventDefault(); event.stopPropagation(); if (Date.now() - Number(root.dataset.tcDwDraftAddAt || 0) > 650) { addDraftConsumer(draftAdd.dataset.dwDraftAdd, root); refreshDrinkingWater(root); } return; }
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
      if (segment.dataset.segment === 'waterHeatingMode') {
        commitWaterHeatingModeSegment(root, segment, event);
        return;
      }
      event.preventDefault(); event.stopPropagation(); state.set({ [segment.dataset.segment]: segment.dataset.value }, { action:'dw:segment', notify:false }); refreshDrinkingWater(root); return;
    }

    const ignored = target.closest('[data-dw-unit-edit], [data-dw-single-edit], [data-dw-unit-delete], [data-dw-single-delete], [data-dw-add-unit], [data-dw-update-unit], [data-dw-add-single], [data-dw-update-single], [data-dw-draft-add], [data-dw-remove-draft], [data-dw-draft-count], [data-line-toggle], details, summary, input, select, textarea, button, label, .segmented');
    if (!ignored) {
      refreshDrinkingWater(root);
      clearActiveEdit(root);
    }
  });
}

export default bindDrinkingWaterActions;
