import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createWastewaterDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import {
  bindWastewaterPlatform,
  buildWastewaterRecord,
  hydrate,
  isDynamicWastewaterAction,
  wastewaterSavedStats,
  wastewaterSavedSubtitle
} from './controller.js';
import { createWastewaterView } from './view.js';

const lineSectionController = createLineSectionController({
  state,
  listKey: 'savedCalculations',
  activeIdKey: 'activeCalculationId',
  nameKey: 'name',
  expandedIdKey: 'expandedCalculationId',
  recordPrefix: 'wastewater',
  cardTitle: 'Gespeicherte Berechnungen',
  nameLabel: 'Bezeichnung',
  nameInputId: 'name',
  namePlaceholder: 'z. B. Strang WC-Kern Nord',
  emptyText: 'Noch keine Schmutzwasser-Berechnungen gespeichert.',
  accent: 'green',
  dynamicAttr: 'line-sections',
  title: item => item.name || 'Berechnung',
  subtitle: wastewaterSavedSubtitle,
  stats: wastewaterSavedStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildWastewaterRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => hydrate(item, currentState)
});

const { view, dynamicRenderers } = createWastewaterView(config, calculate, lineSectionController);

const wastewaterDynamicRenderer = createWastewaterDynamicRenderer({
  calculate,
  lineSectionController,
  ...dynamicRenderers
});

function bind(root) {
  bindWastewaterPlatform(root, lineSectionController);
}

function dynamicUpdate(root, s, meta = {}) {
  wastewaterDynamicRenderer.update(root, s, meta);
}

export default createPlatformModule({
  config,
  schema,
  state,
  initialState,
  calculate,
  view,
  bind,
  dynamicUpdate,
  isDynamicAction: isDynamicWastewaterAction
});
