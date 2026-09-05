import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createWastewaterDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter, buildGenericModuleReportDto } from '../../core/typedDtoReportAdapter.js';
import {
  bindWastewaterCollections,
  buildWastewaterRecord,
  hydrate,
  wastewaterSavedStats,
  wastewaterSavedSubtitle
} from './controller.js';
import { results } from './results.js';
import { createWastewaterView } from './view.js';

function enrichedSavedCalculations(savedCalculations = []) {
  return savedCalculations.map((record, index, items) => {
    const recordState = record?.state && typeof record.state === 'object' ? record.state : record?.input;
    if (!recordState || typeof recordState !== 'object') return record;
    const result = calculate(recordState);
    return buildWastewaterRecord(
      recordState,
      result,
      items,
      record.id || `wastewater-${index + 1}`,
      record.name || record.title || recordState.name,
      record
    );
  });
}

function buildWastewaterReportDto(context = {}) {
  const snapshot = context.state || {};
  return buildGenericModuleReportDto({
    ...context,
    state: {
      ...snapshot,
      savedCalculations: enrichedSavedCalculations(snapshot.savedCalculations || [])
    }
  });
}

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results,
  buildReportDto: buildWastewaterReportDto
});
const calculateForReport = typedReportAdapter.calculate;
const lineSectionController = createLineSectionController({
  state,
  listKey: 'savedCalculations',
  activeIdKey: 'activeCalculationId',
  nameKey: 'name',
  expandedIdKey: 'expandedCalculationId',
  recordPrefix: 'wastewater',
  cardTitle: 'Gespeicherte Berechnungen',
  nameInputId: 'name',
  namePlaceholder: 'z. B. Strang WC-Kern Nord',
  emptyText: 'Noch keine Schmutzwasser-Berechnungen gespeichert.',
  accent: 'green',
  dynamicAttr: 'line-sections',
  title: item => item.name || 'Berechnung',
  subtitle: wastewaterSavedSubtitle,
  stats: wastewaterSavedStats,
  currentResult: () => calculateForReport(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildWastewaterRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => hydrate(item, currentState)
});
const { view, dynamicRenderers } = createWastewaterView(config, calculateForReport, lineSectionController);

const wastewaterDynamicRenderer = createWastewaterDynamicRenderer({
  calculate: calculateForReport,
  lineSectionController,
  ...dynamicRenderers
});

function updateWastewaterDynamic(root, s, meta = {}) {
  wastewaterDynamicRenderer.update(root, s, meta);
}

function isDynamicWastewaterAction(meta = {}) {
  const action = String(meta.action || '');
  return action !== 'initial';
}
function bindWastewaterPlatform(root) {
  lineSectionController.bind(root);
  bindWastewaterCollections(root);
}

export default createPlatformModule({
  config,
  schema,
  state,
  initialState,
  calculate: calculateForReport,
  view,
  bind: bindWastewaterPlatform,
  dynamicUpdate: updateWastewaterDynamic,
  isDynamicAction: isDynamicWastewaterAction,
  report: typedReportAdapter.report
});
