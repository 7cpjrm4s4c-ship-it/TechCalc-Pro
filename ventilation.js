/* ═══════════════════════════════════════════════════════
   ventilation.js  —  Massenstromrechner PWA
   Lüftung — Volumenstrom · Leistung · Temperaturdifferenz
   Abhängigkeit: app.js muss zuerst geladen sein ($, show, loc)
═══════════════════════════════════════════════════════ */
'use strict';

/* ───────────────────────────────────────
   KONSTANTEN + ZUSTAND
─────────────────────────────────────── */
const CP_AIR = 1005;  // J/(kg·K)

const LST = { hk: 'h', mode: 'v', qUnit: 'W' };

/** Luftdichte nach idealer Gasgleichung [kg/m³] */
function rhoAir(t) {
  if (t <= -273.15) return NaN; // Absoluter Nullpunkt — unphysikalisch
  return 353.05 / (t + 273.15);
}

/* ───────────────────────────────────────
   W / kW UMSCHALTEN
─────────────────────────────────────── */
function setLuftQUnit(unit) {
  LST.qUnit = unit;

  ['luft-q-in-h', 'luft-q-in-k'].forEach(id => {
    const inp = $(id);
    if (inp) {
      inp.step        = unit === 'kW' ? '0.1' : '100';
      inp.placeholder = unit === 'kW' ? '0.00' : '0';
    }
  });

  const badge  = $('luft-q-unit-badge');   if (badge)  badge.textContent  = unit;
  const badge2 = $('luft-q-unit-badge-k'); if (badge2) badge2.textContent = unit;

  $('luft-wu') ?.classList.toggle('active', unit === 'W');
  $('luft-kwu')?.classList.toggle('active', unit === 'kW');

  calcLuft();
}

/* ───────────────────────────────────────
   SICHTBARKEIT — identisch zu updateLayout(p)
─────────────────────────────────────── */
function updateLuftLayout() {
  const m = LST.mode;
  show($('luft-ig-q'),       m !== 'q');
  show($('luft-ig-v'),       m !== 'v');
  show($('luft-temp-block'), m !== 'dt');
}

/* ───────────────────────────────────────
   HEIZUNG ↔ KÜHLUNG UMSCHALTEN
─────────────────────────────────────── */
function luftSwitch(hk) {
  LST.hk = hk;

  $('luft-btn-h').className = 'hk-btn' + (hk === 'h' ? ' on-h' : '');
  $('luft-btn-k').className = 'hk-btn' + (hk === 'k' ? ' on-k' : '');

  const card = $('luft-in-card');
  if (card) card.className = 'gc ' + (hk === 'h' ? 'gc-h' : 'gc-c');

  const ptitle = $('luft-ptitle');
  if (ptitle) ptitle.innerHTML = hk === 'h'
    ? '<div class="dot dot-h"></div><span class="ptitle-lbl">Heizleistung \u2014 Eingaben</span>'
    : '<div class="dot dot-c"></div><span class="ptitle-lbl" style="color:var(--cold-t)">K\u00fchlleistung \u2014 Eingaben</span>';

  const dtl = $('luft-dt-auto-lbl');
  if (dtl) dtl.innerHTML = hk === 'h'
    ? '\u0394t = t<sub>ZL,H</sub> \u2212 t<sub>R,H</sub>'
    : '\u0394t = t<sub>R,K</sub> \u2212 t<sub>ZL,K</sub>';

  const outTitle = $('luft-out-title');
  if (outTitle) outTitle.textContent = hk === 'h'
    ? 'Ergebnis \u2014 Heizleistung Luft'
    : 'Ergebnis \u2014 K\u00fchlleistung Luft';

  show($('luft-q-wrap-h'), hk === 'h');
  show($('luft-q-wrap-k'), hk === 'k');

  calcLuft();
}

/* ───────────────────────────────────────
   MODUS WECHSELN (Volumenstrom / Leistung / Δt)
─────────────────────────────────────── */
function luftMode(m) {
  LST.mode = m;
  document.querySelectorAll('.mbtn[data-lm]')
    .forEach(b => b.classList.toggle('active', b.dataset.lm === m));
  updateLuftLayout();
  calcLuft();
}

