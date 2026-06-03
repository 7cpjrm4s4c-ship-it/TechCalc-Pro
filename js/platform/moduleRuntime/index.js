import { mountModule } from '../../core/mount.js';
import { registerCentralActions, commitAllFields, registerPipelineCommitHandler } from '../../core/eventPipeline.js';
import { createSavedRecordActions } from '../../core/savedRecordController.js';
import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { preserveScroll as keepScroll } from '../../core/scrollManager.js';
import { renderPlatformModuleView } from '../moduleRenderer/index.js';
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

function bindSegments(root, state, segmentConfig = {}) {
  const fields = segmentConfig.fields || {};
  const handlers = {};
  if (!Object.keys(fields).length) return handlers;

  const commit = (element, event) => {
    const field = element?.dataset?.segment;
    const value = element?.dataset?.value;
    if (!field || value === undefined || !fields[field]) return false;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    const current = state.get();
    const patchFactory = asFn(fields[field].patch);
    const patch = patchFactory(value, current, { field, root }) || { [field]: value };
    setSegmentVisual(root, field, patch?.[field] ?? value);
    const action = fields[field].action || `platform:segment:${field}`;
    preserveScroll(() => state.set(patch, { action, notify: true }));
    const scheduler = getRenderScheduler(root);
    scheduler?.flushNow?.(action);
    if (typeof fields[field].domPatch === 'function') fields[field].domPatch({ root, field, value, patch, state: state.get() });
    if (typeof queueMicrotask === 'function') queueMicrotask(() => {
      scheduler?.flushNow?.(`${action}:settled`);
      if (typeof fields[field].domPatch === 'function') fields[field].domPatch({ root, field, value, patch, state: state.get() });
    });
    setTimeout(() => {
      scheduler?.flushNow?.(`${action}:settled-timeout`);
      if (typeof fields[field].domPatch === 'function') fields[field].domPatch({ root, field, value, patch, state: state.get() });
    }, 0);
    return true;
  };

  handlers.segment = ({ element, event }) => commit(element, event);

  // Phase 17C.5: keep capture bindings module-agnostic. The app root is reused
  // between modules; a one-time listener must therefore read the latest commit
  // function from the root instead of closing over the first mounted module.
  root.__tcPlatformSegmentContext = { commit };
  if (!root.__tcPlatformSegmentCaptureBound) {
    root.__tcPlatformSegmentCaptureBound = true;
    const capture = event => {
      const element = event.target?.closest?.('[data-segment]');
      if (!element || !root.contains(element)) return;
      root.__tcPlatformSegmentContext?.commit?.(element, event);
    };
    root.addEventListener('pointerup', capture, true);
    root.addEventListener('click', capture, true);
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const element = event.target?.closest?.('[data-segment]');
      if (!element || !root.contains(element)) return;
      root.__tcPlatformSegmentContext?.commit?.(element, event);
    }, true);
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

function createSavedRecordEventBridge(root, state, handlers = {}, attrs = {}) {
  const loadAttr = attrs.loadAttr || 'data-saved-load';
  const toggleAttr = attrs.toggleAttr || 'data-saved-toggle';
  const deleteAttr = attrs.deleteAttr || 'data-saved-delete';
  const markerSelector = `[${loadAttr}], [${toggleAttr}], [${deleteAttr}], [data-saved-record-id], [data-line-card]`;
  const interactiveInsideLoad = `[${toggleAttr}], [${deleteAttr}], a[href], input, select, textarea, label, button:not([${loadAttr}])`;
  let lastKey = '';
  let lastAt = 0;

  const closestInside = (target, selector) => {
    const element = target?.closest?.(selector);
    return element && root?.contains?.(element) ? element : null;
  };

  const dedupe = (key, event) => {
    const now = Date.now();
    const eventType = event?.type || 'event';
    const next = `${eventType}:${key}`;
    // Pointer/touch events are followed by synthetic clicks on iOS. Suppress
    // only cross-event duplicates; repeated clicks on the same toggle must still
    // close the accordion.
    if (lastKey && lastKey.split(':').slice(1).join(':') === key && lastKey !== next && now - lastAt < 700) return true;
    lastKey = next;
    lastAt = now;
    return false;
  };

  const handle = ({ action, element, event } = {}) => {
    if (!action || !String(action).startsWith('saved:')) return false;
    if (action !== 'saved:load' && action !== 'saved:delete' && action !== 'saved:toggle') return false;
    const target = event?.target || element;
    let carrier = element;

    if (action === 'saved:delete') carrier = closestInside(target, `[${deleteAttr}]`) || closestInside(element, `[${deleteAttr}]`);
    else if (action === 'saved:toggle') carrier = closestInside(target, `[${toggleAttr}]`) || closestInside(element, `[${toggleAttr}]`);
    else {
      if (closestInside(target, interactiveInsideLoad)) return false;
      carrier = closestInside(target, `[${loadAttr}]`) || closestInside(element, markerSelector);
    }

    if (!carrier) return false;
    const id = carrier.getAttribute?.(loadAttr) || carrier.getAttribute?.(toggleAttr) || carrier.getAttribute?.(deleteAttr) || carrier.getAttribute?.('data-saved-record-id') || '';
    if (!id) return false;
    const key = `${action}:${id}`;
    if (dedupe(key, event)) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      return true;
    }
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    const handler = handlers[action];
    if (typeof handler !== 'function') return true;
    handler({ action, element: carrier, event, state, root });
    return true;
  };

  return { handle, attrs: { loadAttr, toggleAttr, deleteAttr } };
}

