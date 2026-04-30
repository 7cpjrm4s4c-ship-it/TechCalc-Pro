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

/* Rohrdimensionierung/Hydraulik ausgelagert nach pipe.js (Phase 16). */
const DP0 = window.TCP_PIPE?.DP0 || 100;


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
    window.TCP_PIPE?.renderPair('pi-h-pair', rH.m3h, DP0, 'best-h');
  } else { show($('pi-h'), false); }

  if (rK.ok) {
    show($('pi-k'), true);
    $('pi-k-vol').textContent = '(' + loc(rK.m3h, 3) + '\u202fm\u00b3/h)';
    window.TCP_PIPE?.renderPair('pi-k-pair', rK.m3h, DP0, 'best-k');
  } else { show($('pi-k'), false); }
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

  // Init
  updateLayout('h');
  updateLayout('k');
  flowSwitch('h');
  calcAll();
});
