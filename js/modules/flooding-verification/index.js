import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './calculationAdapter.js';
import { results } from './results.js';
import { buildFloodingReportDto } from './reportAdapter.js';
import controller, {
  buildFloodingSurfaceRecord,
  hydrateFloodingSurfaceRecord,
  floodingSurfaceSubtitle,
  floodingSurfaceStats,
  bindFloodingController
} from './controller.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createTypedDtoReportAdapter } from '../../core/typedDtoReportAdapter.js';
import { createFloodingVerificationView } from './view.js';
import { createFloodingDynamicRenderer } from './dynamicRenderer.js';

const typedReportAdapter = createTypedDtoReportAdapter({
  config,
  schema,
  state,
  calculate,
  results,
  buildReportDto: buildFloodingReportDto
});
const calculateForReport = typedReportAdapter.calculate;
const surfaceController = createLineSectionController({
  state,
  listKey: 'surfaces',
  activeIdKey: 'activeSurfaceId',
  nameKey: 'surfaceName',
  expandedIdKey: 'expandedSurfaceId',
  recordPrefix: 'flood-surface',
  cardTitle: 'Gespeicherte Flächen',
  nameInputId: 'surfaceName',
  namePlaceholder: 'z. B. Dachfläche Nord',
  emptyText: 'Noch keine Dach- oder Grundstücksflächen gespeichert.',
  accent: 'green',
  dynamicAttr: 'flooding-surfaces',
  dynamicDataAttr: 'data-flooding-line-dynamic',
  title: item => item.name || 'Fläche',
  subtitle: floodingSurfaceSubtitle,
  stats: floodingSurfaceStats,
  currentResult: () => calculateForReport(state.get()),
  buildRecord: args => buildFloodingSurfaceRecord(args),
  hydrateRecord: args => hydrateFloodingSurfaceRecord(args)
});
const floodingView = createFloodingVerificationView({ config, calculate: calculateForReport, results, lineSectionController: surfaceController });
const floodingDynamicRenderer = createFloodingDynamicRenderer({
  calculate: calculateForReport,
  renderSurfaceForm: floodingView.renderSurfaceForm,
  renderCalculationForm: floodingView.renderCalculationForm,
  renderResult: floodingView.renderResult,
  lineSectionController: surfaceController
});

function bindFloodingPlatform(root) {
  bindFloodingController(root, state, surfaceController);
}
export default createPlatformModule({
  config,
  schema,
  state,
  initialState,
  calculate: calculateForReport,
  results,
  report: typedReportAdapter.report,
  controller,
  view: floodingView.view,
  bind: bindFloodingPlatform,
  dynamicUpdate: (root, snapshot, meta) => floodingDynamicRenderer.update(root, snapshot, meta),
  isDynamicAction: meta => String(meta?.action || '') !== 'initial'
});
