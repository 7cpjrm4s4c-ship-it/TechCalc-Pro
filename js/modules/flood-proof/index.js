import config from './config.js';
import { state, initialState } from './state.js';
import { calculate, toNumber } from './logic.js';
import { card, field, renderModuleShell, stack, grid, mainResult, resultRows, esc } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { bindEditModeClear } from '../../core/savedRecords.js';

const KOSTRA_URL = 'https://www.openko.de';

const fmtDecimalInput = (value, digits = 1) => {
  if (value === '' || value === null || value === undefined) return '';
  const n = toNumber(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

function savedSnapshot(current, result) {
  const saved = Array.isArray(current.savedCalculations) ? current.savedCalculations : [];
  const copy = { ...current };
  delete copy.savedCalculations;
  delete copy.activeCalculationId;
  return {
    id: current.activeCalculationId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: current.name?.trim() || `Überflutungsnachweis ${saved.length + 1}`,
    createdAt: current.activeCalculationId ? (saved.find(x => String(x.id) === String(current.activeCalculationId))?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state: copy,
    result: {
      requiredVolume: result.requiredVolume,
      existingVolume: result.existingVolume,
      reserve: result.reserve,
      fulfilled: result.fulfilled,
      totalArea: result.totalArea
    }
  };
}

function clearedInputs(current = {}) {
  return { ...initialState, savedCalculations: current.savedCalculations || [] };
}

function savedRows(s) {
  const items = Array.isArray(s.savedCalculations) ? s.savedCalculations : [];
  if (!items.length) return '<div class="empty-state empty-state--compact">Noch keine Überflutungsnachweise gespeichert.</div>';
  return `<div class="ph-saved-list">${items.map(item => {
    const r = item.result || {};
    const active = String(s.activeCalculationId || '') === String(item.id);
    const status = r.fulfilled ? 'erfüllt' : 'nicht erfüllt';
    const subtitle = [`V ${fmt(r.requiredVolume || 0, 2)} m³`, `Reserve ${fmt(r.reserve || 0, 2)} m³`, status].join(' · ');
    return `<article class="line-section-card saved-record-card is-collapsed ${active ? 'is-active' : ''}" data-line-card data-flood-select="${esc(item.id)}">
      <div class="line-section-card__head saved-record-card__head">
        <div class="line-section-card__title saved-record-card__title"><strong>${esc(item.name || 'Nachweis')}</strong><small>${esc(subtitle)}</small></div>
        <button type="button" class="line-section-card__toggle saved-record-card__toggle" data-line-toggle aria-expanded="false" aria-label="Nachweis aufklappen"><span>▾</span></button>
        <button type="button" class="line-section-card__delete saved-record-card__delete" data-flood-delete="${esc(item.id)}" aria-label="Nachweis löschen">×</button>
      </div>
      <div class="line-section-card__body">${resultRows([
        { label: 'erforderliches Rückhaltevolumen', value: fmt(r.requiredVolume || 0, 2), unit: 'm³' },
        { label: 'vorhandenes Rückhaltevolumen', value: fmt(r.existingVolume || 0, 2), unit: 'm³' },
        { label: 'Reserve / Differenz', value: fmt(r.reserve || 0, 2), unit: 'm³' },
        { label: 'Status', value: status }
      ])}</div>
    </article>`;
  }).join('')}</div>`;
}

function inputCards(s) {
  return stack([
    card('Regenspenden', stack([
      grid([
        field({ id: 'rainDuration', label: 'Regendauer D', value: fmtInput(s.rainDuration, 0), unit: 'min' }),
        field({ id: 'rainThirty', label: 'Regenspende r(D,30)', value: fmtInput(s.rainThirty, 1), unit: 'l/(s·ha)' }),
        field({ id: 'rainTwo', label: 'Regenspende r(D,2)', value: fmtInput(s.rainTwo, 1), unit: 'l/(s·ha)' })
      ].join(''), 2),
      `<a class="action-button action-button--secondary rainwater-kostra-link" href="${esc(KOSTRA_URL)}" target="_blank" rel="noopener">KOSTRA / OpenKo Daten öffnen</a>`
    ].join('')), 'green'),
    card('Flächenansatz', stack([
      grid([
        field({ id: 'roofArea', label: 'Gebäudedachfläche A Dach', value: fmtInput(s.roofArea, 1), unit: 'm²' }),
        field({ id: 'roofCs', label: 'Spitzenabflussbeiwert Cs Dach', value: fmtDecimalInput(s.roofCs, 1) }),
        field({ id: 'pavedArea', label: 'Befestigte Fläche A FaG', value: fmtInput(s.pavedArea, 1), unit: 'm²' }),
        field({ id: 'pavedCs', label: 'Spitzenabflussbeiwert Cs FaG', value: fmtDecimalInput(s.pavedCs, 1) }),
        field({ id: 'totalImperviousArea', label: 'Gesamtfläche A ges optional', value: fmtInput(s.totalImperviousArea, 1), unit: 'm²', placeholder: 'optional' })
      ].join(''), 2),
      '<div class="ph-formula ph-formula--small">Ohne Angabe A ges wird A Dach + A FaG verwendet.</div>'
    ].join('')), 'green'),
    card('Rückhaltevolumen / Abfluss', grid([
      field({ id: 'existingVolume', label: 'vorhandenes Rückhaltevolumen', value: fmtInput(s.existingVolume, 2), unit: 'm³' }),
      field({ id: 'allowedDischarge', label: 'zulässiger Drosselabfluss optional', value: fmtInput(s.allowedDischarge, 2), unit: 'l/s' }),
      field({ id: 'drainableDischarge', label: 'sonstiger schadloser Abfluss optional', value: fmtInput(s.drainableDischarge, 2), unit: 'l/s' })
    ].join(''), 2), 'green'),
    card('Nachweis speichern', stack([
      field({ id: 'name', label: 'Bezeichnung', value: s.name || '', placeholder: 'z. B. Überflutung Grundstück', inputmode: 'text' }),
      grid([
        '<button type="button" class="action-button" data-flood-save>Speichern</button>',
        `<button type="button" class="action-button action-button--secondary" data-flood-update ${s.activeCalculationId ? '' : 'disabled'}>Aktualisieren</button>`
      ].join(''), 2),
      savedRows(s)
    ].join('')), 'green')
  ].join(''));
}

function resultCards(s, r) {
  const status = r.fulfilled ? 'Nachweis erfüllt' : 'Nachweis nicht erfüllt';
  return stack([
    mainResult('Ergebnis Überflutungsnachweis', { label: 'erforderliches Rückhaltevolumen', value: fmt(r.requiredVolume, 2), unit: 'm³' }, [
      { label: 'vorhanden', value: fmt(r.existingVolume, 2), unit: 'm³' },
      { label: 'Reserve', value: fmt(r.reserve, 2), unit: 'm³' },
      { label: 'Status', value: status },
      { label: 'A ges', value: fmt(r.totalArea, 1), unit: 'm²' }
    ], 'green'),
    card('Berechnungsansatz', stack([
      resultRows([
        { label: 'Regendauer D', value: fmt(r.duration, 0), unit: 'min' },
        { label: 'r(D,30)', value: fmt(r.r30, 1), unit: 'l/(s·ha)' },
        { label: 'r(D,2)', value: fmt(r.r2, 1), unit: 'l/(s·ha)' },
        { label: 'Q r(D,30)', value: fmt(r.qThirty, 2), unit: 'l/s' },
        { label: 'Q Ansatz r(D,2)', value: fmt(r.qTwo, 2), unit: 'l/s' },
        { label: 'Entlastung über Abfluss', value: fmt(r.dischargeRelief, 2), unit: 'm³' }
      ]),
      '<div class="ph-formula ph-formula--small">V Rück = ((r(D,30) × A ges) − (r(D,2) × A Dach × Cs,Dach + r(D,2) × A FaG × Cs,FaG)) × D × 60 / 10000 / 1000</div>'
    ].join('')), 'green'),
    card('Normhinweise / Plausibilität', `<div class="warning-list">${r.warnings.map(item => `<div>${esc(item)}</div>`).join('')}</div>`, 'green')
  ].join(''));
}

function view(s) {
  const r = calculate(s);
  return renderModuleShell(config, `<div class="span-6">${inputCards(s)}</div><div class="span-6">${resultCards(s, r)}</div>`);
}

function bindActions(root) {
  bindEditModeClear(root, {
    state,
    activeIdKey: 'activeCalculationId',
    nameKey: 'name',
    onClear: () => state.set(clearedInputs(state.get()))
  });

  root.querySelector('[data-flood-save]')?.addEventListener('click', () => {
    const current = state.get();
    const record = savedSnapshot({ ...current, activeCalculationId: null }, calculate(current));
    state.set({ savedCalculations: [record, ...(current.savedCalculations || [])], activeCalculationId: null, name: '' });
  });

  root.querySelector('[data-flood-update]')?.addEventListener('click', () => {
    const current = state.get();
    const id = current.activeCalculationId;
    if (!id) return;
    const saved = current.savedCalculations || [];
    const existing = saved.find(item => String(item.id) === String(id));
    if (!existing) return;
    const record = { ...savedSnapshot(current, calculate(current)), id, createdAt: existing.createdAt || new Date().toISOString() };
    state.set({ savedCalculations: saved.map(item => String(item.id) === String(id) ? record : item), activeCalculationId: id, name: record.name });
  });

  root.querySelectorAll('[data-line-toggle]').forEach(toggle => toggle.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const itemCard = toggle.closest('[data-line-card]');
    const collapsed = itemCard?.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }));

  root.querySelectorAll('[data-flood-select]').forEach(cardEl => cardEl.addEventListener('click', event => {
    if (event.target.closest('[data-flood-delete]') || event.target.closest('[data-line-toggle]')) return;
    event.preventDefault();
    event.stopPropagation();
    const current = state.get();
    const item = (current.savedCalculations || []).find(entry => String(entry.id) === String(cardEl.dataset.floodSelect));
    if (!item?.state) return;
    if (String(current.activeCalculationId || '') === String(item.id)) {
      state.set(clearedInputs(current));
      return;
    }
    state.set({ ...item.state, savedCalculations: current.savedCalculations || [], activeCalculationId: item.id, name: item.name || item.state.name || '' });
  }));

  root.querySelectorAll('[data-flood-delete]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const current = state.get();
    const next = (current.savedCalculations || []).filter(item => String(item.id) !== String(button.dataset.floodDelete));
    const active = String(current.activeCalculationId || '') === String(button.dataset.floodDelete);
    state.set(active ? { ...clearedInputs(current), savedCalculations: next } : { savedCalculations: next });
  }));
}

export default {
  config,
  state,
  mount(root) {
    return mountModule(root, state, view, bindActions);
  }
};
