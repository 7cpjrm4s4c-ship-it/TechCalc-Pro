import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createWastewaterDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import {
  bindWastewaterCollections,
  buildWastewaterRecord,
  hydrate,
  wastewaterSavedStats,
  wastewaterSavedSubtitle
} from './controller.js';
import { results } from './results.js';
import { createWastewaterView } from './view.js';

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results
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