/* ───────────────────────────────────────
   BERECHNUNG
─────────────────────────────────────── */
function calcLuft() {
  const hk = LST.hk;
  const m  = LST.mode;

  const vv    = parseFloat($('luft-v')?.value);
  const vvOk  = !isNaN(vv) && vv > 0;
  const tzlH  = parseFloat($('luft-tzl-h')?.value);
  const tzlK  = parseFloat($('luft-tzl-k')?.value);
  const tzl   = hk === 'h' ? tzlH : tzlK;
  const trH   = parseFloat($('luft-tr-h')?.value)     || 20;
  const trK   = parseFloat($('luft-tr-k')?.value)     || 26;
  const tr    = hk === 'h' ? trH : trK;
  const qRaw  = parseFloat($('luft-q-in-' + hk)?.value);
  const qIn   = (!isNaN(qRaw) && qRaw > 0) ? (LST.qUnit === 'kW' ? qRaw * 1000 : qRaw) : 0;
  const qInOk = qIn > 0;

  // Automatische Temperaturdifferenz
  let dtAuto = NaN;
  if (!isNaN(tzl)) dtAuto = hk === 'h' ? tzl - tr : tr - tzl;

  const dtAutoEl = $('luft-dt-auto-val');
  if (dtAutoEl) {
    const valid = !isNaN(dtAuto) && dtAuto > 0;
    dtAutoEl.textContent = valid ? loc(dtAuto, 1) : '\u2013';
    dtAutoEl.className   = 'inp-ro' + (valid ? '' : ' empty');
    const bc  = hk === 'h' ? 'rgba(255,107,53,.10)' : 'rgba(0,196,232,.10)';
    const bc2 = hk === 'h' ? 'rgba(255,107,53,.40)' : 'rgba(0,196,232,.40)';
    const tc  = hk === 'h' ? 'var(--heat-t)' : 'var(--cold-t)';
    dtAutoEl.style.cssText = 'font-size:18px;padding:11px 52px 11px 14px;' +
      (valid ? `background:${bc};border:1.5px solid ${bc2};color:${tc}` : '');
  }

  const dt   = m !== 'dt' ? (!isNaN(dtAuto) && dtAuto > 0 ? dtAuto : 0) : 0;
  const tRef = !isNaN(tzl) && tzl > -273 ? tzl : 20;
  const rho  = rhoAir(tRef);
  const fac  = rho * CP_AIR / 3600;   // Wh/(m³·K)

  // Luftkennwerte anzeigen
  const rd = $('luft-rho-display');
  if (rd) rd.textContent = rho.toFixed(3) + '\u202fkg/m\u00b3';
  const fd = $('luft-factor-display');
  if (fd) fd.textContent = fac.toFixed(4) + '\u202fWh/(m\u00b3\u00b7K)';

  // Kernberechnung
  let Q = 0, V = 0, dT = 0, ok = false;
  if (m === 'v'  && qInOk && dt > 0)         { V = qIn / (fac * dt); Q = qIn; dT = dt; ok = true; }
  if (m === 'q'  && vvOk  && dt > 0)         { Q = (vv||0) * fac * dt; V = vv||0; dT = dt; ok = true; }
  if (m === 'dt' && vvOk  && qInOk)          { dT = qIn / ((vv||0) * fac); Q = qIn; V = vv||0; ok = true; }

  const ms   = ok ? V * rho : 0;
  const col  = hk === 'h' ? 'var(--heat-t)' : 'var(--cold-t)';
  const sub2 = hk === 'h' ? 'rgba(255,170,122,.6)' : 'rgba(102,223,255,.6)';
  const lbl  = { v: 'Volumenstrom V\u0307', q: 'Leistung Q', dt: '\u0394t' }[m];
  const val  = ok ? (m === 'v' ? loc(V, 1) : m === 'q' ? loc(Q, 0) : loc(dT, 2)) : '\u2013';
  const unit = { v: 'm\u00b3/h', q: 'W', dt: 'K' }[m];
  const sub  = ok
    ? (m === 'v' ? loc(V * rho, 1) + '\u202fkg/h' : m === 'q' ? loc(Q / 1000, 2) + '\u202fkW' : '')
    : '';

  // Ergebnis-Hauptfeld
  const llbl = $('luft-main-lbl'); if (llbl) llbl.textContent = lbl;
  const mv   = $('luft-main-val');
  if (mv) {
    mv.style.color = ok ? col : 'var(--t4)';
    mv.innerHTML   = val + `<span style="font-size:16px;font-weight:400;color:var(--t3)"> ${unit}</span>`;
  }
  const ms2 = $('luft-main-sub');
  if (ms2) { ms2.style.color = sub2; ms2.textContent = sub; }

  // Detail-Grid
  const sv = (id, on, v) => {
    const e = $(id);
    if (e) { e.textContent = on ? v : '\u2013'; e.style.color = on ? 'var(--t1)' : 'var(--t4)'; }
  };
  sv('luft-kw',     ok && m !== 'dt', loc(Q / 1000, 2) + '\u202fkW');
  sv('luft-v-out',  ok,               loc(V, 1));
  sv('luft-dt-out', ok,               loc(dT, 2));

  const msel = $('luft-ms');
  if (msel) {
    msel.textContent = ok ? loc(ms, 1) : '\u2013';
    msel.style.color = ok ? 'var(--air-t)' : 'var(--t4)';
  }
}

/* ───────────────────────────────────────
   EVENTS + INIT
─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Mode-Buttons Lüftung
  document.querySelectorAll('.mbtn[data-lm]')
    .forEach(b => b.addEventListener('click', () => luftMode(b.dataset.lm)));

  // Eingabefelder
  ['luft-v', 'luft-tzl-h', 'luft-tzl-k', 'luft-tr-h', 'luft-tr-k',
   'luft-q-in-h', 'luft-q-in-k']
    .forEach(id => $(id)?.addEventListener('input', calcLuft));

  // Init
  luftSwitch('h');
  updateLuftLayout();
  calcLuft();
});
