
function tcpGetPipeMaterial(){
  const el = document.querySelector('#tab-pipe #pipe-material');
  return el ? el.value : 'steel';
}
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

function dpState(dp, mx) {
  return dp <= mx * 0.75 ? 'ok' : dp <= mx ? 'warn' : 'bad';
}

function pipeModeClass(bestCls) {
  if (bestCls === 'best-h') return 'pipe-card--heat';
  if (bestCls === 'best-k') return 'pipe-card--cool';
  return 'pipe-card--neutral';
}

/* ───────────────────────────────────────
   ROHR-KARTEN HTML
─────────────────────────────────────── */
function pCardSteel(p, vol, mx, isBest, bestCls) {
  bestCls = bestCls || 'best';
  const { dp, v } = pdrop(vol, p[1], ES);
  const state = dpState(dp, mx);
  const pct   = Math.min(100, dp / mx * 100).toFixed(1);
  const cls   = [
    'pm', 'pipe-card', pipeModeClass(bestCls),
    isBest ? 'is-recommended' : '', isBest ? bestCls : '',
    dp > mx ? 'over' : '', `pipe-card--${state}`
  ].filter(Boolean).join(' ');
  const star  = isBest ? '<span class="star" aria-label="Empfohlen">★</span>' : '';
  const dpTxt = dp < 10 ? dp.toFixed(1) : Math.round(dp);
  return `<div class="${cls}">
    <div class="pm-std">${p[4]} ${star}</div>
    <div class="pm-dn">DN ${p[0]}</div>
    <div class="pm-dim">Ø ${p[2]} × ${p[3]} mm<br>dᵢ ${p[1].toFixed(1)} mm</div>
    <div class="pm-r"><span class="pm-k">Δp/m</span><span class="pm-v pipe-dp pipe-dp--${state}">${dpTxt}<span class="pm-unit"> Pa/m</span></span></div>
    <div class="pm-r"><span class="pm-k">v</span><span class="pm-v pipe-velocity">${v.toFixed(2)} m/s</span></div>
    <div class="dpbar pipe-bar"><div class="dpfill pipe-bar-fill pipe-bar-fill--${state}" style="width:${pct}%"></div></div>
  </div>`;
}

function pCardMapress(p, vol, mx, isBest, bestCls) {
  bestCls = bestCls || 'best';
  if (p[0] > MAPRESS_MAX_DN || p[5] === null) {
    return `<div class="pm pipe-card pipe-card--neutral na">
      <div class="pm-std mp">Mapress Edelstahl</div>
      <div class="pm-dn">DN ${p[0]}</div>
      <div class="pm-na-txt">Nicht verfügbar<br/>(max. DN ${MAPRESS_MAX_DN})</div>
    </div>`;
  }
  const { dp, v } = pdrop(vol, p[5], EM);
  const state = dpState(dp, mx);
  const pct   = Math.min(100, dp / mx * 100).toFixed(1);
  const cls   = [
    'pm', 'pipe-card', pipeModeClass(bestCls),
    isBest ? 'is-recommended' : '', isBest ? bestCls : '',
    dp > mx ? 'over' : '', `pipe-card--${state}`
  ].filter(Boolean).join(' ');
  const star  = isBest ? '<span class="star" aria-label="Empfohlen">★</span>' : '';
  const dpTxt = dp < 10 ? dp.toFixed(1) : Math.round(dp);
  return `<div class="${cls}">
    <div class="pm-std mp">Mapress Edelstahl ${star}</div>
    <div class="pm-dn">DN ${p[0]}</div>
    <div class="pm-dim">Ø ${p[6]} × ${p[7]} mm<br>dᵢ ${p[5].toFixed(1)} mm</div>
    <div class="pm-r"><span class="pm-k">Δp/m</span><span class="pm-v pipe-dp pipe-dp--${state}">${dpTxt}<span class="pm-unit"> Pa/m</span></span></div>
    <div class="pm-r"><span class="pm-k">v</span><span class="pm-v pipe-velocity">${v.toFixed(2)} m/s</span></div>
    <div class="dpbar pipe-bar"><div class="dpfill pipe-bar-fill pipe-bar-fill--${state}" style="width:${pct}%"></div></div>
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
  $('pipe-material')?.addEventListener('change', ev => setPipeMaterial(ev.target.value));
  setPipeMaterial($('pipe-material')?.value || 'all');
  calcPipeTab();
});

document.addEventListener('change', (ev) => {
  if (ev.target && ev.target.matches('#tab-pipe #pipe-material')) {
    if (typeof calcPipeTab === 'function') calcPipeTab();
    if (typeof renderPipeTab === 'function') renderPipeTab();
    if (typeof window.calcPipeTab === 'function') window.calcPipeTab();
    if (typeof window.renderPipeTab === 'function') window.renderPipeTab();
  }
});


/* Pipe UI Component Fix */
(function tcpPipeUiComponentFix(){
  function getMaterial(){
    const el = document.querySelector('#tab-pipe #pipe-material');
    return el ? el.value : 'all';
  }
  function setMaterial(v){
    const el = document.querySelector('#tab-pipe #pipe-material');
    if (el) el.value = v;
    document.querySelectorAll('#tab-pipe .tcp-material-chip').forEach(b => {
      b.classList.toggle('is-active', b.dataset.pipeMaterial === v);
    });
  }
  function recalc(){
    if (typeof window.calcPipeTab === 'function') window.calcPipeTab();
    if (typeof window.renderPipeTab === 'function') window.renderPipeTab();
    requestAnimationFrame(normalize);
  }
  function normalize(){
    document.querySelectorAll('#tab-flow .pipe-card,#tab-pipe .pipe-card').forEach(c => c.classList.add('tcp-pipe-card'));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('#tab-pipe .tcp-material-chip');
    if (!b) return;
    setMaterial(b.dataset.pipeMaterial || 'all');
    recalc();
  }, true);
  document.addEventListener('change', e => {
    if (!e.target.matches('#tab-pipe #pipe-material')) return;
    setMaterial(e.target.value || 'all');
    recalc();
  }, true);
  document.addEventListener('DOMContentLoaded', () => { setMaterial(getMaterial()); normalize(); });
  document.addEventListener('click', () => requestAnimationFrame(normalize), true);
  window.tcpGetPipeMaterial = getMaterial;
})();
