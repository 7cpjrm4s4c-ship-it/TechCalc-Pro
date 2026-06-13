import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { results } from './results.js';
import controller, {
  bindRainwaterPlatform,
  buildRainwaterRecord,
  isDynamicRainwaterAction,
  rainwaterSavedStats,
  rainwaterSavedSubtitle,
  statePatchFromSurface,
  updateRainwaterDynamic
} from './controller.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createRainwaterView } from './view.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';

const lineSectionController = createLineSectionController({
  state,
  listKey: 'surfaces',
  activeIdKey: 'activeSurfaceId',
  nameKey: 'areaName',
  expandedIdKey: 'expandedSurfaceResultId',
  recordPrefix: 'rain-surface',
  cardTitle: 'Gespeicherte Flächen',
  nameLabel: 'Bezeichnung',
  nameInputId: 'areaName',
  namePlaceholder: 'z. B. Dachfläche Nord',
  emptyText: 'Noch keine Regenflächen gespeichert.',
  accent: 'green',
  dynamicAttr: 'line-sections',
  dynamicDataAttr: 'data-line-dynamic',
  title: item => item.name || 'Regenfläche',
  subtitle: rainwaterSavedSubtitle,
  stats: rainwaterSavedStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildRainwaterRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => statePatchFromSurface(item, currentState)
});

const { view } = createRainwaterView({
  config,
  calculate,
  lineSectionController
});

function bind(root) {
  bindRainwaterPlatform(root, lineSectionController);
}

function dynamicUpdate(root, s, meta = {}) {
  updateRainwaterDynamic(root, s, meta, lineSectionController);
}

export default createPlatformModule({
  config,
  schema,
  state,
  initialState,
  calculate,
  results,
  controller,
  view,
  bind,
  dynamicUpdate,
  isDynamicAction: isDynamicRainwaterAction
});
