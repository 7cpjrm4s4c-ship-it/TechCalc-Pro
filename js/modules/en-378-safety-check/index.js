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
import { formatRefrigerantLabel, listRefrigerants } from '../../utils/refrigerants/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { bindFGasesSnapshotImport } from './importController.js';

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

function report(snapshot = state.get()) {
  return buildEN378SafetyCheckReportDto({
    state: snapshot,
    calculation: calculate(snapshot)
  });
}

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
  state,
  initialState,
  calculate,
  results: buildEN378SafetyCheckResultModel,
  report,
  savedRecords: snapshot => buildEN378SavedRecordsModel(snapshot),
  controller,
  bind
});
