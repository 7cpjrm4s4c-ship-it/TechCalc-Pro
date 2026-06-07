import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, renderModuleShell, stack } from '../../core/renderer.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { createPipeSizingDynamicRenderer } from '../../platform/dynamicRenderer/index.js';
import { fmt } from '../../utils/calculations.js';
import { renderResultModel } from '../../platform/resultRenderer/index.js';
import { buildPipeSizingResultModel } from './results.js';
import { pipeSystems } from '../../utils/pipes.js';
import { createLineSectionController } from '../../platform/lineSectionController/index.js';


function savedPipeStats(item = {}){
  return [
    {label:'System', value:item.result?.system || '—'},
    {label:'Dimension', value:item.result?.dn ? `DN ${item.result.dn}` : '—'},
    {label:'Druckverlust', value:item.result?.pressureLoss ? fmt(item.result.pressureLoss) : '—', unit:item.result?.pressureLoss ? 'Pa/m' : ''},
    {label:'Massenstrom', value:item.result?.massFlowKgh || '—', unit:item.result?.massFlowKgh ? 'kg/h' : ''},
    {label:'Volumenstrom', value:item.result?.volumeFlowM3h || '—', unit:item.result?.volumeFlowM3h ? 'm³/h' : ''}
  ];
}

function buildPipeRecord(currentState, result, items, id, name, existing = null){
  const copy = { ...currentState };
  delete copy.savedPipes;
  delete copy.activePipeId;
  delete copy.expandedPipeId;
  return {
    id,
    name: name || currentState.pipeName?.trim() || existing?.name || `Rohrauslegung ${items.length + 1}`,
    state: copy,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: result && !result.noDimension
      ? {
          system: result.system?.label,
          dn: result.dn,
          velocity: result.velocity,
          pressureLoss: result.pressureLoss,
          massFlowKgh: currentState.flowUnit === 'kg/h' ? currentState.flowValue : currentState.massFlowKgh,
          volumeFlowM3h: currentState.flowUnit === 'm³/h' ? currentState.flowValue : currentState.volumeFlowM3h
        }
      : {
          massFlowKgh: currentState.flowUnit === 'kg/h' ? currentState.flowValue : currentState.massFlowKgh,
          volumeFlowM3h: currentState.flowUnit === 'm³/h' ? currentState.flowValue : currentState.volumeFlowM3h
        }
  };
}

function hydrateSavedPipe(item, current) {
  return item?.state ? {
    ...item.state,
    savedPipes: current.savedPipes || [],
    activePipeId: item.id,
    expandedPipeId: current.expandedPipeId || null,
    pipeName: item.name || item.state?.pipeName || ''
  } : {};
}

const pipeSizingSavedController = createLineSectionController({
  state,
  listKey: 'savedPipes',
  activeIdKey: 'activePipeId',
  nameKey: 'pipeName',
  expandedIdKey: 'expandedPipeId',
  recordPrefix: 'pipe',
  cardTitle: 'Rohrauslegung speichern',
  nameLabel: 'Bezeichnung',
  nameInputId: 'pipeName',
  namePlaceholder: 'z. B. Hauptleitung Technik',
  emptyText: 'Noch keine Rohrauslegungen gespeichert.',
  accent: 'blue',
  dynamicAttr: 'saved-records',
  dynamicDataAttr: 'data-pipe-dynamic',
  title: item => item.name || 'Rohrauslegung',
  stats: savedPipeStats,
  currentResult: () => calculate(state.get()),
  buildRecord: ({ currentState, result, items, id, name, existing }) => buildPipeRecord(currentState, result, items, id, name, existing),
  hydrateRecord: ({ item, currentState }) => hydrateSavedPipe(item, currentState)
});

function pipeSaveCard(s){
  return pipeSizingSavedController.renderCard(s);
}

function inputContent(s) {
  return stack([
    selectField({ id: 'systemId', label: 'Rohrsystem', value: s.systemId, options: pipeSystems.map(p => ({ value: p.id, label: p.label })) }),
    field({ id: 'maxPressurePam', label: 'Max. Druckverlust', unit: 'Pa/m', value: s.maxPressurePam }),
    field({
      id: 'flowValue',
      label: 'Massenstrom / Volumenstrom',
      unit: s.flowUnit || 'kg/h',
      unitField: 'flowUnit',
      unitOptions: [
        { value: 'kg/h', label: 'kg/h' },
        { value: 'm³/h', label: 'm³/h' }
      ],
      value: s.flowValue || s.massFlowKgh || s.volumeFlowM3h || ''
    })
  ].join(''));
}

function resultContent(s, r) {
  return renderResultModel(buildPipeSizingResultModel(s, r, 'blue'), 'blue');
}

function view(s) {
  const r = calculate(s);
  const inputCard = card('Basisdaten', `<div data-pipe-dynamic="input">${inputContent(s)}</div>`, 'blue');
  const outputCard = resultContent(s, r);

  return renderModuleShell(config, `
    <div class="span-6">${inputCard}<div class="formula">≤ DN50: DIN EN 10255 · ≥ DN65: DIN EN 10220</div><div data-pipe-dynamic="saved-records">${pipeSaveCard(s)}</div></div>
    <div class="span-6"><div data-pipe-dynamic="result">${outputCard}</div><div class="formula">Auslegung nach Druckverlustgrenze</div></div>
  `);
}
function bindPipeSizingActions(root) {
  pipeSizingSavedController.bind(root);
}

const pipeSizingDynamicRenderer = createPipeSizingDynamicRenderer({
  calculate,
  renderInput: inputContent,
  renderSavedPanel: pipeSaveCard,
  renderResult: resultContent
});

function updatePipeSizingDynamic(root, s, meta = {}) {
  pipeSizingDynamicRenderer.update(root, s, meta);
}

function isDynamicPipeSizingAction(meta = {}) {
  return String(meta.action || '') !== 'initial';
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: bindPipeSizingActions,
  dynamicUpdate: updatePipeSizingDynamic,
  isDynamicAction: isDynamicPipeSizingAction
});
