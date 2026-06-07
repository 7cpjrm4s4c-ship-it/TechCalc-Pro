import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, resultRows, renderModuleShell, stack, grid, pressureBadge } from '../../core/renderer.js';
import { createPlatformModule } from '../../platform/moduleRuntime/index.js';
import { fmt } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';
import { createRecordId, renderSavedRecordList, renderSavedRecordPanel, bindEditModeClear } from '../../core/savedRecords.js';
import { createSavedRecordActions } from '../../core/savedRecordController.js';
import { commitAllFields, registerCentralActions } from '../../core/eventPipeline.js';


function pipeSnapshot(s, r){
  const saved = Array.isArray(s.savedPipes) ? s.savedPipes : [];
  const copy = { ...s };
  delete copy.savedPipes; delete copy.activePipeId; delete copy.expandedPipeId;
  return {
    id: s.activePipeId || createRecordId('pipe'),
    name: s.pipeName?.trim() || `Rohrauslegung ${saved.length + 1}`,
    state: copy,
    createdAt: s.activePipeId ? (saved.find(x => x.id === s.activePipeId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: r && !r.noDimension ? { system: r.system?.label, dn: r.dn, velocity: r.velocity, pressureLoss: r.pressureLoss, massFlowKgh: s.flowUnit === 'kg/h' ? s.flowValue : s.massFlowKgh, volumeFlowM3h: s.flowUnit === 'm³/h' ? s.flowValue : s.volumeFlowM3h } : { massFlowKgh: s.flowUnit === 'kg/h' ? s.flowValue : s.massFlowKgh, volumeFlowM3h: s.flowUnit === 'm³/h' ? s.flowValue : s.volumeFlowM3h }
  };
}
function savedPipeRows(s){
  const items = Array.isArray(s.savedPipes) ? s.savedPipes : [];
  return renderSavedRecordList(items, {
    activeId: s.activePipeId,
    expandedId: s.expandedPipeId,
    emptyText: 'Noch keine Rohrauslegungen gespeichert.',
    title: item => item.name || 'Rohrauslegung',
    stats: item => [
      {label:'System', value:item.result?.system || '—'},
      {label:'Dimension', value:item.result?.dn ? `DN ${item.result.dn}` : '—'},
      {label:'Druckverlust', value:item.result?.pressureLoss ? fmt(item.result.pressureLoss) : '—', unit:item.result?.pressureLoss ? 'Pa/m' : ''},
      {label:'Massenstrom', value:item.result?.massFlowKgh || '—', unit:item.result?.massFlowKgh ? 'kg/h' : ''},
      {label:'Volumenstrom', value:item.result?.volumeFlowM3h || '—', unit:item.result?.volumeFlowM3h ? 'm³/h' : ''}
    ]
  });
}
function pipeSaveCard(s){
  return renderSavedRecordPanel({
    title: 'Rohrauslegung speichern',
    nameFieldId: 'pipeName',
    nameLabel: 'Bezeichnung',
    nameValue: s.pipeName || '',
    namePlaceholder: 'z. B. Hauptleitung Technik',
    addAction: 'pipe:save',
    updateAction: 'pipe:update',
    addDisabled: Boolean(s.activePipeId),
    updateDisabled: !s.activePipeId,
    listHtml: savedPipeRows(s),
    accent: 'blue'
  });
}

function pipeDimensionCards(r) {
  if (!r || r.noDimension) return '';
  const list = [r.smaller, r, r.larger].filter(Boolean);
  const max = Number(r.maxPressurePam || 100);
  return `<div class="pipe-dimension-list">${list.map(item => {
    const ratio = max ? item.pressureLoss / max : 0;
    const percent = Math.max(0, Math.min(ratio * 100, 100));
    const key = item.rating?.key || (ratio < .75 ? 'green' : ratio <= 1 ? 'yellow' : 'red');
    const isRecommended = item.dn === r.dn;
    const label = isRecommended ? 'Empfohlen' : (item.dn < r.dn ? 'Eine DN kleiner' : 'Eine DN größer');
    const dimension = item.dimension ? `Ø ${item.dimension} mm` : `di ${fmt(item.di, 1)} mm`;
    return `<div class="pipe-dimension-card pipe-dimension-card--${key}${isRecommended ? ' is-recommended' : ''}">
      <div class="pipe-dimension-card__head"><span>${label}</span>${isRecommended ? '<small>★</small>' : ''}</div>
      <strong>DN ${item.dn}</strong>
      <div class="pipe-dimension-card__meta"><span>${dimension}</span><span>di ${fmt(item.di, 1)} mm</span><span>${fmt(item.velocity)} m/s</span><span>${fmt(item.pressureLoss)} Pa/m</span></div>
      <div class="pipe-bar"><span style="width:${percent}%"></span></div>
    </div>`;
  }).join('')}</div>`;
}

function view(s) {
  const r = calculate(s);
  const inputCard = card('Basisdaten', stack([
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
  ].join('')), 'blue');

  const outputBody = !r
    ? '<div class="empty-state">Volumenstrom oder Massenstrom eingeben →</div>'
    : r.noDimension
      ? '<div class="empty-state">Keine Dimensionierung möglich!</div>'
      : stack([
          `<div class="pipe-result-head"><span>Empfohlene DN</span><strong>DN ${r.dn}</strong>${pressureBadge(r)}</div>`,
          resultRows([
            { label: 'Geschwindigkeit', value: fmt(r.velocity), unit: 'm/s' },
            { label: 'Druckverlust', value: fmt(r.pressureLoss), unit: 'Pa/m' },
            { label: 'Norm', value: r.norm }
          ]),
          pipeDimensionCards(r)
        ].join(''));

  const outputCard = card(`Ergebnis — ${r?.system?.label ?? 'Rohrsystem'}`, outputBody, 'blue');

  return renderModuleShell(config, `
    <div class="span-6">${inputCard}<div class="formula">≤ DN50: DIN EN 10255 · ≥ DN65: DIN EN 10220</div>${pipeSaveCard(s)}</div>
    <div class="span-6">${outputCard}<div class="formula">Auslegung nach Druckverlustgrenze</div></div>
  `);
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

function clearSavedPipe() {
  return { activePipeId: null, pipeName: '' };
}

function bindPipeSizingActions(root) {
  bindEditModeClear(root, {
    state,
    activeIdKey: 'activePipeId',
    nameKey: 'pipeName'
  });

  const actions = createSavedRecordActions({
    root,
    state,
    calculate,
    snapshot: (current, result, existing) => ({
      ...pipeSnapshot(current, result),
      ...(existing ? { id: existing.id, createdAt: existing.createdAt } : {})
    }),
    hydrate: hydrateSavedPipe,
    clear: clearSavedPipe,
    listKey: 'savedPipes',
    activeIdKey: 'activePipeId',
    expandedIdKey: 'expandedPipeId',
    nameKey: 'pipeName',
    recordPrefix: 'pipe',
    beforeCreate: ({ root: host }) => commitAllFields(host || root, state, { action: 'pipe:pre-save', notify: false }),
    beforeUpdate: ({ root: host }) => commitAllFields(host || root, state, { action: 'pipe:pre-update', notify: false }),
    preserveSaveScroll: true,
    preserveLoadScroll: true
  });

  registerCentralActions(root, {
    'pipe:save': actions.save,
    'pipe:update': actions.update,
    'saved:load': actions.load,
    'saved:delete': actions.delete,
    'saved:toggle': actions.toggle
  });
}

export default createPlatformModule({
  config,
  schema,
  state,
  calculate,
  view,
  bind: bindPipeSizingActions
});
