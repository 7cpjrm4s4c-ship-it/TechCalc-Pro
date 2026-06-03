import { mountModule } from '../../core/mount.js';
import { registerCentralActions, commitAllFields, registerPipelineCommitHandler } from '../../core/eventPipeline.js';
import { createSavedRecord, savedRecordReducer } from '../../core/savedRecordController.js';
// createSavedRecordActions( remains the central action-factory contract; Phase 17C.9
// uses the Heizung/Kälte-compatible direct binding to avoid duplicate mobile events.
import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { preserveScroll as keepScroll } from '../../core/scrollManager.js';
import { renderPlatformModuleView, renderPlatformForm, renderPlatformResultsAndSaved } from '../moduleRenderer/index.js';
import { getRenderScheduler } from '../../core/renderScheduler.js';

const noop = () => {};
const asFn = value => typeof value === 'function' ? value : noop;
const array = value => Array.isArray(value) ? value : [];

function preserveScroll(action) { keepScroll(action); }

function createNormalizedState(state, fields = []) {
  const numericFields = Array.isArray(fields) ? fields : [];
  if (!numericFields.length || !state?.set) return state;
  return {
    ...state,
    set(patch = {}, meta = {}) {
      return state.set(normalizeConfiguredFields(patch, numericFields), meta);
    },
    update(updater, meta = {}) {
      if (typeof updater !== 'function') {
        return state.update ? state.update(normalizeConfiguredFields(updater || {}, numericFields), meta) : this.set(updater || {}, meta);
      }
      const wrappedUpdater = current => normalizeConfiguredFields(updater(current) || {}, numericFields);
      return state.update ? state.update(wrappedUpdater, meta) : this.set(wrappedUpdater(state.get?.() || {}), meta);
    },
    replace(next = {}, meta = {}) {
      const normalized = normalizeConfiguredFields(next, numericFields);
      return state.replace ? state.replace(normalized, meta) : state.set(normalized, meta);
    }
  };
}

export function normalizeConfiguredFields(patch = {}, fields = []) {
  if (!fields.length) return patch;
  const numeric = new Set(fields);
  return Object.entries(patch).reduce((acc, [field, value]) => {
    acc[field] = numeric.has(field) ? canonicalGermanNumberInput(value) : value;
    return acc;
  }, {});
}

