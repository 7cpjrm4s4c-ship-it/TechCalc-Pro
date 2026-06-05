import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { fmtInput } from '../../utils/calculations.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createHeatingCoolingDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createHeatingCoolingView } from './view.js';
import {
  activeCalculationState,
  activeMassFlowUnit,
  activeValue,
  buildLineSectionRecord,
  formatMassFlowInput,
  hydrateLineSectionState,
  key,
  lineSectionStats,
  prefixFor
} from './controller.js';


const lineSectionController = createLineSectionController({
  state,
  listKey: 'lineSections',
  activeIdKey: 'activeLineSectionId',
  nameKey: 'activeLineSectionName',
  expandedIdKey: 'expandedLineSectionId',
  recordPrefix: 'line',
  cardTitle: 'Leitungsabschnitte',
  nameInputId: 'lineSectionName',
  namePlaceholder: 'z. B. Verteilerabgang Nord',
  emptyText: 'Noch keine Leitungsabschnitte angelegt',
  accent: 'blue',
  dynamicAttr: 'line-sections',
  title: item => item.name || 'Abschnitt',
  stats: lineSectionStats,
  currentResult: () => calculate(activeCalculationState(state.get())),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildLineSectionRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => hydrateLineSectionState(item, currentState)
});

export function readLineSections() {
  return lineSectionController.read();
}

export function writeLineSections(items) {
  lineSectionController.write(items);
}

const { view, dynamicRenderers } = createHeatingCoolingView({
  config,
  calculate,
  lineSectionController
});


const heatingCoolingDynamicRenderer = createHeatingCoolingDynamicRenderer({
  calculate,
  activeCalculationState,
  prefixFor,
  key,
  activeValue,
  activeMassFlowUnit,
  formatMassFlowInput,
  fmtInput,
  lineSectionController,
  ...dynamicRenderers
});

function updateHeatingCoolingDynamic(root, s, meta = {}) {
  heatingCoolingDynamicRenderer.update(root, s, meta);
}

function isDynamicHeatingCoolingAction(meta = {}) {
  const action = String(meta.action || '');
  // After the initial mount Heizung/Kälte is store-first: even structural
  // actions update named dynamic islands instead of replacing the full module.
  return action !== 'initial';
}

function bindHeatingCoolingPlatform(root) {
  lineSectionController.bind(root);
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: bindHeatingCoolingPlatform,
  dynamicUpdate: updateHeatingCoolingDynamic,
  isDynamicAction: isDynamicHeatingCoolingAction
});
