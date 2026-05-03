/* ═══════════════════════════════════════════════════════
   heating-cooling.js  —  Massenstromrechner PWA
   Heizung · Kälte · Rohrdimensionierung
   Abhängigkeit: app.js muss zuerst geladen sein ($, show, loc)
═══════════════════════════════════════════════════════ */
'use strict';

/* ───────────────────────────────────────
   FLÜSSIGKEITSDATEN
─────────────────────────────────────── */
const FL = {
  water: { cp:4.180, rho:998,  frost:null,
           label:'Wasser' },
  eg25:  { cp:3.870, rho:1032, frost:'bis \u221212\u202f\u00b0C',
           label:'Ethylenglykol 25\u202f%' },
  eg30:  { cp:3.740, rho:1038, frost:'bis \u221216\u202f\u00b0C',
           label:'Ethylenglykol 30\u202f%' },
  eg35:  { cp:3.620, rho:1044, frost:'bis \u221221\u202f\u00b0C',
           label:'Ethylenglykol 35\u202f%' },
  pg25:  { cp:3.870, rho:1024, frost:'bis \u221210\u202f\u00b0C',
           label:'Propylenglykol 25\u202f%' },
  pg30:  { cp:3.740, rho:1030, frost:'bis \u221213\u202f\u00b0C',
           label:'Propylenglykol 30\u202f%' },
  pg35:  { cp:3.610, rho:1037, frost:'bis \u221218\u202f\u00b0C',
           label:'Propylenglykol 35\u202f%' },
};

/* ───────────────────────────────────────
   ROHRDATEN
   [DN, di_s,da_s,wall_s,norm_s, di_m,da_m,wall_m]
   Stahl: DIN EN 10255 Reihe M (≤DN50) / DIN EN 10220 (≥DN65)
   Mapress Edelstahl 1.4401: DIN EN 10312, max. DN 100
─────────────────────────────────────── */
const PIPES = [
  [ 15,  16.1, 21.3, 2.60, 'DIN EN 10255',  16.0,  18.0, 1.0],
  [ 20,  21.6, 26.9, 2.65, 'DIN EN 10255',  19.6,  22.0, 1.2],
  [ 25,  27.2, 33.7, 3.25, 'DIN EN 10255',  25.6,  28.0, 1.2],
  [ 32,  35.9, 42.4, 3.25, 'DIN EN 10255',  32.0,  35.0, 1.5],
  [ 40,  41.8, 48.3, 3.25, 'DIN EN 10255',  39.0,  42.0, 1.5],
  [ 50,  53.0, 60.3, 3.65, 'DIN EN 10255',  51.0,  54.0, 1.5],
  [ 65,  69.6, 76.1, 3.25, 'DIN EN 10220',  72.1,  76.1, 2.0],
  [ 80,  82.5, 88.9, 3.20, 'DIN EN 10220',  84.9,  88.9, 2.0],
  [100, 107.1,114.3, 3.60, 'DIN EN 10220', 104.0, 108.0, 2.0],
  [125, 131.7,139.7, 4.00, 'DIN EN 10220',  null,  null, null],
  [150, 155.8,168.3, 4.50, 'DIN EN 10220',  null,  null, null],
  [200, 203.1,219.1, 8.00, 'DIN EN 10220',  null,  null, null],
  [250, 254.5,273.0, 8.80, 'DIN EN 10220',  null,  null, null],
  [300, 303.1,323.9, 9.50, 'DIN EN 10220',  null,  null, null],
];

const RHO = 983.2;       // kg/m³  Wasser bei 60 °C
const NU  = 0.474e-6;    // m²/s   kinematische Viskosität
const ES  = 0.046e-3;    // m      Rauheit Stahl
const EM  = 0.015e-3;    // m      Rauheit Mapress Edelstahl
const DP0 = 100;         // Pa/m   Standard-Auslegungsgrenzwert
const MAPRESS_MAX_DN = 100;