function setSegmentVisual(root, field, value) {
  root?.querySelectorAll?.(`[data-segment="${field}"]`)?.forEach(button => {
    const active = String(button.dataset.value) === String(value);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
}

function patchFieldDomValue(root, field, value) {
  const el = root?.querySelector?.(`[data-field="${field}"]`);
  if (!el) return;
  const next = String(value ?? '');
  if (el.value !== next) el.value = next;
}

function patchFieldDomValues(root, patch = {}, fields = []) {
  const targetFields = fields.length ? fields : Object.keys(patch || {});
  targetFields.forEach(field => patchFieldDomValue(root, field, patch[field]));
}

function bindSegments(root, state, segmentConfig = {}, dynamicOptions = {}) {
  const fields = segmentConfig.fields || {};
  const handlers = {};
  if (!Object.keys(fields).length) return handlers;

  const commit = (element, event, commitOptions = {}) => {
    const field = element?.dataset?.segment;
    const value = element?.dataset?.value;
    if (!field || value === undefined || !fields[field]) return false;
    const current = state.get();
    const patchFactory = asFn(fields[field].patch);
    const patch = patchFactory(value, current, { field, root }) || { [field]: value };
    const action = fields[field].action || `platform:segment:${field}`;
    const dedupeKey = `${field}:${value}:${action}`;
    const now = Date.now();
    const last = root?.__tcPlatformSegmentCommit || {};

    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();

    // Heizung/Kälte parity: segment changes are store-first and render-immediate.
    // Mobile Safari can leave click/touchend work pending until the next input
    // confirmation. Committing on the earliest reliable interaction keeps schema
    // labels, visibility and dependent fields in sync with the active segment.
    if (last.key === dedupeKey && now - Number(last.at || 0) < 350) {
      setSegmentVisual(root, field, patch?.[field] ?? value);
      return true;
    }
    if (root) root.__tcPlatformSegmentCommit = { key: dedupeKey, at: now };

    setSegmentVisual(root, field, patch?.[field] ?? value);
    preserveScroll(() => state.set(patch, { action, notify: true }));

    // Platform dynamic-update contract: schema-dependent segment changes must
    // rebuild the form/result islands immediately, just like Heizung/Kälte does
    // with its named dynamic containers. This avoids stale labels/visibleWhen
    // state on mobile browsers where the normal async render can be delayed
    // until the next field commit.
    if (typeof dynamicOptions.dynamicUpdate === 'function') {
      dynamicOptions.dynamicUpdate({ action, field, value: patch?.[field] ?? value, patch, reason: 'segment' });
    }

    const scheduler = getRenderScheduler(root);
    scheduler?.flushNow?.(action);
    if (typeof queueMicrotask === 'function') queueMicrotask(() => {
      if (typeof dynamicOptions.dynamicUpdate === 'function') dynamicOptions.dynamicUpdate({ action: `${action}:settled`, field, value: patch?.[field] ?? value, patch, reason: 'segment:settled' });
      scheduler?.flushNow?.(`${action}:settled`);
    });
    if (commitOptions.settled !== false) setTimeout(() => {
      if (typeof dynamicOptions.dynamicUpdate === 'function') dynamicOptions.dynamicUpdate({ action: `${action}:settled-timeout`, field, value: patch?.[field] ?? value, patch, reason: 'segment:settled-timeout' });
      scheduler?.flushNow?.(`${action}:settled-timeout`);
    }, 0);
    return true;
  };

  handlers.segment = ({ element, event }) => commit(element, event);
  Object.keys(fields).forEach(field => {
    const action = fields[field].action || `platform:segment:${field}`;
    handlers[action] = ({ element, event }) => commit(element, event);
  });

  // Direct segment bridge: the generic event pipeline processes segments on
  // pointerup/touchend/click. Reference modules with schema-dependent segments
  // need the same immediate dynamic update behaviour as Heizung/Kälte, so we
  // commit configured platform segments already on pointerdown/touchstart.
  //
  // Important: the bridge itself may only be bound once per stable module root,
  // but the active module context must be refreshed after every mount/re-render.
  // Otherwise the listener keeps the old `fields`/`state` closure from the first
  // platform module mounted into that root. That was the Regenwasser startup bug:
  // the first surfaceMode tap only became effective after a later field commit.
  if (root) {
    root.__tcPlatformSegmentContext = { fields, commit };
    if (!root.__tcPlatformSegmentDirectBound) {
      root.__tcPlatformSegmentDirectBound = true;
      const direct = event => {
        const segment = event.target?.closest?.('[data-segment]');
        if (!segment || !root.contains(segment)) return;
        const field = segment?.dataset?.segment;
        const context = root.__tcPlatformSegmentContext || {};
        if (!field || !context.fields?.[field] || typeof context.commit !== 'function') return;
        context.commit(segment, event, { settled: false });
      };
      root.addEventListener('pointerdown', direct, true);
      root.addEventListener('touchstart', direct, { capture: true, passive: false });
    }
  }

  return handlers;
}

function bindLookupHydration(root, state, lookupConfig = {}) {
  const fields = new Set(array(lookupConfig.fields));
  if (!fields.size || typeof lookupConfig.patch !== 'function') return;
  root.__tcPlatformLookupHydrationCleanup?.();
  root.__tcPlatformLookupHydrationCleanup = registerPipelineCommitHandler(root, lookupConfig.key || 'platform:lookup-hydration', event => {
    const field = event?.detail?.field;
    if (!fields.has(field)) return;
    const current = state.get();
    const patch = lookupConfig.patch(field, current, { root }) || {};
    if (!Object.keys(patch).length) return;
    state.set(patch, { action: lookupConfig.action?.(field) || `platform:lookup:${field}`, notify: true });
    patchFieldDomValues(root, patch, array(lookupConfig.hydrateDomFields?.[field]));
  });
}


function bindCollections(root, state, collectionConfig = {}) {
  const collections = collectionConfig.collections || collectionConfig;
  if (!collections || !Object.keys(collections).length) return {};
  if (!root.__tcPlatformCollectionBound) {
    root.__tcPlatformCollectionBound = true;
    root.addEventListener('input', event => {
      const input = event.target?.closest?.('[data-collection-input]');
      if (!input || !root.contains(input)) return;
      const name = input.dataset.collectionInput;
      const cfg = collections[name];
      if (!cfg || typeof cfg.patchInput !== 'function') return;
      event.stopPropagation();
      const patch = cfg.patchInput({ id: input.dataset.collectionId, field: input.dataset.collectionField, value: input.value, current: state.get(), element: input, root }) || {};
      if (Object.keys(patch).length) state.set(patch, { action: cfg.inputAction || `platform:collection:${name}:input`, notify: false });
    }, true);
    const commit = event => {
      const input = event.target?.closest?.('[data-collection-input]');
      if (!input || !root.contains(input)) return;
      const name = input.dataset.collectionInput;
      const cfg = collections[name];
      if (!cfg || typeof cfg.patchInput !== 'function') return;
      event.stopPropagation();
      const patch = cfg.patchInput({ id: input.dataset.collectionId, field: input.dataset.collectionField, value: input.value, current: state.get(), element: input, root }) || {};
      if (Object.keys(patch).length) state.set(patch, { action: cfg.commitAction || `platform:collection:${name}:commit`, notify: true });
    };
    root.addEventListener('blur', commit, true);
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      const input = event.target?.closest?.('[data-collection-input]');
      if (!input || !root.contains(input)) return;
      event.preventDefault();
      commit(event);
    }, true);
  }
  const addCollectionItem = ({ element, root }) => {
    const name = element?.dataset?.collection;
    const cfg = collections[name];
    if (!cfg || typeof cfg.add !== 'function') return;
    const patch = cfg.add({ current: state.get(), root, element, collection: name }) || {};
    if (Object.keys(patch).length) preserveScroll(() => state.set(patch, { action: cfg.addStateAction || `platform:collection:${name}:add`, notify: true }));
  };
  const deleteCollectionItem = ({ element }) => {
    const name = element?.dataset?.collection;
    const cfg = collections[name];
    if (!cfg || typeof cfg.delete !== 'function') return;
    const patch = cfg.delete({ id: element.dataset.collectionId, current: state.get(), element, root }) || {};
    if (Object.keys(patch).length) preserveScroll(() => state.set(patch, { action: cfg.deleteAction || `platform:collection:${name}:delete`, notify: true }));
  };
  const actions = {
    'platform:collection:add': addCollectionItem,
    'platform:collection:delete': deleteCollectionItem,
    'collection:delete': deleteCollectionItem
  };
  Object.entries(collections).forEach(([name, cfg]) => {
    if (typeof cfg.add === 'function' && cfg.addAction) actions[cfg.addAction] = addCollectionItem;
  });
  return actions;
}

