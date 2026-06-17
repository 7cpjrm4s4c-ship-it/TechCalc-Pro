import config from './config.js';
import schema from './schema.js';
import { state, initialState } from './state.js';
import { calculate } from './logic.js';
import { results } from './results.js';
import controller, {
  buildRainwaterRecord,
  rainwaterSavedStats,
  rainwaterSavedSubtitle,
  statePatchFromSurface
} from './controller.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createRainwaterDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createRainwaterView } from './view.js';
import { roofDrainTable } from './tables.js';


function drainLookupPatchFromValue(drainSize = 'DN 100') {
  const preset = roofDrainTable.find(item => item.dn === drainSize)
    || roofDrainTable.find(item => item.dn === 'DN 100')
    || roofDrainTable[0];
  return {
    drainSize: preset?.dn || drainSize || 'DN 100',
    drainSizeManual: preset?.dn || drainSize || 'DN 100',
    drainCapacity: preset?.capacity != null ? String(preset.capacity).replace('.', ',') : '',
    drainHead: preset?.head != null ? String(preset.head) : ''
  };
}

const lineSectionController = createLineSectionController({
  state,
  listKey: 'surfaces',
  activeIdKey: 'activeSurfaceId',
  nameKey: 'areaName',
  expandedIdKey: 'expandedSurfaceResultId',
  recordPrefix: 'rain-surface',
  cardTitle: 'Gespeicherte Flächen',
  nameInputId: 'areaName',
  namePlaceholder: 'z. B. Dachfläche Nord',
  emptyText: 'Noch keine Regenflächen gespeichert.',
  accent: 'green',
  dynamicAttr: 'line-sections',
  title: item => item.name || 'Regenfläche',
  subtitle: rainwaterSavedSubtitle,
  stats: rainwaterSavedStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildRainwaterRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => statePatchFromSurface(item, currentState)
});

const { view, dynamicRenderers } = createRainwaterView({
  config,
  calculate,
  lineSectionController
});

const rainwaterDynamicRenderer = createRainwaterDynamicRenderer({
  calculate,
  lineSectionController,
  ...dynamicRenderers
});

function updateRainwaterDynamic(root, s, meta = {}) {
  rainwaterDynamicRenderer.update(root, s, meta);
}

function isDynamicRainwaterAction(meta = {}) {
  const action = String(meta.action || '');
  return action !== 'initial';
}

function bindRainwaterPlatform(root) {
  lineSectionController.bind(root);

  if (!root || root.__tcRainwaterDrainPrecommitBound) return;
  root.__tcRainwaterDrainPrecommitBound = true;

  const precommitDrain = event => {
    const field = event.target?.closest?.('[data-field="drainSize"]');
    if (!field || !root.contains(field)) return;

    const patch = drainLookupPatchFromValue(field.value || 'DN 100');
    // Precommit silently before the root event pipeline renders. The normal
    // field/change pipeline then performs the notifying render with the complete
    // drain patch already present in state.
    state.set(patch, { action: 'rainwater:drainSize:precommit', notify: false });
  };

  document.addEventListener('input', precommitDrain, true);
  document.addEventListener('change', precommitDrain, true);
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
  bind: bindRainwaterPlatform,
  dynamicUpdate: updateRainwaterDynamic,
  isDynamicAction: isDynamicRainwaterAction
});
