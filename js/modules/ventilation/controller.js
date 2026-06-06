import { createLineSectionController } from '../../platform/lineSectionController/index.js';
import { createVentilationDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { fmtInput } from '../../utils/calculations.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import {
  activeCalculationState,
  buildVentilationLineSectionRecord,
  key,
  prefixFor,
  savedVentilationPatch,
  ventilationFormulaText,
  ventilationLineSectionStats
} from './viewModel.js';
import {
  inputFields,
  renderAirStats,
  renderModeSegment,
  renderTargetSegment,
  renderVentilationResult,
  temperatureFields
} from './view.js';
import { grid } from '../../core/renderer.js';

export const ventilationLineSectionController = createLineSectionController({
  state,
  listKey: 'ventLineSections',
  activeIdKey: 'activeVentLineSectionId',
  nameKey: 'activeVentLineSectionName',
  expandedIdKey: 'expandedVentLineSectionId',
  recordPrefix: 'vent',
  cardTitle: 'Leitungsabschnitte',
  nameInputId: 'ventLineSectionName',
  namePlaceholder: 'z. B. Zuluft Büro Nord',
  emptyText: 'Noch keine Leitungsabschnitte angelegt',
  accent: 'cyan',
  dynamicAttr: 'line-sections',
  dynamicDataAttr: 'data-line-dynamic',
  title: item => item.name || 'Abschnitt',
  stats: ventilationLineSectionStats,
  currentResult: () => calculate(activeCalculationState(state.get())),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildVentilationLineSectionRecord(
    currentState,
    result,
    activeCalculationState(currentState),
    currentState.mode === 'cooling' ? 'Kälte' : 'Heizung',
    items,
    id,
    name,
    existing
  ),
  hydrateRecord: ({ item, currentState }) => savedVentilationPatch(item, currentState)
});

const ventilationDynamicRenderer = createVentilationDynamicRenderer({
  calculate,
  activeCalculationState,
  prefixFor,
  key,
  fmtInput,
  lineSectionController: ventilationLineSectionController,
  renderTemperatures: (s, _r, active) => temperatureFields(s, active),
  renderModeSegment: (s, _r, _active, accent) => renderModeSegment(s, accent),
  renderTargetSegment: (s, _r, active, accent) => renderTargetSegment(s, active, accent),
  renderInputFields: (s, _r, active) => grid(inputFields(s, active).join(''), 2),
  renderResult: (s, r, active, accent) => renderVentilationResult(s, r, active, accent),
  renderAirStats: (_s, r) => renderAirStats(r),
  renderFormula: (_s, r) => ventilationFormulaText(r)
});

export function updateVentilationDynamic(root, s, meta = {}) {
  ventilationDynamicRenderer.update(root, s, meta);
}

export function isDynamicVentilationAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export function bindVentilationPlatform(root) {
  ventilationLineSectionController.bind(root);
}