function cssAttr(attr) {
  return String(attr || '').replace(/[^a-zA-Z0-9_-]/g, match => `\\${match}`);
}

function findInside(root, target, selector) {
  const element = target?.closest?.(selector);
  return element && root?.contains?.(element) ? element : null;
}

function readRecordIdFromElement(element, attrs = {}) {
  const loadAttr = attrs.loadAttr || 'data-line-select';
  const toggleAttr = attrs.toggleAttr || 'data-line-toggle';
  const deleteAttr = attrs.deleteAttr || 'data-line-delete';
  const carrier = element?.closest?.(`[${loadAttr}], [${toggleAttr}], [${deleteAttr}], [data-line-card], [data-saved-record-card]`) || element;
  return carrier?.getAttribute?.(loadAttr)
    || carrier?.getAttribute?.(toggleAttr)
    || carrier?.getAttribute?.(deleteAttr)
    || carrier?.getAttribute?.('data-saved-record-id')
    || carrier?.dataset?.savedRecordId
    || '';
}

function bindSavedRecords(root, state, calculate, savedConfig = {}) {
  if (!savedConfig.enabled) return {};
  const attrs = savedConfig.attrs || {};
  const loadAttr = attrs.loadAttr || 'data-line-select';
  const toggleAttr = attrs.toggleAttr || 'data-line-toggle';
  const deleteAttr = attrs.deleteAttr || 'data-line-delete';

  const list = current => Array.isArray(current?.[savedConfig.listKey]) ? current[savedConfig.listKey] : [];
  const createRecord = (current, existing = null) => createSavedRecord({
    prefix: savedConfig.recordPrefix || 'record',
    current: { ...current, [savedConfig.activeIdKey]: existing ? current[savedConfig.activeIdKey] : null },
    calculate,
    snapshot: savedConfig.snapshot,
    existing
  });
  const setReduced = (current, payload, metaAction) => state.set(savedRecordReducer(current, {
    listKey: savedConfig.listKey,
    activeIdKey: savedConfig.activeIdKey,
    expandedIdKey: savedConfig.expandedIdKey,
    nameKey: savedConfig.nameKey,
    ...payload
  }), { action: metaAction || `line:${payload.action || 'saved'}` });

  const shouldSkipDuplicateAction = action => {
    const now = Date.now();
    const key = `__tcLastPlatformLineAction:${savedConfig.listKey || 'records'}`;
    const last = root?.[key] || {};
    if (last.action === action && now - Number(last.at || 0) < 450) return true;
    if (root) root[key] = { action, at: now };
    return false;
  };

  const save = ({ root: actionRoot } = {}) => {
    if (shouldSkipDuplicateAction('line:save')) return;
    const host = actionRoot || root;
    savedConfig.commitBeforeCreate === false ? null : commitAllFields(host, state, { action: savedConfig.preCreateAction || 'line:pre-save', notify: false });
    const current = state.get();
    const record = createRecord(current);
    const patch = typeof savedConfig.afterCreatePatch === 'function' ? savedConfig.afterCreatePatch(current, record) : {};
    preserveScroll(() => setReduced(current, { action: 'create', record, patch }, 'line:save'));
  };

  const update = ({ root: actionRoot } = {}) => {
    if (shouldSkipDuplicateAction('line:update')) return;
    const host = actionRoot || root;
    savedConfig.commitBeforeUpdate === false ? null : commitAllFields(host, state, { action: savedConfig.preUpdateAction || 'line:pre-update', notify: false });
    const current = state.get();
    const id = current?.[savedConfig.activeIdKey];
    if (!id) return;
    const existing = list(current).find(item => String(item.id) === String(id));
    if (!existing) return;
    const record = createRecord(current, existing);
    preserveScroll(() => setReduced(current, { action: 'update', id, record }, 'line:update'));
  };

  const readId = element => readRecordIdFromElement(element, { loadAttr, toggleAttr, deleteAttr });

  const load = ({ element } = {}) => {
    const id = readId(element);
    const current = state.get();
    const item = list(current).find(entry => String(entry.id) === String(id));
    if (!item) return;
    if (String(current?.[savedConfig.activeIdKey] || '') === String(id)) {
      state.set({
        [savedConfig.activeIdKey]: null,
        ...(savedConfig.nameKey ? { [savedConfig.nameKey]: '' } : {})
      }, { action: 'line:deselect' });
      return;
    }
    const patch = typeof savedConfig.hydrate === 'function' ? savedConfig.hydrate(item, current) : { ...(item.state || item.inputState || item) };
    setReduced(current, { action: 'load', id: item.id, record: item, patch }, 'line:select');
  };

  const remove = ({ element } = {}) => {
    const id = readId(element);
    const current = state.get();
    const patch = typeof savedConfig.clear === 'function' && String(current?.[savedConfig.activeIdKey] || '') === String(id) ? savedConfig.clear(current) : {};
    preserveScroll(() => setReduced(current, { action: 'delete', id, patch }, 'line:delete'));
  };

  const toggle = ({ element } = {}) => {
    const id = readId(element);
    const current = state.get();
    setReduced(current, { action: 'toggle-expanded', id }, 'line:toggle');
  };

  // Heizung/Kälte parity: saved-record panels are controlled exclusively by the
  // central action map. No module-specific capture listener, bridge, or legacy add/update path is registered here.
  root.__tcPlatformSavedRecordContext = null;
  root.__tcPlatformSavedRecordBridge = null;
  return {
    'line:save': save,
    'line:update': update,
    'saved:load': load,
    'saved:delete': remove,
    'saved:toggle': toggle
  };
}

