import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, selectField, resultRows, renderModuleShell, stack, grid, inlineStats, pressureBadge, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';


function pipeSnapshot(s, r){
  const saved = Array.isArray(s.savedPipes) ? s.savedPipes : [];
  const copy = { ...s };
  delete copy.savedPipes; delete copy.activePipeId;
  return {
    id: s.activePipeId || (globalThis.crypto?.randomUUID?.() || `pipe-${Date.now()}-${Math.random().toString(36).slice(2)}`),
    name: s.pipeName?.trim() || `Rohrauslegung ${saved.length + 1}`,
    state: copy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: r && !r.noDimension ? { system: r.system?.label, dn: r.dn, velocity: r.velocity, pressureLoss: r.pressureLoss } : {}
  };
}
function savedPipeRows(s){
  const items = Array.isArray(s.savedPipes) ? s.savedPipes : [];
  if(!items.length) return '<div class="empty-state empty-state--compact">Noch keine Rohrauslegungen gespeichert.</div>';
  return `<div class="line-section-list">${items.map(item => `<article class="line-section-card is-collapsed ${s.activePipeId === item.id ? 'is-active' : ''}" data-line-card data-pipe-load="${esc(item.id)}"><div class="line-section-card__head"><button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false"><strong>${esc(item.name || 'Rohrauslegung')}</strong><span>▾</span></button><button type="button" class="line-section-card__delete" data-pipe-delete="${esc(item.id)}" aria-label="Rohrauslegung löschen">×</button></div><div class="line-section-card__body">${inlineStats([{label:'System', value:item.result?.system || '—'}, {label:'Dimension', value:item.result?.dn ? `DN ${item.result.dn}` : '—'}, {label:'Druckverlust', value:item.result?.pressureLoss ? fmt(item.result.pressureLoss) : '—', unit:item.result?.pressureLoss ? 'Pa/m' : ''}])}</div></article>`).join('')}</div>`;
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
  state,
  mount(root) {
    mountModule(root, state, view, (rootEl, snapshot) => {
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
        state.set({ savedPipes:saved.map(item => String(item.id) === String(id) ? record : item), activePipeId:id, pipeName:record.name });
      });
      rootEl.querySelectorAll('[data-line-toggle]').forEach(toggle => toggle.addEventListener('click', () => {
        const card = toggle.closest('[data-line-card]');
        const collapsed = card?.classList.toggle('is-collapsed');
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      }));
      rootEl.querySelectorAll('[data-pipe-load]').forEach(row => row.addEventListener('click', event => {
        if(event.target.closest('[data-pipe-delete]') || event.target.closest('[data-line-toggle]')) return;
        const current = state.get();
        const item = (current.savedPipes || []).find(entry => String(entry.id) === String(row.dataset.pipeLoad));
        if(!item?.state) return;
        state.set({ ...item.state, savedPipes:current.savedPipes || [], activePipeId:item.id, pipeName:item.name || item.state?.pipeName || '' });
      }));
      rootEl.querySelectorAll('[data-pipe-delete]').forEach(button => button.addEventListener('click', () => {
        const current = state.get();
        const next = (current.savedPipes || []).filter(item => String(item.id) !== String(button.dataset.pipeDelete));
        state.set({ savedPipes:next, activePipeId:String(current.activePipeId) === String(button.dataset.pipeDelete) ? null : current.activePipeId });
      }));
    });
  }
};