function bindSavedRecords(root, state, calculate, savedConfig = {}) {
  if (!savedConfig.enabled) return {};
  const actions = createSavedRecordActions({
    root,
    state,
    calculate,
    snapshot: savedConfig.snapshot,
    hydrate: savedConfig.hydrate,
    clear: savedConfig.clear,
    listKey: savedConfig.listKey,
    activeIdKey: savedConfig.activeIdKey,
    expandedIdKey: savedConfig.expandedIdKey,
    nameKey: savedConfig.nameKey,
    recordPrefix: savedConfig.recordPrefix,
    beforeCreate: savedConfig.commitBeforeCreate === false ? null : ({ root, state }) => commitAllFields(root, state, { action: savedConfig.preCreateAction || 'platform:saved:pre-create', notify: false }),
    beforeUpdate: savedConfig.commitBeforeUpdate === false ? null : ({ root, state }) => commitAllFields(root, state, { action: savedConfig.preUpdateAction || 'platform:saved:pre-update', notify: false }),
    afterCreatePatch: savedConfig.afterCreatePatch,
    attrs: savedConfig.attrs || {},
    preserveSaveScroll: savedConfig.preserveSaveScroll !== false,
    preserveLoadScroll: savedConfig.preserveLoadScroll !== false
  });

  const handlers = {
    'saved:add': () => actions.save(),
    'saved:update': () => actions.update(),
    'saved:load': ({ element, event }) => actions.load({ element, event }),
    'saved:delete': ({ element }) => actions.delete({ element }),
    'saved:toggle': ({ element }) => actions.toggle({ element })
  };

  // Phase 17C.8: publish only the active SavedRecord handlers. Regenwasser
  // and Schmutzwasser now use the same direct central-action contract as
  // Heizung/Kälte (data-line-select/toggle/delete), avoiding a competing
  // SavedRecord bridge between the DOM and the store.
  root.__tcPlatformSavedRecordContext = { handlers, state, attrs: savedConfig.attrs || {} };
  root.__tcPlatformSavedRecordBridge = null;

  return handlers;
}

export function createPlatformModule(definition = {}) {
  const { config, schema, state, initialState, calculate, results, savedRecords, controller = {} } = definition;
  const runtimeState = createNormalizedState(state, controller.normalizeFields);
  function view(snapshot) {
    const result = calculate(snapshot);
    return renderPlatformModuleView({
      config,
      schema,
      state: snapshot,
      result,
      resultModel: typeof results === 'function' ? results(snapshot, result) : results,
      savedRecords: typeof savedRecords === 'function' ? savedRecords(snapshot, result) : savedRecords
    });
  }
  function bindPlatformActions(root) {
    const actions = {
      ...bindSegments(root, runtimeState, controller.segments),
      ...bindCollections(root, runtimeState, controller.collections),
      ...bindSavedRecords(root, runtimeState, calculate, controller.savedRecords)
    };
    bindLookupHydration(root, runtimeState, controller.lookupHydration);
    registerCentralActions(root, actions);
  }
  return { config, schema, state: runtimeState, initialState, calculate, results, savedRecords, controller, mount(root) { return mountModule(root, runtimeState, view, bindPlatformActions); } };
}

export default { createPlatformModule };