/* ───────────────────────────────────────
   HYDRAULIK — Darcy-Weisbach + Colebrook-White
─────────────────────────────────────── */
function lambdaCW(Re, eps, D) {
  if (Re < 1e-9) return 0;
  if (Re < 2300) return 64 / Re;
  let l = 0.25 / Math.pow(Math.log10(eps / (3.7 * D) + 5.74 / Math.pow(Re, 0.9)), 2);
  for (let i = 0; i < 60; i++) {
    const n = Math.pow(-2 * Math.log10(eps / (3.71 * D) + 2.51 / (Re * Math.sqrt(l))), -2);
    if (Math.abs(n - l) < 1e-11) { l = n; break; }
    l = n;
  }
  return l;
}

function pdrop(vol, diMm, eps) {
  if (!vol || !diMm) return { dp: 0, v: 0, Re: 0 };
  const D  = diMm / 1e3;
  const A  = Math.PI * D * D / 4;
  const v  = (vol / 3600) / A;
  const Re = v * D / NU;
  return { dp: lambdaCW(Re, eps, D) * RHO * v * v / (2 * D), v, Re };
}

function dpCol(dp, mx) {
  return dp <= mx * 0.75 ? 'var(--ok)' : dp <= mx ? 'var(--warn)' : 'var(--danger)';
}

/* ───────────────────────────────────────
   ROHR-KARTEN HTML
─────────────────────────────────────── */
function pCardSteel(p, vol, mx, isBest, bestCls) {
  bestCls = bestCls || 'best';
  const { dp, v } = pdrop(vol, p[1], ES);
  const col   = dpCol(dp, mx);
  const pct   = Math.min(100, dp / mx * 100).toFixed(1);
  const cls   = isBest ? bestCls : dp > mx ? 'over' : '';
  const star  = isBest ? '<span class="star">\u2605</span>' : '';
  const dpTxt = dp < 10 ? dp.toFixed(1) : Math.round(dp);
  return `<div class="pm ${cls}">
    <div class="pm-std">${p[4]} ${star}</div>
    <div class="pm-dn">DN\u2009${p[0]}</div>
    <div class="pm-dim">\u00d8\u2009${p[2]}\u202f\u00d7\u202f${p[3]}\u202fmm<br>d\u1d62\u2009${p[1].toFixed(1)}\u202fmm</div>
    <div class="pm-r"><span class="pm-k">\u0394p/m</span><span class="pm-v" style="color:${col}">${dpTxt}<span style="font-size:11px;color:var(--t3)"> Pa/m</span></span></div>
    <div class="pm-r"><span class="pm-k">v</span><span class="pm-v" style="font-size:11px;color:var(--t2)">${v.toFixed(2)}\u202fm/s</span></div>
    <div class="dpbar"><div class="dpfill" style="width:${pct}%;background:${col}"></div></div>
  </div>`;
}

function pCardMapress(p, vol, mx, isBest, bestCls) {
  bestCls = bestCls || 'best';
  if (p[0] > MAPRESS_MAX_DN || p[5] === null) {
    return `<div class="pm na">
      <div class="pm-std mp">Mapress Edelstahl</div>
      <div class="pm-dn">DN\u2009${p[0]}</div>
      <div class="pm-na-txt">Nicht verf\u00fcgbar<br/>(max. DN\u2009${MAPRESS_MAX_DN})</div>
    </div>`;
  }
  const { dp, v } = pdrop(vol, p[5], EM);
  const col   = dpCol(dp, mx);
  const pct   = Math.min(100, dp / mx * 100).toFixed(1);
  const cls   = isBest ? bestCls : dp > mx ? 'over' : '';
  const star  = isBest ? '<span class="star">\u2605</span>' : '';
  const dpTxt = dp < 10 ? dp.toFixed(1) : Math.round(dp);
  return `<div class="pm ${cls}">
    <div class="pm-std mp">Mapress Edelstahl ${star}</div>
    <div class="pm-dn">DN\u2009${p[0]}</div>
    <div class="pm-dim">\u00d8\u2009${p[6]}\u202f\u00d7\u202f${p[7]}\u202fmm<br>d\u1d62\u2009${p[5].toFixed(1)}\u202fmm</div>
    <div class="pm-r"><span class="pm-k">\u0394p/m</span><span class="pm-v" style="color:${col}">${dpTxt}<span style="font-size:11px;color:var(--t3)"> Pa/m</span></span></div>
    <div class="pm-r"><span class="pm-k">v</span><span class="pm-v" style="font-size:11px;color:var(--t2)">${v.toFixed(2)}\u202fm/s</span></div>
    <div class="dpbar"><div class="dpfill" style="width:${pct}%;background:${col}"></div></div>
  </div>`;
}

