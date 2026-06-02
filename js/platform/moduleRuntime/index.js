import { mountModule } from '../../core/mount.js';
import { registerCentralActions, commitAllFields, registerPipelineCommitHandler } from '../../core/eventPipeline.js';
import { createSavedRecordActions } from '../../core/savedRecordController.js';
import { canonicalGermanNumberInput } from '../../core/numbers.js';
import { preserveScroll as keepScroll } from '../../core/scrollManager.js';
import { renderPlatformModuleView } from '../moduleRenderer/index.js';

const noop = () => {};
const asFn = value => typeof value === 'function' ? value : noop;
const array = value => Array.isArray(value) ? value : [];

function preserveScroll(action) { keepScroll(action); }

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
  handlers.segment = ({ element, root }) => {
    const field = element?.dataset?.segment;
    const value = element?.dataset?.value;
    if (!field || value === undefined || !fields[field]) return;
    const current = state.get();
    const patchFactory = asFn(fields[field].patch);
    const patch = patchFactory(value, current, { field, root }) || { [field]: value };
    setSegmentVisual(root, field, patch?.[field] ?? value);
    preserveScroll(() => state.set(patch, { action: fields[field].action || `platform:segment:${field}`, notify: true }));
  };
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
  return {
    'saved:add': () => actions.save(),
    'saved:update': () => actions.update(),
    'saved:load': ({ element, event }) => actions.load({ element, event }),
    'saved:delete': ({ element }) => actions.delete({ element }),
    'saved:toggle': ({ element }) => actions.toggle({ element })
  };
}

export function createPlatformModule(definition = {}) {
  const { config, schema, state, initialState, calculate, results, savedRecords, controller = {} } = definition;
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
      ...bindSegments(root, state, controller.segments),
      ...bindSavedRecords(root, state, calculate, controller.savedRecords)
    };
    bindLookupHydration(root, state, controller.lookupHydration);
    registerCentralActions(root, actions);
  }
  return { config, schema, state, initialState, calculate, results, savedRecords, controller, mount(root) { return mountModule(root, state, view, bindPlatformActions); } };
}

export default { createPlatformModule };
