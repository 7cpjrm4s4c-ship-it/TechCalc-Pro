/* ═══════════════════════════════════════════════════════
   pipe.js — Rohrdimensionierung / Hydraulik
   Aus Phase 16 aus heating-cooling.js ausgelagert.
   Abhängigkeit: app.js ($)
═══════════════════════════════════════════════════════ */
'use strict';

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
let PIPE_MATERIAL = 'all';

function currentPipeMaterial() {
  return PIPE_MATERIAL || 'all';
}

function setPipeMaterial(value) {
  PIPE_MATERIAL = ['all', 'steel', 'mapress'].includes(value) ? value : 'all';
  document.querySelectorAll('[data-pipe-material]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.pipeMaterial === PIPE_MATERIAL);
  });
  calcPipeTab();
  window.TCP_HC?.calcAll?.();
}

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

  const material = currentPipeMaterial();
  const bS = PIPES.findIndex(p => pdrop(vol, p[1], ES).dp <= mx);
  const bM = PIPES.findIndex(p => p[5] !== null && pdrop(vol, p[5], EM).dp <= mx);
  const iS = bS < 0 ? PIPES.length - 1 : bS;
  const iM = bM < 0
    ? PIPES.findIndex(p => p[0] === MAPRESS_MAX_DN)
    : bM;

  const cards = [];
  if (material === 'all' || material === 'steel') cards.push(pCardSteel(PIPES[iS], vol, mx, bS >= 0, bestCls));
  if (material === 'all' || material === 'mapress') cards.push(pCardMapress(PIPES[iM], vol, mx, bM >= 0, bestCls));

  el.classList.toggle('pipe-pair--single', cards.length === 1);
  el.innerHTML = cards.join('');
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
  const material = currentPipeMaterial();
  let h = '';
  for (let i = lo; i <= hi; i++) {
    const p = PIPES[i];
    const cards = [];
    if (material === 'all' || material === 'steel') cards.push(pCardSteel(p, vol, mx, i === bS));
    if (material === 'all' || material === 'mapress') cards.push(pCardMapress(p, vol, mx, i === bM));

    h += `<div class="pipe-dn-block">
      <div class="pipe-dn-title">DN ${p[0]}</div>
      <div class="pipe-pair ${cards.length === 1 ? 'pipe-pair--single' : ''}">${cards.join('')}</div>
    </div>`;
  }
  el.innerHTML = h;
  if (leg) leg.style.display = 'flex';
}

window.TCP_PIPE = {
  PIPES,
  DP0,
  pdrop,
  renderPair,
  calcPipeTab,
  currentPipeMaterial,
  setPipeMaterial,
};

document.addEventListener('DOMContentLoaded', () => {
  ['p-vol', 'p-dp'].forEach(id => $(id)?.addEventListener('input', calcPipeTab));
  document.addEventListener('click', ev => {
    const btn = ev.target?.closest?.('[data-pipe-material]');
    if (!btn) return;
    ev.preventDefault();
    setPipeMaterial(btn.dataset.pipeMaterial);
  });
  0 0'pipe-material')?.addEventListener('change', ev => setPipeMaterial(ev.target.value));
  setPipeMaterial(0 0'pipe-material')?.value || 'all');
  calcPipeTab();
});
