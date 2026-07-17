import { mountModule } from '../../core/mount.js';
import { bindCommonInputs, bindNoClickScroll } from '../../core/renderer.js';
import { bindModuleStateBinding } from '../../core/stateBinding.js';
import { registerCentralActions, commitAllFields, registerPipelineCommitHandler } from '../../core/eventPipeline.js';
import { createSavedRecord, savedRecordReducer } from '../../core/savedRecordController.js';
// createSavedRecordActions( remains the central action-factory contract; Phase 17C.9
// uses the Heizung/Kälte-compatible direct binding to avoid duplicate mobile events.
import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { preserveScroll as keepScroll, preserveSavedRecordMutation, PlatformScrollManager } from '../../core/scrollManager.js';
import { PlatformFocusManager } from '../../core/focusManager.js';
import { renderPlatformModuleView, renderPlatformForm, renderPlatformResultsAndSaved, renderPlatformSaved } from '../moduleRenderer/index.js';
import { getRenderScheduler } from '../../core/renderScheduler.js';
import { startPerformanceSpan } from '../shell/performanceController.js';

const noop = () => {};
const asFn = value => typeof value === 'function' ? value : noop;
const array = value => Array.isArray(value) ? value : [];

function preserveScroll(action) { keepScroll(action); }

function preservePlatformUx(root, action, options = {}) {
  const run = () => PlatformScrollManager.runWithoutScrollJump(action, {
    frames: 8,
    delays: [0, 40, 100, 220, 420],
    ...options
  });
  return PlatformFocusManager.preserveFocusDuring(root || document, run, { restoreFocus: true });
}

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

    if (last.key === dedupeKey && now - Number(last.at || 0) < 350) {
      setSegmentVisual(root, field, patch?.[field] ?? value);
      return true;
    }
    if (root) root.__tcPlatformSegmentCommit = { key: dedupeKey, at: now };

    setSegmentVisual(root, field, patch?.[field] ?? value);
    if (action.startsWith('platform:segment:') || action === 'segment:select') {
      state.set(patch, { action, notify: true });
    } else {
      preserveScroll(() => state.set(patch, { action, notify: true }));
    }

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
  root.__tcPlatformCollectionContext = { collections, state };
  if (!root.__tcPlatformCollectionBound) {
    root.__tcPlatformCollectionBound = true;
    root.addEventListener('input', event => {
      const input = event.target?.closest?.('[data-collection-input]');
      if (!input || !root.contains(input)) return;
      const name = input.dataset.collectionInput;
      const context = root.__tcPlatformCollectionContext || {};
      const activeCollections = context.collections || collections;
      const activeState = context.state || state;
      const cfg = activeCollections[name];
      if (!cfg || typeof cfg.patchInput !== 'function') return;
      event.stopPropagation();
      const patch = cfg.patchInput({ id: input.dataset.collectionId, field: input.dataset.collectionField, value: input.value, current: activeState.get(), element: input, root }) || {};
      if (Object.keys(patch).length) activeState.set(patch, { action: cfg.inputAction || `platform:collection:${name}:input`, notify: false });
    }, true);
    const commit = event => {
      const input = event.target?.closest?.('[data-collection-input]');
      if (!input || !root.contains(input)) return;
      const name = input.dataset.collectionInput;
      const context = root.__tcPlatformCollectionContext || {};
      const activeCollections = context.collections || collections;
      const activeState = context.state || state;
      const cfg = activeCollections[name];
      if (!cfg || typeof cfg.patchInput !== 'function') return;
      event.stopPropagation();
      const patch = cfg.patchInput({ id: input.dataset.collectionId, field: input.dataset.collectionField, value: input.value, current: activeState.get(), element: input, root }) || {};
      if (Object.keys(patch).length) activeState.set(patch, { action: cfg.commitAction || `platform:collection:${name}:commit`, notify: true });
    };
    root.addEventListener('blur', commit, true);
  }
  const addCollectionItem = ({ element, root }) => {
    const name = element?.dataset?.collection;
    const context = root.__tcPlatformCollectionContext || {};
    const activeCollections = context.collections || collections;
    const activeState = context.state || state;
    const cfg = activeCollections[name];
    if (!cfg || typeof cfg.add !== 'function') return;
    commitAllFields(root, activeState, { action: cfg.preAddAction || `platform:collection:${name}:pre-add`, notify: false });
    const patch = cfg.add({ current: activeState.get(), root, element, collection: name }) || {};
    if (Object.keys(patch).length) preservePlatformUx(root, () => activeState.set(patch, { action: cfg.addStateAction || `platform:collection:${name}:add`, notify: true }), { frames: 10, delays: [0,40,100,220,420] });
  };
  const deleteCollectionItem = ({ element }) => {
    const name = element?.dataset?.collection;
    const context = root.__tcPlatformCollectionContext || {};
    const activeCollections = context.collections || collections;
    const activeState = context.state || state;
    const cfg = activeCollections[name];
    if (!cfg || typeof cfg.delete !== 'function') return;
    const patch = cfg.delete({ id: element.dataset.collectionId, current: activeState.get(), element, root }) || {};
    if (Object.keys(patch).length) preservePlatformUx(root, () => activeState.set(patch, { action: cfg.deleteAction || `platform:collection:${name}:delete`, notify: true }), { frames: 10, delays: [0,40,100,220,420] });
  };
  const actions = {
    'platform:collection:add': addCollectionItem,
    'platform:collection:delete': deleteCollectionItem,
    'collection:delete': deleteCollectionItem
  };
  Object.entries(collections).forEach(([name, cfg]) => {
    if (typeof cfg.add === 'function' && cfg.addAction) actions[cfg.addAction] = addCollectionItem;
  });

  root.__tcPlatformCollectionActionContext = { actions };
  if (!root.__tcPlatformCollectionActionDirectBound) {
    root.__tcPlatformCollectionActionDirectBound = true;
    const directCollectionAction = event => {
      const element = event.target?.closest?.('[data-tc-action], [data-action]');
      if (!element || !root.contains(element)) return;
      const action = element.dataset.tcAction || element.dataset.action || '';
      const handler = root.__tcPlatformCollectionActionContext?.actions?.[action];
      if (typeof handler !== 'function') return;
      const now = Date.now();
      const last = root.__tcPlatformCollectionLastAction || {};
      // One physical interaction can produce pointerdown, touchstart, mousedown and click.
      // The event type is intentionally excluded so all of them share one dedupe key.
      const key = `${action}:${element.dataset.collection || ''}:${element.dataset.collectionId || ''}`;
      if (last.key === key && now - Number(last.at || 0) < 650) {
        event.preventDefault?.();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        return;
      }
      root.__tcPlatformCollectionLastAction = { key, at: now };
      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      handler({ element, event, root });
    };
    root.addEventListener('pointerdown', directCollectionAction, true);
    root.addEventListener('mousedown', directCollectionAction, true);
    root.addEventListener('touchstart', directCollectionAction, { capture: true, passive: false });
    root.addEventListener('click', directCollectionAction, true);
  }

  return actions;
}