function renderPair(cid, vol, mx, bestCls) {
  bestCls = bestCls || 'best';
  const el = $(cid); if (!el) return;
  if (!vol) { el.innerHTML = ''; return; }

  const bS = PIPES.findIndex(p => pdrop(vol, p[1], ES).dp <= mx);
  const bM = PIPES.findIndex(p => p[5] !== null && pdrop(vol, p[5], EM).dp <= mx);
  const iS = bS < 0 ? PIPES.length - 1 : bS;
  const iM = bM < 0
    ? PIPES.findIndex(p => p[0] === MAPRESS_MAX_DN)
    : bM;

  el.innerHTML = pCardSteel(PIPES[iS], vol, mx, bS >= 0, bestCls)
               + pCardMapress(PIPES[iM], vol, mx, bM >= 0, bestCls);
}

/* ───────────────────────────────────────
   ZUSTAND — Heizung / Kälte
─────────────────────────────────────── */
const ST = {
  h: { mode: 'ms', qUnit: 'W' },
  k: { mode: 'ms', qUnit: 'W' },
};

function updateLayout(p) {
  const m = ST[p].mode;
  show($(p + '-ig-q'),  m !== 'q');
  show($(p + '-ig-ms'), m !== 'ms');
  show($(p + '-ig-dt'), m !== 'dt');

  const dtLbl = $(p + '-dt-lbl');
  if (dtLbl) {
    const heatWord = p === 'h' ? 'Heizlast' : 'K\u00fchllast';
    if      (m === 'ms') dtLbl.textContent = '\u0394T \u2014 ' + heatWord + ' [K]';
    else if (m === 'q')  dtLbl.textContent = '\u0394T \u2014 Massenstrom [K]';
    else                 dtLbl.textContent = '\u0394T [K]';
  }
}

function setQUnit(p, unit) {
  ST[p].qUnit = unit;
  const inp     = $(p + '-q');
  const unitSpan = $(p + '-q-unit');
  const wBtn    = $(p + '-wu');
  const kwBtn   = $(p + '-kwu');
  if (unit === 'kW') {
    if (inp)      { inp.step = '0.1'; inp.placeholder = '0.00'; }
    if (unitSpan)   unitSpan.textContent = 'kW';
    wBtn?.classList.remove('active');
    kwBtn?.classList.add('active');
  } else {
    if (inp)      { inp.step = '100'; inp.placeholder = '0'; }
    if (unitSpan)   unitSpan.textContent = 'W';
    kwBtn?.classList.remove('active');
    wBtn?.classList.add('active');
  }
  calcAll();
}

