import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { buildGenericModuleReportDto, createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { bindBufferStorageActions, buildBufferRecord } from './controller.js';
import { buildBufferStorageResultModel } from './results.js';
import { isDynamicBufferStorageAction, renderView, updateBufferStorageDynamic } from './view.js';

function normalizeSavedBuffers(snapshot = {}) {
  const legacy = Array.isArray(snapshot.savedCalculations) ? snapshot.savedCalculations : [];
  const savedBuffers = Array.isArray(snapshot.savedBuffers) && snapshot.savedBuffers.length ? snapshot.savedBuffers : legacy;
  if (!savedBuffers.length) return snapshot;
  return {
    ...snapshot,
    savedBuffers: savedBuffers.map((item, index) => {
      const recordState = item?.state && typeof item.state === 'object' ? item.state : null;
      if (!recordState) return item;
      const result = calculate(recordState);
      return buildBufferRecord(
        recordState,
        result,
        savedBuffers,
        item.id || `buffer-${index + 1}`,
        item.name || recordState.plantName || `Pufferspeicher ${index + 1}`,
        item
      );
    })
  };
}

function buildBufferStorageReportDto(context = {}) {
  return buildGenericModuleReportDto({
    ...context,
    state: normalizeSavedBuffers(context.state)
  });
}

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results: (snapshot, result) => buildBufferStorageResultModel(snapshot, result),
  buildReportDto: buildBufferStorageReportDto
});
const calculateForReport = typedReportAdapter.calculate;

function renderTypedView(snapshot) {
  calculateForReport(snapshot);
  return renderView(snapshot);
}

function updateTypedDynamic(root, snapshot, meta = {}) {
  calculateForReport(snapshot);
  updateBufferStorageDynamic(root, snapshot, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate: calculateForReport,
  view: renderTypedView,
  bind: bindBufferStorageActions,
  dynamicUpdate: updateTypedDynamic,
  isDynamicAction: isDynamicBufferStorageAction,
  report: typedReportAdapter.report
});
