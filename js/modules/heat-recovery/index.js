import config from './config.js';
import { state } from './state.js';
import { calculate } from './logic.js';
import { card, field, segmented, renderModuleShell, stack, grid, inlineStats, mainResult, esc, signedTempField, toggleNumericSign } from '../../core/renderer.js';
import { mountModule } from '../../core/mount.js';
import { fmt, fmtInput } from '../../utils/calculations.js';

function readonlyValue({ label, value, unit = '' }) {
  return `<div class="field field--readonly"><label>${label}</label><div class="control control--readonly"><strong>${value}</strong>${unit ? `<span class="unit">${unit}</span>` : ''}</div></div>`;
}


let rltDevicesMemory = [];
export function readRltDevices() {
  return Array.isArray(rltDevicesMemory) ? [...rltDevicesMemory] : [];
}
export function writeRltDevices(items) {
  rltDevicesMemory = Array.isArray(items) ? [...items] : [];
}

function rltDeviceCard(r, s) {
  const items = readRltDevices();
  const rows = items.length
    ? `<div class="line-section-list">${items.map((item, index) => { const active = state.get().activeRltDeviceId === item.id; return `<article class="line-section-card is-collapsed ${active ? 'is-active' : ''}" data-line-card data-rlt-select="${esc(item.id)}">
        <div class="line-section-card__head">
          <div class="line-section-card__title"><strong>${esc(item.name || 'RLT-Geraet ' + (index + 1))}</strong></div>
          <button type="button" class="line-section-card__toggle" data-line-toggle aria-expanded="false" aria-label="RLT-Geraet aufklappen"><span>v</span></button>
          <button type="button" class="line-section-card__delete" data-rlt-delete="${esc(item.id)}" aria-label="RLT-Geraet loeschen"> x </button>
        </div>
        <div class="line-section-card__body">${inlineStats([
          { label: 'Berechnung', value: item.mode || '-' },
          { label: 'Volumenstrom', value: item.volumeFlowM3h || '-', unit: 'm3/h' },
          { label: 'Aussenluft', value: item.outdoor || '-' },
          { label: 'Abluft/Umluft', value: item.extract || '-' },
          { label: 'Zuluft/Mischluft', value: item.supply || '-' },
          { label: 'Fortluft', value: item.exhaust || '-' },
          { label: 'Leistung', value: item.power || '-', unit: item.power && item.power !== '-' ? 'kW' : '' },
          { label: 'Kondensation', value: item.condensation || '-' }
        ])}</div>
      </article>`; }).join('')}</div>`
    : '<div class="empty-state empty-state--compact">Noch keine RLT-Geraete angelegt</div>';
  return card('RLT-Geraete', stack([
    `<div class="field"><label for="rltDeviceName">Bezeichnung</label><div class="control"><input id="rltDeviceName" type="text" placeholder="z. B. RLT Buero EG" autocomplete="off" value="${esc(state.get().activeRltDeviceName || '')}"></div></div>`,
    `<div class="tc-save-actions"><button type="button" class="action-button" data-rlt-save ${state.get().activeRltDeviceId ? 'disabled' : ''}>Speichern</button><button type="button" class="action-button" data-rlt-update ${state.get().activeRltDeviceId ? '' : 'disabled'}>Aktualisieren</button></div>`,
    rows
  ].join('')), 'cyan');
}

