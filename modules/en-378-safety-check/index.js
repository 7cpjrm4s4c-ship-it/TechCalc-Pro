import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { buildEN378SafetyCheckResultModel } from './results.js';
import { buildEN378SafetyCheckReportDto } from './reportAdapter.js';
import {
  buildEN378SavedRecord,
  hydrateEN378SavedRecord,
  buildEN378SavedRecordsModel
} from './savedRecords.js';
import { formatRefrigerantLabel, listRefrigerants } from '../../core/data/index.js';
import { createPlatformModule } from '../../core/runtime/index.js';
import { createTypedDtoReportAdapter } from '../../core/pdf/typedDtoReportAdapter.js';
import { bindFGasesSnapshotImport } from './importController.js';
import { normalizeEN378StateTransition } from './stateTransitions.js';
export { buildEN378StateFromFGasesSnapshot, canImportFGasesSystemSnapshot } from './snapshotImport.js';

const refrigerantOptions = Object.freeze([
  Object.freeze({ value: '', label: 'Bitte wählen' }),
  ...listRefrigerants().map(item => Object.freeze({
    value: item.id,
    label: formatRefrigerantLabel(item) || item.id
  }))
]);
const runtimeSchema = Object.freeze({
  ...schema,
  fields: Object.freeze(schema.fields.map(field => field.key === 'refrigerantId'
    ? Object.freeze({ ...field, options: refrigerantOptions })
    : field))
});
const transitionAwareState = Object.freeze({
  get: () => state.get(),
  getRevision: () => state.getRevision?.(),
  set(patch = {}, meta = {}) {
    return state.set(normalizeEN378StateTransition(state.get(), patch, meta), meta);
  },
  update(updater, meta = {}) {
    const current = state.get();
    const patch = typeof updater === 'function' ? updater(current) : updater;
    return state.set(normalizeEN378StateTransition(current, patch || {}, meta), meta);
  },
  replace(next = {}, meta = {}) {
    return state.replace(normalizeEN378StateTransition(state.get(), next, meta), meta);
  },
  reset: meta => state.reset(meta),
  subscribe: (...args) => state.subscribe(...args)
});
const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema: runtimeSchema,
  state: transitionAwareState,
  calculate,
  results: buildEN378SafetyCheckResultModel,
  buildReportDto: buildEN378SafetyCheckReportDto
});

function bind(root) {
  bindFGasesSnapshotImport(root, state);
}
const controller = Object.freeze({
  savedRecords: Object.freeze({
    enabled: true,
    listKey: 'savedAssessments',
    activeIdKey: 'activeSavedAssessmentId',
    expandedIdKey: 'expandedSavedAssessmentId',
    nameKey: 'savedAssessmentName',
    recordPrefix: 'en-378-assessment',
    attrs: Object.freeze({
      loadAttr: 'data-saved-load',
      toggleAttr: 'data-saved-toggle',
      deleteAttr: 'data-saved-delete'
    }),
    snapshot: (current, result, existing) => buildEN378SavedRecord(current, result, existing),
    hydrate: item => hydrateEN378SavedRecord(item)
  })
});
export default createPlatformModule({
  config,
  schema: runtimeSchema,
  state: transitionAwareState,
  initialState,
  calculate: typedReportAdapter.calculate,
  results: buildEN378SafetyCheckResultModel,
  report: typedReportAdapter.report,
  savedRecords: snapshot => buildEN378SavedRecordsModel(snapshot),
  controller,
  bind
});