/* ───────────────────────────────────────
   BERECHNUNG — Einzelpanel
─────────────────────────────────────── */
function calcPanel(p) {
  const f   = FL[$('medium').value];
  const cp  = f.cp * 1e3;   // J/(kg·K)
  const rho = f.rho;
  const m   = ST[p].mode;

  const qRaw  = parseFloat($(p + '-q')?.value)     || 0;
  const qv    = ST[p].qUnit === 'kW' ? qRaw * 1000 : qRaw;
  const msh   = parseFloat($(p + '-ms-in')?.value) || 0;
  const ms_in = msh / 3600;
  const dtv   = parseFloat($(p + '-dt')?.value)    || 0;

  let ms = 0, q = 0, dt = 0, ok = false;
  if (m === 'ms' && qv > 0    && dtv > 0)   { ms = qv / (cp * dtv);    q = qv;   dt = dtv; ok = true; }
  if (m === 'q'  && ms_in > 0 && dtv > 0)   { q  = ms_in * cp * dtv; ms = ms_in; dt = dtv; ok = true; }
  if (m === 'dt' && qv > 0    && ms_in > 0) { dt = qv / (ms_in * cp);  q = qv;  ms = ms_in; ok = true; }

  const mh  = ms * 3600;
  const m3h = mh / rho;
  return { ok, ms, mh, m3h, q, dt };
}

function setOut(id, on, txt) {
  const el = $(id); if (!el) return;
  let tn = el.firstChild;
  if (!tn || tn.nodeType !== 3) {
    tn = document.createTextNode('');
    el.insertBefore(tn, el.firstChild);
  }
  tn.textContent = on ? txt : '\u2013';
  el.classList.toggle('has', on);
}

function setOutFull(valId, unitId, on, numTxt, unitTxt) {
  setOut(valId, on, numTxt);
  const uel = $(unitId); if (uel) uel.textContent = unitTxt;
}

function updateOutBlock(p, res) {
  const m  = ST[p].mode;
  const k1 = $(p + '-out-key1');
  const k2 = $(p + '-out-key2');

  if (m === 'ms') {
    if (k1) k1.textContent = 'kg/h';
    if (k2) k2.textContent = 'm\u00b3/h';
    setOutFull(p + '-out-v1', p + '-out-u1', res.ok, loc(res.mh,  1), 'kg/h');
    setOutFull(p + '-out-v2', p + '-out-u2', res.ok, loc(res.m3h, 3), 'm\u00b3/h');
  } else if (m === 'q') {
    const isKw  = ST[p].qUnit === 'kW';
    const qDisp = isKw ? res.q / 1000 : res.q;
    const qDec  = isKw ? 3 : 0;
    const uLbl  = ST[p].qUnit;
    if (k1) k1.textContent = uLbl;
    if (k2) k2.textContent = 'kg/h';
    setOutFull(p + '-out-v1', p + '-out-u1', res.ok, loc(qDisp, qDec), uLbl);
    setOutFull(p + '-out-v2', p + '-out-u2', res.ok, loc(res.mh, 1), 'kg/h');
  } else {
    if (k1) k1.textContent = '\u0394T';
    if (k2) k2.textContent = 'kg/h';
    setOutFull(p + '-out-v1', p + '-out-u1', res.ok, loc(res.dt, 2), 'K');
    setOutFull(p + '-out-v2', p + '-out-u2', res.ok, loc(res.mh, 1), 'kg/h');
  }
}

/* ───────────────────────────────────────
   BERECHNUNG — Alle Panels
─────────────────────────────────────── */
function calcAll() {
  const f = FL[$('medium').value];
  $('cp-val').textContent  = f.cp.toFixed(3);
  $('rho-val').textContent = f.rho;

  const fc = $('frost-chip');
  if (f.frost) { if (fc) fc.style.display = ''; $('frost-val').textContent = f.frost; }
  else          { if (fc) fc.style.display = 'none'; }

  const rH = calcPanel('h');
  const rK = calcPanel('k');
  updateOutBlock('h', rH);
  updateOutBlock('k', rK);

  // Ergebnis-Label
  const slbl = $('out-card-slbl');
  if (slbl) {
    const mH = ST.h.mode, mK = ST.k.mode;
    slbl.textContent = mH === mK
      ? { ms: 'Ergebnis \u2014 Massenstrom', q: 'Ergebnis \u2014 Leistung', dt: 'Ergebnis \u2014 \u0394T' }[mH]
      : 'Ergebnis';
  }

  const any = rH.ok || rK.ok;
  show($('pi-card'),        any);
  show($('pi-placeholder'), !any);

  if (rH.ok) {
    show($('pi-h'), true);
    $('pi-h-vol').textContent = '(' + loc(rH.m3h, 3) + '\u202fm\u00b3/h)';
    renderPair('pi-h-pair', rH.m3h, DP0, 'best-h');
  } else { show($('pi-h'), false); }

  if (rK.ok) {
    show($('pi-k'), true);
    $('pi-k-vol').textContent = '(' + loc(rK.m3h, 3) + '\u202fm\u00b3/h)';
    renderPair('pi-k-pair', rK.m3h, DP0, 'best-k');
  } else { show($('pi-k'), false); }
}