function buildRltDeviceRecord(r, s, items, id, name, existing = null) {
  const isMixing = s.mode === 'mixing';
  const inputState = { ...s };
  delete inputState.activeRltDeviceId;
  delete inputState.activeRltDeviceName;
  return {
    id,
    name: name || s.activeRltDeviceName || existing?.name || `RLT-Geraet ${items.length + 1}`,
    mode: isMixing ? 'Mischluft' : 'WRG',
    volumeFlowM3h: isMixing ? fmt(r.mixed?.volumeFlowM3h, 0) : fmt(s.wrgVolumeFlowM3h, 0),
    outdoor: `${fmt(isMixing ? s.mixingOutdoorTemp : s.outdoorTemp, 2)}  GradC / ${fmt(isMixing ? s.mixingOutdoorRh : s.outdoorRh, 0)} %`,
    extract: `${fmt(isMixing ? s.mixingRecircTemp : s.extractTemp, 2)}  GradC / ${fmt(isMixing ? s.mixingRecircRh : s.extractRh, 0)} %`,
    supply: isMixing ? `${fmt(r.mixed?.tempC, 2)}  GradC / ${fmt(r.mixed?.rhPercent, 0)} %` : `${fmt(r.supply?.tempC, 2)}  GradC / ${fmt(r.supply?.rhPercent, 0)} %`,
    exhaust: isMixing ? '-' : `${fmt(r.exhaust?.tempC, 2)}  GradC / ${fmt(r.exhaust?.rhPercent, 0)} %`,
    power: isMixing ? '-' : fmt(r.recoveredPowerKw, 2),
    condensation: r.hasCondensation ? `${fmt(r.condensateLs, 4)} l/s` : '-',
    inputState,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}


function inferRltInputState(item) {
  const input = { ...(item.inputState || item.state || {}) };
  const modeLabel = String(item.mode || input.mode || '').toLowerCase();
  if (input.mode !== 'wrg' && input.mode !== 'mixing') {
    input.mode = modeLabel.includes('misch') || modeLabel.includes('mix') ? 'mixing' : 'wrg';
  }
  return input;
}

function bindRltDevices(root, r, s, rerender) {
  root.querySelector('[data-rlt-save]')?.addEventListener('click', event => {
    event.preventDefault();
    const name = root.querySelector('#rltDeviceName')?.value?.trim() || '';
    const items = readRltDevices();
    const id = (globalThis.crypto?.randomUUID?.() || `rlt-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const item = buildRltDeviceRecord(r, { ...s, activeRltDeviceId: null, activeRltDeviceName: name }, items, id, name);
    writeRltDevices([item, ...items]);
    state.set({ activeRltDeviceId: null, activeRltDeviceName: '' }, { notify:false });
    if (typeof rerender === 'function') rerender();
  });
  root.querySelector('[data-rlt-update]')?.addEventListener('click', event => {
    event.preventDefault();
    const current = state.get();
    const id = current.activeRltDeviceId;
    if (!id) return;
    const name = root.querySelector('#rltDeviceName')?.value?.trim() || '';
    const items = readRltDevices();
    const existing = items.find(entry => String(entry.id) === String(id));
    if (!existing) return;
    const item = buildRltDeviceRecord(r, current, items, id, name, existing);
    writeRltDevices(items.map(entry => String(entry.id) === String(id) ? item : entry));
    state.set({ activeRltDeviceId: id, activeRltDeviceName: item.name }, { notify:false });
    if (typeof rerender === 'function') rerender();
  });
  root.querySelectorAll('[data-line-toggle]').forEach(toggle => {
    toggle.addEventListener('click', event => {
      event.stopPropagation();
      const card = toggle.closest('[data-line-card]');
      const collapsed = card?.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  });
  root.querySelectorAll('[data-rlt-select]').forEach(row => {
    row.addEventListener('click', event => {
      if (event.target.closest('[data-rlt-delete]') || event.target.closest('[data-line-toggle]')) return;
      event.preventDefault();
      event.stopPropagation();
      const selectedId = row.getAttribute('data-rlt-select');
      const item = readRltDevices().find(entry => String(entry.id) === String(selectedId));
      if (!item) return;
      if (String(state.get().activeRltDeviceId || '') === String(selectedId || '')) {
        state.set({ activeRltDeviceId: null, activeRltDeviceName: '' });
        return;
      }
      state.set({ ...inferRltInputState(item), activeRltDeviceId: item.id, activeRltDeviceName: item.name || '' });
    });
  });

  root.querySelectorAll('[data-rlt-delete]').forEach(del => {
    del.addEventListener('click', event => {
      event.stopPropagation();
      const id = del.dataset.rltDelete;
      writeRltDevices(readRltDevices().filter(item => String(item.id) !== String(id)));
      if (String(state.get().activeRltDeviceId) === String(id)) state.set({ activeRltDeviceId:null, activeRltDeviceName:'' }, { notify:false });
      if (typeof rerender === 'function') rerender();
    });
  });
}

function readonlyAirCard(title, point, accent = 'cyan', options = {}) {
  const includeMass = options.includeMass !== false;
  const includeVolume = options.includeVolume === true;
  const rows = [];

  if (includeVolume) {
    rows.push(readonlyValue({ label: 'Volumenstrom V', value: fmt(point.volumeFlowM3h, 0), unit: 'm3/h' }));
  }

  if (includeMass) {
    rows.push(readonlyValue({ label: 'Massenstrom m', value: fmt(point.massFlowKgh, 2), unit: 'kg/h' }));
  }

  rows.push(grid([
    readonlyValue({ label: 'Temperatur', value: fmt(point.tempC, 2), unit: ' GradC' }),
    readonlyValue({ label: 'rel. Feuchte', value: fmt(point.rhPercent, 0), unit: '%' })
  ].join(''), 2));

  return card(title, stack(rows.join('')), accent);
}

function airInputCard(title, fields, accent = 'cyan') {
  const rows = [];
  if (fields.volume) rows.push(field(fields.volume));
  rows.push(grid([
    fields.temp?.signed ? signedTempField(fields.temp.id, fields.temp.label, fields.temp.value, 'data-wrg-sign') : field(fields.temp),
    field(fields.rh)
  ].join(''), 2));
  return card(title, stack(rows.join('')), accent);
}

function modeCard(s) {
  return card('Berechnungsart', segmented('mode', [
    { value: 'wrg', label: 'WRG' },
    { value: 'mixing', label: 'Mischluft' }
  ], s.mode, { accent: 'cyan' }), 'cyan', { compact: true });
}

function condensationCard(r) {
  if (!r.hasCondensation) return '';
  return mainResult('Kondensation', { label: 'Kondensationsleistung', value: fmt(r.condensateLs, 4), unit: 'l/s' }, [
    { label: 'Kondensat', value: fmt(r.condensateKgh, 2), unit: 'kg/h' },
    { label: 'Latente Leistung', value: fmt(r.condensationPowerKw, 2), unit: 'kW' },
    { label: 'Hinweis', value: '100%-Enthalpielinie ueberschritten', unit: '' }
  ], 'cyan');
}

function wrgInputCard(s) {
  return card('WRG - Eingaben', `<div class="wrg-group-grid">
    ${airInputCard('Aussenluft', {
      temp: { id: 'outdoorTemp', label: 'Temperatur', unit: ' GradC', value: fmtInput(s.outdoorTemp, 2), signed: true },
      rh: { id: 'outdoorRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.outdoorRh, 2) }
    })}
    ${airInputCard('Abluft', {
      temp: { id: 'extractTemp', label: 'Temperatur', unit: ' GradC', value: fmtInput(s.extractTemp, 2) },
      rh: { id: 'extractRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.extractRh, 2) }
    })}
    <div class="wrg-group-grid__full">
      ${card('Waermerueckgewinnung', grid([
        field({ id: 'wrgVolumeFlowM3h', label: 'Anlagenvolumenstrom V', unit: 'm3/h', value: fmtInput(s.wrgVolumeFlowM3h, 2) }),
        field({ id: 'efficiency', label: 'WRG-Wirkungsgrad', unit: '%', value: fmtInput(s.efficiency, 2) }),
        field({ id: 'bypassPercent', label: 'Bypass-Anteil beta', unit: '%', value: fmtInput(s.bypassPercent, 2) })
      ].join(''), 3), 'cyan', { compact: true })}
    </div>
  </div>`, 'cyan');
}

function wrgOutputCard(r) {
  return card('WRG - Ausgabe', `<div class="wrg-group-grid wrg-group-grid--output">
    ${readonlyAirCard('Zuluft', r.supply, 'cyan', { includeMass: true })}
    ${readonlyAirCard('Fortluft', r.exhaust, 'cyan', { includeMass: true })}
  </div>`, 'cyan');
}

function mixingInputCard(s) {
  return card('Mischluft - Eingaben', `<div class="wrg-group-grid">
    ${airInputCard('Aussenluft', {
      volume: { id: 'mixingOutdoorVolumeFlowM3h', label: 'Volumenstrom V', unit: 'm3/h', value: fmtInput(s.mixingOutdoorVolumeFlowM3h, 2) },
      temp: { id: 'mixingOutdoorTemp', label: 'Temperatur', unit: ' GradC', value: fmtInput(s.mixingOutdoorTemp, 2), signed: true },
      rh: { id: 'mixingOutdoorRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.mixingOutdoorRh, 2) }
    })}
    ${airInputCard('Umluft / Raumluft', {
      volume: { id: 'mixingRecircVolumeFlowM3h', label: 'Volumenstrom V', unit: 'm3/h', value: fmtInput(s.mixingRecircVolumeFlowM3h, 2) },
      temp: { id: 'mixingRecircTemp', label: 'Temperatur', unit: ' GradC', value: fmtInput(s.mixingRecircTemp, 2) },
      rh: { id: 'mixingRecircRh', label: 'rel. Feuchte', unit: '%', value: fmtInput(s.mixingRecircRh, 2) }
    })}
  </div>`, 'cyan');
}

function mixingOutputCard(r) {
  return card('Mischluft - Ausgabe', `<div class="wrg-group-grid wrg-group-grid--output">
    ${readonlyAirCard('Mischluft / Zuluft', r.mixed, 'cyan', { includeMass: false, includeVolume: true })}
    ${card('Mischungsverhaeltnis', inlineStats([
      { label: 'Aussenluftanteil', value: fmt(r.outdoorShare, 0), unit: '%' },
      { label: 'Umluftanteil', value: fmt(r.recircShare, 0), unit: '%' },
      { label: 'Massenstrom', value: fmt(r.mixed.massFlowKgh, 2), unit: 'kg/h' },
      { label: 'x', value: fmt(r.mixed.humidityRatioGkg, 2), unit: 'g/kg' }
    ]), 'cyan')}
  </div>`, 'cyan');
}

function wrgOutputs(r) {
  return stack([
    wrgOutputCard(r),
    mainResult('WRG-Leistung', { label: 'Rueckgewonnene Leistung', value: fmt(r.recoveredPowerKw, 2), unit: 'kW' }, [
      { label: 'Wirkungsgrad', value: fmt(r.efficiency, 0), unit: '%' },
      { label: 'Bypass', value: fmt(r.bypassPercent, 0), unit: '%' },
      { label: 'WTX-Wirksam', value: fmt(r.effectiveVolumeFlowM3h, 0), unit: 'm3/h' },
      { label: 'rho  x  cp / 3,6', value: fmt(r.factor, 3), unit: 'Wh/(m3 - K)' }
    ], 'cyan'),
    condensationCard(r)
  ].join(''));
}

function mixingOutputs(r) {
  return stack([
    mixingOutputCard(r),
    condensationCard(r)
  ].join(''));
}

function view(s) {
  const r = calculate(s);
  const isMixing = s.mode === 'mixing';
  const formula = isMixing
    ? 'Mischluft: x und h aus Aussenluft + Umluft ueber Massenstromanteile'
    : 'WRG: tZuluft = (1beta)  x  [tAussen + etaWRG  x  (tAbluft  tAussen)] + beta  x  tAussen  -  tFort = tAbluft  (1beta)  x  etaWRG  x  (tAbluft  tAussen)';

  const input = isMixing ? mixingInputCard(s) : wrgInputCard(s);
  const output = stack([(isMixing ? mixingOutputs(r) : wrgOutputs(r)), rltDeviceCard(r, s)].join(''));

  const body = stack([
    modeCard(s),
    `<div class="wrg-desktop-split">
      <div class="wrg-desktop-split__input">${input}<div class="formula">${formula}</div></div>
      <div class="wrg-desktop-split__output">${output}</div>
    </div>`
  ].join(''));

  return renderModuleShell(config, `<div class="span-12">${body}</div>`);
}

export default {
  config,
  state,
  mount(root) {
    return mountModule(root, state, view, (rootEl, snapshot, render) => {
      rootEl.querySelectorAll('[data-wrg-sign]').forEach(button => {
        button.addEventListener('click', () => {
          const id = button.dataset.wrgSign;
          const input = rootEl.querySelector(`[data-field="${id}"]`);
          state.set({ [id]: toggleNumericSign(input?.value) });
        });
      });
      bindRltDevices(rootEl, calculate(snapshot), snapshot, render);
    });
  }
};