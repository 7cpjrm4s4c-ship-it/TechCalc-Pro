/* ═══════════════════════════════════════════════════════
   wrg-mischluft.js — PHASE 3 REFACTORED (v2)
   Wärmerückgewinnung & Mischluft
═══════════════════════════════════════════════════════ */
'use strict';

const _P = 1013.25;
const _pws = T => 6.112 * Math.exp(17.62 * T / (243.12 + T));
const _x   = (T, phi) => {
  if (isNaN(T) || isNaN(phi) || phi <= 0) return 0;
  const pw = phi / 100 * _pws(T);
  return pw >= _P ? 999 : +(1000 * 0.622 * pw / (_P - pw)).toFixed(3);
};
const _h   = (T, x) => +(1.006 * T + x / 1000 * (2501 + 1.86 * T)).toFixed(2);
const _phi = (T, x) => {
  if (isNaN(T) || isNaN(x) || x < 0) return NaN;
  const pw = x / 1000 * _P / (0.622 + x / 1000);
  return +(100 * pw / _pws(T)).toFixed(1);
};
const _rho = T => +(353.05 / (T + 273.15)).toFixed(4);
const _n   = v => {
  if (v === null || v === undefined) return NaN;
  const s = String(v).replace(',', '.').trim();
  if (s === '' || s === '-') return NaN;
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
};
const _wrgFmt = (v, d) => isNaN(v) || v == null ? '–' : (+v).toFixed(d);

function calcWRG() {
  const T_ab  = _n(window.$('wrg-ab-t')?.value);
  const ph_ab = _n(window.$('wrg-ab-phi')?.value);
  const T_au  = _n(window.$('wrg-au-t')?.value);
  const ph_au = _n(window.$('wrg-au-phi')?.value);
  const eta   = _n(window.$('wrg-eta')?.value) / 100;

  const el = window.$('wrg-result');
  if (!el) return;

  if ([T_ab, ph_ab, T_au, ph_au, eta].some(isNaN)) {
    el.innerHTML = '<p style="color:var(--t3);font-size:12px;text-align:center;padding:12px">Alle Felder ausfüllen →</p>';
    return;
  }

  const x_ab = _x(T_ab, ph_ab);
  const x_au = _x(T_au, ph_au);
  const T_zl  = +(T_au + eta * (T_ab - T_au)).toFixed(1);
  const x_zl  = x_au;
  const T_fl  = +(T_ab - eta * (T_ab - T_au)).toFixed(1);
  const x_fl  = x_ab;

  const phi_zl = _phi(T_zl, x_zl);
  const phi_fl_raw = _phi(T_fl, x_fl);
  const phi_fl = Math.min(100, phi_fl_raw);

  const h_zl = _h(T_zl, x_zl);
  const dQ_zl = +(h_zl - _h(T_au, x_au)).toFixed(1);

  el.innerHTML = `
    <div style="display:grid;gap:8px">
      <div style="background:var(--glass-mid);border:1px solid var(--gb-soft);border-radius:var(--r-m);padding:12px">
        <div style="font-size:11px;font-weight:700;color:var(--heat-t);margin-bottom:8px">ZULUFT (LS3)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
          <div>T: <strong>${_wrgFmt(T_zl,1)}</strong> °C</div>
          <div>φ: <strong>${_wrgFmt(phi_zl,1)}</strong> %</div>
          <div>x: <strong>${_wrgFmt(x_zl,2)}</strong> g/kg</div>
          <div>h: <strong>${_wrgFmt(h_zl,1)}</strong> kJ/kg</div>
        </div>
      </div>
      <div style="background:var(--glass-mid);border:1px solid var(--gb-soft);border-radius:var(--r-m);padding:12px">
        <div style="font-size:11px;font-weight:700;color:var(--cold-t);margin-bottom:8px">FORTLUFT (LS4)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
          <div>T: <strong>${_wrgFmt(T_fl,1)}</strong> °C</div>
          <div>φ: <strong>${_wrgFmt(phi_fl,1)}</strong> %</div>
          <div>x: <strong>${_wrgFmt(x_fl,2)}</strong> g/kg</div>
          <div>h: <strong>${_wrgFmt(_h(T_fl,x_fl),1)}</strong> kJ/kg</div>
        </div>
      </div>
    </div>
    <div style="margin-top:8px;padding:10px 12px;background:var(--blue-t);border:1px solid var(--blue-b);border-radius:var(--r-m)">
      <div style="font-size:10px;font-weight:700;color:var(--blue)">Bilanz</div>
      <div style="font-size:12px;color:var(--t2);margin-top:4px">
        η<sub>t</sub> = ${_wrgFmt(eta*100,0)}% · ΔT<sub>ZL</sub> = +${_wrgFmt(T_zl-T_au,1)}K · Δh = +${_wrgFmt(dQ_zl,1)}kJ/kg
      </div>
    </div>`;
}

