import config from './config.js';
import schema from './schema.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, resultRows, renderModuleShell, stack, grid, inlineStats, pressureBadge, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';
import { createRecordId, isSameId, replaceRecord, removeRecord, renderSavedRecordList, bindSavedRecordList, bindEditModeClear } from '../../core/savedRecords.js';


function pipeSnapshot(s, r){
  const saved = Array.isArray(s.savedPipes) ? s.savedPipes : [];
  const copy = { ...s };
  delete copy.savedPipes; delete copy.activePipeId;
  return {
    id: s.activePipeId || createRecordId('pipe'),
    name: s.pipeName?.trim() || `Rohrauslegung ${saved.length + 1}`,
    state: copy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: r && !r.noDimension ? { system: r.system?.label, dn: r.dn, velocity: r.velocity, pressureLoss: r.pressureLoss, massFlowKgh: s.flowUnit === 'kg/h' ? s.flowValue : s.massFlowKgh, volumeFlowM3h: s.flowUnit === 'm³/h' ? s.flowValue : s.volumeFlowM3h } : { massFlowKgh: s.flowUnit === 'kg/h' ? s.flowValue : s.massFlowKgh, volumeFlowM3h: s.flowUnit === 'm³/h' ? s.flowValue : s.volumeFlowM3h }
  };
}
function savedPipeRows(s){
  const items = Array.isArray(s.savedPipes) ? s.savedPipes : [];
  return renderSavedRecordList(items, {
    activeId: s.activePipeId,
    emptyText: 'Noch keine Rohrauslegungen gespeichert.',
    loadAttr: 'data-pipe-load',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-pipe-delete',
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
  return card('Rohrauslegung speichern', stack([
    field({ id:'pipeName', label:'Bezeichnung', value:s.pipeName || '', placeholder:'z. B. Hauptleitung Technik', inputmode:'text' }),
    `<div class="tc-save-actions"><button type="button" class="action-button" data-pipe-save ${s.activePipeId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-pipe-update ${s.activePipeId ? '' : 'disabled'}>Aktualisieren</button></div>`,
    savedPipeRows(s)
  ].join('')), 'blue');
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
export default {
  config,
  schema,
  state,
  mount(root) {
    return mountModule(root, state, view, (rootEl, snapshot) => {
      rootEl.querySelector('[data-pipe-save]')?.addEventListener('click', () => {
        const current = state.get();
        const result = calculate(current);
        const saved = Array.isArray(current.savedPipes) ? current.savedPipes : [];
        const record = pipeSnapshot({ ...current, activePipeId:null }, result);
        state.set({ savedPipes:[record, ...saved], activePipeId:null, pipeName:'' });
      });
      rootEl.querySelector('[data-pipe-update]')?.addEventListener('click', () => {
        const current = state.get();
        const id = current.activePipeId;
        if(!id) return;
        const saved = Array.isArray(current.savedPipes) ? current.savedPipes : [];
        const existing = saved.find(item => String(item.id) === String(id));
        if(!existing) return;
        const record = { ...pipeSnapshot(current, calculate(current)), id, createdAt: existing.createdAt || new Date().toISOString() };
        state.set({ savedPipes:replaceRecord(saved, id, record), activePipeId:id, pipeName:record.name });
      });
      bindSavedRecordList(rootEl, {
        loadAttr: 'data-pipe-load',
        toggleAttr: 'data-line-toggle',
        deleteAttr: 'data-pipe-delete',
        onLoad(id) {
          const current = state.get();
          const item = (current.savedPipes || []).find(entry => isSameId(entry.id, id));
          if(!item?.state) return;
          state.set({ ...item.state, savedPipes:current.savedPipes || [], activePipeId:item.id, pipeName:item.name || item.state?.pipeName || '' });
        },
        onDelete(id) {
          const current = state.get();
          const next = removeRecord(current.savedPipes || [], id);
          state.set({ savedPipes:next, activePipeId:isSameId(current.activePipeId, id) ? null : current.activePipeId, pipeName:isSameId(current.activePipeId, id) ? '' : current.pipeName });
        }
      });
      rootEl.addEventListener('click', event => {
        if (!state.get().activePipeId) return;
        if (event.target.closest('[data-pipe-load], [data-pipe-save], [data-pipe-update], [data-pipe-delete], [data-line-toggle], input, select, textarea, button')) return;
        state.set({ activePipeId:null, pipeName:'' });
      });
    });
  }
};