function cssAttr(attr) {
  return String(attr || '').replace(/[^a-zA-Z0-9_-]/g, match => `\\${match}`);
}

function findInside(root, target, selector) {
  const element = target?.closest?.(selector);
  return element && root?.contains?.(element) ? element : null;
}

function resolveSavedRecordConfig(config = {}) {
  if (!config) return null;
  if (config.collection) return config;
  return { collection: config };
}

function bindSavedRecords(root, state, calculate, savedConfig = {}) {
  const config = resolveSavedRecordConfig(savedConfig);
  if (!config?.collection) return {};
  const collection = config.collection;
  const createRecord = config.createRecord || createSavedRecord;
  const actions = {
    'platform:saved-record:save': ({ element }) => {
      commitAllFields(root, state, { action: config.preSaveAction || 'platform:saved-record:pre-save', notify: false });
      const current = state.get();
      const result = calculate(current);
      const record = createRecord({ state: current, result, name: current[collection.nameKey], config: collection });
      const patch = savedRecordReducer(current, { type: 'save', record }, collection);
      preserveSavedRecordMutation(root, () => state.set(patch, { action: config.saveAction || 'platform:saved-record:save', notify: true }));
    },
    'platform:saved-record:load': ({ element }) => {
      const patch = savedRecordReducer(state.get(), { type: 'load', id: element.dataset.savedRecordId }, collection);
      preserveSavedRecordMutation(root, () => state.set(patch, { action: config.loadAction || 'platform:saved-record:load', notify: true }));
    },
    'platform:saved-record:delete': ({ element }) => {
      const patch = savedRecordReducer(state.get(), { type: 'delete', id: element.dataset.savedRecordId }, collection);
      preserveSavedRecordMutation(root, () => state.set(patch, { action: config.deleteAction || 'platform:saved-record:delete', notify: true }));
    }
  };
  return actions;
}