function calcMix() {
  const T1   = _n(window.$('mix-ls1-t')?.value);
  const ph1  = _n(window.$('mix-ls1-phi')?.value);
  const vol1 = _n(window.$('mix-ls1-vol')?.value);
  const T2   = _n(window.$('mix-ls2-t')?.value);
  const ph2  = _n(window.$('mix-ls2-phi')?.value);
  const vol2 = _n(window.$('mix-ls2-vol')?.value);

  const el = window.$('mix-result');
  if (!el) return;

  if ([T1, ph1, vol1, T2, ph2, vol2].some(isNaN)) {
    el.innerHTML = '<p style="color:var(--t3);font-size:12px;text-align:center;padding:12px">Alle Felder ausfüllen →</p>';
    return;
  }

  const x1 = _x(T1, ph1), h1 = _h(T1, x1);
  const x2 = _x(T2, ph2), h2 = _h(T2, x2);
  const rho1 = _rho(T1), rho2 = _rho(T2);
  const m1   = vol1 * rho1, m2 = vol2 * rho2, mM = m1 + m2;

  const xM = (m1 * x1 + m2 * x2) / mM;
  const hM = (m1 * h1 + m2 * h2) / mM;
  const TM = (hM - xM / 1000 * 2501) / (1.006 + xM / 1000 * 1.86);
  const phM = _phi(TM, xM);
  const volM = vol1 + vol2;

  el.innerHTML = `
    <div style="margin-bottom:10px;padding:12px;background:rgba(52,211,153,.10);border:1px solid rgba(52,211,153,.28);border-radius:var(--r-m)">
      <div style="font-size:10px;font-weight:700;color:var(--grn);margin-bottom:4px">GESAMTVOLUMENSTROM</div>
      <div style="font-size:20px;font-weight:700;color:var(--t1)">
        ${_wrgFmt(volM,0)} m³/h
      </div>
      <div style="font-size:11px;color:var(--t3);margin-top:3px">
        ṁ = ${_wrgFmt(mM,0)} kg/h · LS1: ${(vol1/volM*100).toFixed(0)}% / LS2: ${(vol2/volM*100).toFixed(0)}%
      </div>
    </div>
    <div style="background:var(--glass-mid);border:1px solid var(--gb-soft);border-radius:var(--r-m);padding:12px">
      <div style="font-size:11px;font-weight:700;color:var(--grn);margin-bottom:8px">MISCHLUFT (LS3)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
        <div>T: <strong>${_wrgFmt(TM,1)}</strong> °C</div>
        <div>φ: <strong>${_wrgFmt(phM,1)}</strong> %</div>
        <div>x: <strong>${_wrgFmt(xM,2)}</strong> g/kg</div>
        <div>h: <strong>${_wrgFmt(hM,1)}</strong> kJ/kg</div>
      </div>
    </div>`;
}

function buildWRGUI() {
  let html = '';
  html += UI.SectionTitle('WRG & Mischluft');

  html += UI.SectionTitle('WRG — Wärmerückgewinnung', 'small');
  html += UI.Card(UI.InputGroup('T Abluft', 'wrg-ab-t', { type: 'number', unit: '°C', value: 20, step: 0.1 }), 'neutral');
  html += UI.Card(UI.InputGroup('φ Abluft', 'wrg-ab-phi', { type: 'number', unit: '%', value: 50, min: 0, max: 100 }), 'neutral');
  html += UI.Card(UI.InputGroup('T Außenluft', 'wrg-au-t', { type: 'number', unit: '°C', value: 0, step: 0.1 }), 'neutral');
  html += UI.Card(UI.InputGroup('φ Außenluft', 'wrg-au-phi', { type: 'number', unit: '%', value: 80, min: 0, max: 100 }), 'neutral');
  html += UI.Card(UI.InputGroup('Wirkungsgrad', 'wrg-eta', { type: 'number', unit: '%', value: 70, min: 0, max: 100 }), 'neutral');
  html += '<div id="wrg-result"></div>';

  html += UI.SectionTitle('Mischluft — 2-Strom Mischung', 'small');
  html += UI.Card(UI.InputGroup('T Strom 1', 'mix-ls1-t', { type: 'number', unit: '°C', value: 20, step: 0.1 }), 'neutral');
  html += UI.Card(UI.InputGroup('φ Strom 1', 'mix-ls1-phi', { type: 'number', unit: '%', value: 50, min: 0, max: 100 }), 'neutral');
  html += UI.Card(UI.InputGroup('V̇ Strom 1', 'mix-ls1-vol', { type: 'number', unit: 'm³/h', value: 1000, step: 100 }), 'neutral');
  html += UI.Card(UI.InputGroup('T Strom 2', 'mix-ls2-t', { type: 'number', unit: '°C', value: 30, step: 0.1 }), 'neutral');
  html += UI.Card(UI.InputGroup('φ Strom 2', 'mix-ls2-phi', { type: 'number', unit: '%', value: 40, min: 0, max: 100 }), 'neutral');
  html += UI.Card(UI.InputGroup('V̇ Strom 2', 'mix-ls2-vol', { type: 'number', unit: 'm³/h', value: 1000, step: 100 }), 'neutral');
  html += '<div id="mix-result"></div>';

  return html;
}

function initWRG() {
  const container = window.$('wrg-section');
  if (!container) return;
  container.innerHTML = buildWRGUI();

  const wrgIds = ['wrg-ab-t','wrg-ab-phi','wrg-au-t','wrg-au-phi','wrg-eta'];
  const mixIds = ['mix-ls1-t','mix-ls1-phi','mix-ls1-vol','mix-ls2-t','mix-ls2-phi','mix-ls2-vol'];

  wrgIds.forEach(id => {
    window.$(id)?.addEventListener('input', calcWRG);
    window.$(id)?.addEventListener('change', calcWRG);
  });
  mixIds.forEach(id => {
    window.$(id)?.addEventListener('input', calcMix);
    window.$(id)?.addEventListener('change', calcMix);
  });

  setTimeout(() => { calcWRG(); calcMix(); }, 100);
  console.log('✅ WRG v2 initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWRG);
} else {
  initWRG();
}

window.calcWRG = calcWRG;
window.calcMix = calcMix;