/* ───────────────────────────────────────
   ROHR-TAB
─────────────────────────────────────── */
function calcPipeTab() {
  const vol = parseFloat($('p-vol').value) || 0;
  const mx  = parseFloat($('p-dp').value)  || 100;
  const el  = $('pipe-results');
  const leg = $('pipe-legend');

  if (!vol) {
    el.innerHTML = '<p style="font-family:Arial,sans-serif;color:var(--t3);font-size:12px;text-align:center;padding:18px 0">Volumenstrom eingeben \u2192</p>';
    if (leg) leg.style.display = 'none';
    return;
  }

  const bS = PIPES.findIndex(p => pdrop(vol, p[1], ES).dp <= mx);
  const bM = PIPES.findIndex(p => p[5] !== null && pdrop(vol, p[5], EM).dp <= mx);
  const lo = Math.max(0, Math.min(bS < 0 ? PIPES.length - 1 : bS,
                                  bM < 0 ? PIPES.length - 1 : bM) - 1);
  const hi = Math.min(PIPES.length - 1, Math.max(bS < 0 ? PIPES.length - 1 : bS,
                                                  bM < 0 ? PIPES.length - 1 : bM) + 1);
  let h = '';
  for (let i = lo; i <= hi; i++) {
    const p = PIPES[i];
    h += `<div style="margin-bottom:12px">
      <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;
                  letter-spacing:.13em;text-transform:uppercase;color:var(--t3);margin-bottom:7px">
        DN ${p[0]}
      </div>
      <div class="pipe-pair">
        ${pCardSteel(p, vol, mx, i === bS)}
        ${pCardMapress(p, vol, mx, i === bM)}
      </div>
    </div>`;
  }
  el.innerHTML = h;
  if (leg) leg.style.display = 'flex';
}

/* ───────────────────────────────────────
   HK-SWITCH (Heizung ↔ Kälte)
─────────────────────────────────────── */
function flowSwitch(hk) {
  show($('flow-panel-h'), hk === 'h');
  show($('flow-panel-k'), hk === 'k');
  $('flow-btn-h').className = 'hk-btn' + (hk === 'h' ? ' on-h' : '');
  $('flow-btn-k').className = 'hk-btn' + (hk === 'k' ? ' on-k' : '');
}

/* ───────────────────────────────────────
   EVENTS + INIT
─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Mode-Buttons Heizung/Kälte
  document.querySelectorAll('.mbtn[data-p]').forEach(b => {
    b.addEventListener('click', () => {
      const p = b.dataset.p, v = b.dataset.v;
      ST[p].mode = v;
      document.querySelectorAll(`.mbtn[data-p="${p}"]`)
        .forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      updateLayout(p);
      calcAll();
    });
  });

  // Eingabefelder
  ['medium', 'h-q', 'h-ms-in', 'h-dt', 'k-q', 'k-ms-in', 'k-dt']
    .forEach(id => $(id)?.addEventListener('input', calcAll));

  // Rohr-Tab Eingabefelder
  ['p-vol', 'p-dp']
    .forEach(id => $(id)?.addEventListener('input', calcPipeTab));

  // Init
  updateLayout('h');
  updateLayout('k');
  flowSwitch('h');
  calcAll();
});
