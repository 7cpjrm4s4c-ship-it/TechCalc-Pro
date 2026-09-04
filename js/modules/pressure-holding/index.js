import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { buildGenericModuleReportDto, createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { createPressureHoldingDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { fmtInput } from '../../utils/calculations.js';
import { bindPressureHoldingActions, buildPressureRecord, savedPlantsCard } from './controller.js';
import { buildPressureHoldingResultModel } from './results.js';
import { view } from './view.js';
import {
  basisContent,
  volumeFieldsContent,
  pressureFieldsContent,
  holdingOptionsContent,
  resultContent
} from './viewModel.js';

function normalizeSavedPressurePlants(snapshot = {}) {
  const savedPlants = Array.isArray(snapshot.savedPlants) ? snapshot.savedPlants : [];
  if (!savedPlants.length) return snapshot;
  return {
    ...snapshot,
    savedPlants: savedPlants.map((item, index) => {
      const recordState = item?.state && typeof item.state === 'object' ? item.state : null;
      if (!recordState) return item;
      const result = calculate(recordState);
      return buildPressureRecord(
        recordState,
        result,
        savedPlants,
        item.id || `pressure-${index + 1}`,
        item.name || recordState.plantName || `Anlage ${index + 1}`,
        item
      );
    })
  };
}

function buildPressureHoldingReportDto(context = {}) {
  return buildGenericModuleReportDto({
    ...context,
    state: normalizeSavedPressurePlants(context.state)
  });
}

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results: (snapshot, result) => buildPressureHoldingResultModel(snapshot, result),
  buildReportDto: buildPressureHoldingReportDto
});
const calculateForReport = typedReportAdapter.calculate;
const pressureHoldingDynamicRenderer = createPressureHoldingDynamicRenderer({
  calculate: calculateForReport,
  fmtInput,
  renderBasis: basisContent,
  renderVolumeFields: volumeFieldsContent,
  renderPressureFields: pressureFieldsContent,
  renderHoldingOptions: holdingOptionsContent,
  renderSavedPanel: savedPlantsCard,
  renderResult: resultContent
});

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return view(snapshot);
}

function updatePressureHoldingDynamic(root, snapshot, meta = {}) {
  pressureHoldingDynamicRenderer.update(root, snapshot, meta);
}
function isDynamicPressureHoldingAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: root => bindPressureHoldingActions(root, { state, calculate: calculateForReport }),
  dynamicUpdate: updatePressureHoldingDynamic,
  isDynamicAction: isDynamicPressureHoldingAction,
  report: typedReportAdapter.report
});
