import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { buildFGasesResultModel } from './results.js';
import { buildFGasesReportDto } from './reportAdapter.js';
import { buildFGasesSavedRecord, hydrateFGasesSavedRecord, buildFGasesSavedRecordsModel } from './savedRecords.js';
import { listRefrigerants } from '../../utils/refrigerants/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';

const refrigerantOptions = Object.freeze([
  Object.freeze({ value: '', label: 'Bitte wählen' }),
  ...listRefrigerants().map(item => Object.freeze({ value: item.id, label: item.name || item.id }))
]);

const runtimeSchema = Object.freeze({
  ...schema,
  fields: Object.freeze(schema.fields.map(field => field.key === 'refrigerantId'
    ? Object.freeze({ ...field, options: refrigerantOptions })
    : field))
});

function report(snapshot = state.get()) {
  return buildFGasesReportDto({ state: snapshot, calculation: calculate(snapshot) });
}

const controller = Object.freeze({
  savedRecords: Object.freeze({
    enabled: true,
    listKey: 'savedSystems',
    activeIdKey: 'activeSavedSystemId',
    expandedIdKey: 'expandedSavedSystemId',
    nameKey: 'savedSystemName',
    recordPrefix: 'f-gases-system',
    attrs: Object.freeze({
      loadAttr: 'data-saved-load',
      toggleAttr: 'data-saved-toggle',
      deleteAttr: 'data-saved-delete'
    }),
    snapshot: (current, result, existing) => buildFGasesSavedRecord(current, result, existing),
    hydrate: item => hydrateFGasesSavedRecord(item)
  })
});

export default createPlatformModule({
  config,
  schema: runtimeSchema,
  state,
  initialState,
  calculate,
  results: buildFGasesResultModel,
  report,
  savedRecords: snapshot => buildFGasesSavedRecordsModel(snapshot),
  controller
});