export function createPlatformModule(definition = {}) {
  const { config, schema, state, initialState, calculate, results, savedRecords, controller = {} } = definition;
  const runtimeState = createNormalizedState(state, controller.normalizeFields);

  function buildRenderModel(snapshot) {
    const result = calculate(snapshot);
    return {
      config,
      schema,
      state: snapshot,
      result,
      resultModel: typeof results === 'function' ? results(snapshot, result) : results,
      savedRecords: typeof savedRecords === 'function' ? savedRecords(snapshot, result) : savedRecords
    };
  }

  function view(snapshot) {
    return renderPlatformModuleView(buildRenderModel(snapshot));
  }

  function updateDynamicIslands(root, meta = {}) {
    if (!root) return false;
    const action = String(meta?.action || '');
    const reason = String(meta?.reason || '');
    const isSegmentUpdate = reason.startsWith('segment') || action.startsWith('platform:segment:') || action === 'segment:select';

    // Phase 17C.14: segment changes are schema-structural. They can alter labels,
    // visibleWhen fields, select captions and entire cards. Updating only the
    // form/side islands was still too weak on mobile Safari because the old
    // event target could survive visually until the next confirmed input.
    // Heizung/Kälte solves this by synchronously replacing named dynamic areas;
    // the platform equivalent is a synchronous full platform-view rebuild for
    // segment commits, followed by rebinding the platform action map.
    if (isSegmentUpdate) {
      const nextView = view(runtimeState.get());
      if (root.innerHTML !== nextView) root.innerHTML = nextView;
      root.__tcPlatformLastDynamicUpdate = { ...(meta || {}), full: true, at: Date.now() };
      bindPlatformActions(root);
      return true;
    }

    const formHost = root.querySelector?.('[data-platform-dynamic="form"]');
    const sideHost = root.querySelector?.('[data-platform-dynamic="result-saved"]');
    if (!formHost && !sideHost) return false;
    const model = buildRenderModel(runtimeState.get());
    if (formHost) {
      const nextForm = renderPlatformForm(model);
      if (formHost.innerHTML !== nextForm) formHost.innerHTML = nextForm;
    }
    if (sideHost) {
      const nextSide = renderPlatformResultsAndSaved(model);
      if (sideHost.innerHTML !== nextSide) sideHost.innerHTML = nextSide;
    }
    root.__tcPlatformLastDynamicUpdate = { ...(meta || {}), at: Date.now() };
    return true;
  }

  function bindPlatformActions(root) {
    const dynamicUpdate = meta => updateDynamicIslands(root, meta);
    const actions = {
      ...bindSegments(root, runtimeState, controller.segments, { dynamicUpdate }),
      ...bindCollections(root, runtimeState, controller.collections),
      ...bindSavedRecords(root, runtimeState, calculate, controller.savedRecords)
    };
    bindLookupHydration(root, runtimeState, controller.lookupHydration);
    registerCentralActions(root, actions);
  }
  return { config, schema, state: runtimeState, initialState, calculate, results, savedRecords, controller, mount(root) { return mountModule(root, runtimeState, view, bindPlatformActions); } };
}

export default { createPlatformModule };