function mountDynamicPlatformModule(root, state, view, bind, dynamicUpdate, isDynamicAction = () => true) {
  let renderCount = 0;
  const isCurrentMount = () => Boolean(root?.isConnected && root?.dataset?.activeModuleId);
  const fullRender = (snapshot, meta = {}) => {
    const finish = startPerformanceSpan('module:render', { action: meta?.action || 'initial', mode: 'custom' });
    const html = view(snapshot);
    if (root.innerHTML !== html) root.innerHTML = html;
    renderCount += 1;
    root.dataset.renderCount = String(renderCount);
    bind?.(root, snapshot, meta);
    finish({ status: 'ok' });
  };

  fullRender(state.get());
  const unsubscribe = state.subscribe((snapshot, meta = {}) => {
    if (!isCurrentMount()) return;
    if (isDynamicAction(meta)) {
      const finishDynamic = startPerformanceSpan('dynamic-render', { action: meta?.action || 'dynamic', mode: 'custom-dynamic', changed: meta?.changed || [] });
      try {
        dynamicUpdate?.(root, snapshot, meta);
        finishDynamic({ status: 'ok' });
      } catch (error) {
        finishDynamic({ status: 'error', error: error?.message || String(error) });
        throw error;
      }
      return;
    }
    fullRender(snapshot, meta);
  });

  return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
}

export function createPlatformModule(definition = {}) {
  const {
    config,
    schema,
    state,
    initialState,
    calculate,
    results,
    report,
    savedRecords,
    controller = {},
    view: customView,
    bind: customBind,
    dynamicUpdate: customDynamicUpdate,
    isDynamicAction: customIsDynamicAction
  } = definition;
  const runtimeState = createNormalizedState(state, controller.normalizeFields);

  if (typeof customView === 'function') {
    return {
      config,
      schema,
      state: runtimeState,
      initialState,
      calculate,
      results,
      report,
      savedRecords,
      controller,
      mount(root) {
        return mountDynamicPlatformModule(
          root,
          runtimeState,
          customView,
          customBind,
          customDynamicUpdate,
          typeof customIsDynamicAction === 'function' ? customIsDynamicAction : () => true
        );
      }
    };
  }

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
    const finishDynamic = startPerformanceSpan('dynamic-render', { action: meta?.action || 'dynamic', mode: 'platform', reason: meta?.reason || '', changed: meta?.changed || [] });
    const action = String(meta?.action || '');
    const reason = String(meta?.reason || '');
    const isSegmentUpdate = reason.startsWith('segment') || action.startsWith('platform:segment:') || action === 'segment:select';

    if (isSegmentUpdate) {
      preservePlatformUx(root, () => {
        const nextView = view(runtimeState.get());
        if (root.innerHTML !== nextView) root.innerHTML = nextView;
        root.__tcPlatformLastDynamicUpdate = { ...(meta || {}), full: true, at: Date.now() };
        bindPlatformActions(root);
      });
      finishDynamic({ status: 'ok', full: true });
      return true;
    }

    const formHost = root.querySelector?.('[data-platform-dynamic="form"]');
    const savedHost = root.querySelector?.('[data-platform-dynamic="saved-records"]');
    const sideHost = root.querySelector?.('[data-platform-dynamic="result-saved"]');
    if (!formHost && !savedHost && !sideHost) { finishDynamic({ status: 'skipped' }); return false; }
    const model = buildRenderModel(runtimeState.get());
    preservePlatformUx(root, () => {
      if (formHost) {
        const nextForm = renderPlatformForm(model);
        if (formHost.innerHTML !== nextForm) formHost.innerHTML = nextForm;
      }
      if (savedHost) {
        const nextSaved = renderPlatformSaved(model);
        if (savedHost.innerHTML !== nextSaved) savedHost.innerHTML = nextSaved;
      }
      if (sideHost) {
        const nextSide = renderPlatformResultsAndSaved(model);
        if (sideHost.innerHTML !== nextSide) sideHost.innerHTML = nextSide;
      }
      root.__tcPlatformLastDynamicUpdate = { ...(meta || {}), at: Date.now() };
    });
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
    if (typeof customBind === 'function') customBind(root, runtimeState.get(), { action: 'platform:bind' });
  }
  return { config, schema, state: runtimeState, initialState, calculate, results, report, savedRecords, controller, mount(root) { return mountModule(root, runtimeState, view, bindPlatformActions); } };
}

export default { createPlatformModule };
