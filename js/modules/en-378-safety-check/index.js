import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { buildEN378SafetyCheckResultModel } from './results.js';
import { buildEN378SafetyCheckReportDto } from './reportAdapter.js';
import { formatRefrigerantLabel, listRefrigerants } from '../../utils/refrigerants/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';

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

export default createPlatformModule({
  config,
  schema: runtimeSchema,
  state,
  initialState,
  calculate,
  results: buildEN378SafetyCheckResultModel,
  report
});
