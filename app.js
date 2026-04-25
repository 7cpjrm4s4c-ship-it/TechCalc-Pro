/* ═══════════════════════════════════════════════════════
   app.js  —  Massenstromrechner PWA
   Gemeinsame Utilities · Tab-Steuerung · PWA · Einheitenrechner
═══════════════════════════════════════════════════════ */
'use strict';

/* ───────────────────────────────────────
   SHARED UTILITIES
   (werden von heating-cooling.js, ventilation.js
    und pdf-export.js verwendet)
─────────────────────────────────────── */
const $ = id => document.getElementById(id);
const show = (e, v) => { if (e) e.style.display = v ? '' : 'none'; };
const loc  = (v, d) => v.toLocaleString('de-DE', {
  minimumFractionDigits: d,
  maximumFractionDigits: d,
});

/* ───────────────────────────────────────
   TAB-STEUERUNG
─────────────────────────────────────── */
const TABS = ['flow', 'luft', 'pipe', 'unit', 'hx', 'wrg'];

/* ─── TAB WECHSELN ─── */
function switchTab(t) {
  // Desktop: Tab-Bar-Buttons
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === t)
  );
  // Panel anzeigen
  TABS.forEach(id => {
    const el = $('tab-' + id);
    if (!el) return;
    el.style.display = (id === t) ? (id === 'hx' ? 'block' : '') : 'none';
  });
  // h,x redraw
  if (t === 'hx' && typeof drawHxChart === 'function') {
    requestAnimationFrame(() => drawHxChart(window._hxState || null));
  }
  // Pill: Haupt-Buttons updaten
  _updatePill(t);
}

function _updatePill(activeTab) {
  // Haupt-Pill-Buttons (flow, luft, hx, unit)
  ['flow','luft','hx','unit'].forEach(id => {
    const btn = $('pill-' + id);
    if (btn) btn.classList.toggle('active', id === activeTab);
  });
  // Plus-Sheet-Items (pipe, unit, wrg) — active-tab Markierung
  // Plus sheet items active state
  ['pipe','unit','wrg'].forEach(id => {
    const btn = $('plus-' + id);
    if (btn) btn.classList.toggle('active-tab', id === activeTab);
  });
}

/* ─── PLUS SHEET ─── */
let _plusOpen = false;

function togglePlusSheet() {
  _plusOpen ? closePlusSheet() : openPlusSheet();
}

function openPlusSheet() {
  _plusOpen = true;
  $('plus-sheet')?.classList.add('open');
  $('plus-overlay')?.classList.add('open');
  $('pill-plus')?.classList.add('open');
  $('pill-plus')?.setAttribute('aria-expanded', 'true');
}

function closePlusSheet() {
  _plusOpen = false;
  $('plus-sheet')?.classList.remove('open');
  $('plus-overlay')?.classList.remove('open');
  $('pill-plus')?.classList.remove('open');
  $('pill-plus')?.setAttribute('aria-expanded', 'false');
}

function _switchFromPlus(tab) {
  closePlusSheet();
  switchTab(tab);
}

/* ─── PILL SICHTBARKEIT ─── */
function _updatePillVisibility() {
  const pill = $('bottom-pill');
  if (!pill) return;
  if (window.innerWidth < 900) {
    pill.style.display = 'flex';
  } else {
    pill.style.display = 'none';
    closePlusSheet();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Desktop Tab-Bar
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });

  // Pill Haupt-Buttons
  ['flow','luft','hx','unit'].forEach(id => {
    $('pill-' + id)?.addEventListener('click', () => switchTab(id));
  });

  // Plus Button
  $('pill-plus')?.addEventListener('click', togglePlusSheet);

  // Plus Overlay schließt Sheet
  $('plus-overlay')?.addEventListener('click', closePlusSheet);

  // Plus Sheet Items
  ['pipe','unit','wrg'].forEach(id => {
    $('plus-' + id)?.addEventListener('click', () => _switchFromPlus(id));
  });
  // Note: plus-hx removed — h,x is now in main pill

  // Swipe-Down schließt Sheet
  let _touchStartY = 0;
  $('plus-sheet')?.addEventListener('touchstart', e => {
    _touchStartY = e.touches[0].clientY;
  }, { passive: true });
  $('plus-sheet')?.addEventListener('touchmove', e => {
    if (e.touches[0].clientY - _touchStartY > 60) closePlusSheet();
  }, { passive: true });

  // Pill Sichtbarkeit
  _updatePillVisibility();
  window.addEventListener('resize', _updatePillVisibility);

  // Initial Tab
  switchTab('flow');
});

/* ───────────────────────────────────────
   PWA — SERVICE WORKER
─────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        // iOS: sofort auf Updates prüfen
        reg.update();

        if (reg.waiting) {
          reg.waiting.postMessage('SKIP_WAITING');
        }
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch(() => {});

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  });
}

/* ───────────────────────────────────────
   PWA — INSTALL BANNER
─────────────────────────────────────── */
let _installPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _installPrompt = e;
  const ib = $('ib');
  if (ib) ib.style.display = 'flex';
});

document.addEventListener('DOMContentLoaded', () => {
  $('ib-y')?.addEventListener('click', () => {
    _installPrompt?.prompt();
    const ib = $('ib'); if (ib) ib.style.display = 'none';
  });
  $('ib-n')?.addEventListener('click', () => {
    const ib = $('ib'); if (ib) ib.style.display = 'none';
  });
});

window.addEventListener('appinstalled', () => {
  const ib = $('ib'); if (ib) ib.style.display = 'none';
});

/* ───────────────────────────────────────
   EINHEITENRECHNER
─────────────────────────────────────── */
const UNITS = {
  pressure: {
    title: 'Druck \u2014 Umrechnung',
    base: 'Pa',
    units: [
      { key:'bar',  label:'bar',  factor:1e5 },
      { key:'mbar', label:'mbar', factor:1e2 },
      { key:'mWs',  label:'mWs',  factor:9806.65, decimals:2 },
      { key:'Pa',   label:'Pa',   factor:1 },
      { key:'hPa',  label:'hPa',  factor:1e2 },
      { key:'kPa',  label:'kPa',  factor:1e3 },
    ],
    defFrom:'mbar', defTo:'kPa',
  },
  power: {
    title: 'Leistung \u2014 Umrechnung',
    base: 'W',
    units: [
      { key:'W',   label:'W',    factor:1 },
      { key:'kW',  label:'kW',   factor:1e3 },
      { key:'MW',  label:'MW',   factor:1e6 },
      { key:'Js',  label:'J/s',  factor:1 },
      { key:'kJs', label:'kJ/s', factor:1e3 },
    ],
    defFrom:'W', defTo:'kW',
  },
  energy: {
    title: 'Energie \u2014 Umrechnung',
    base: 'J',
    units: [
      { key:'J',   label:'J',   factor:1 },
      { key:'kJ',  label:'kJ',  factor:1e3 },
      { key:'Ws',  label:'Ws',  factor:1 },
      { key:'Wh',  label:'Wh',  factor:3600 },
      { key:'kWh', label:'kWh', factor:3.6e6 },
    ],
    defFrom:'kWh', defTo:'kJ',
  },
  flow: {
    title: 'Volumenstrom \u2014 Umrechnung',
    base: 'm3h',
    units: [
      { key:'m3h',   label:'m\u00b3/h',   factor:1 },
      { key:'m3min', label:'m\u00b3/min', factor:60 },
      { key:'m3s',   label:'m\u00b3/s',   factor:3600 },
      { key:'ls',    label:'l/s',          factor:3.6 },
      { key:'lmin',  label:'l/min',        factor:0.06 },
      { key:'lh',    label:'l/h',          factor:0.001 },
    ],
    defFrom:'m3h', defTo:'ls',
  },
  mass: {
    title: 'Gewicht \u2014 Umrechnung',
    base: 'kg',
    units: [
      { key:'mg', label:'mg', factor:1e-6 },
      { key:'g',  label:'g',  factor:1e-3 },
      { key:'kg', label:'kg', factor:1 },
      { key:'t',  label:'t',  factor:1e3 },
    ],
    defFrom:'kg', defTo:'g',
  },
  volume: {
    title: 'Volumen \u2014 Umrechnung',
    base: 'm3',
    units: [
      { key:'mm3', label:'mm\u00b3',  factor:1e-9 },
      { key:'cm3', label:'cm\u00b3',  factor:1e-6 },
      { key:'dm3', label:'dm\u00b3',  factor:1e-3 },
      { key:'l',   label:'Liter',     factor:1e-3 },
      { key:'m3',  label:'m\u00b3',   factor:1 },
    ],
    defFrom:'m3', defTo:'l',
  },
  area: {
    title: 'Fl\u00e4che \u2014 Umrechnung',
    base: 'm2',
    units: [
      { key:'mm2', label:'mm\u00b2',  factor:1e-6 },
      { key:'cm2', label:'cm\u00b2',  factor:1e-4 },
      { key:'dm2', label:'dm\u00b2',  factor:1e-2 },
      { key:'m2',  label:'m\u00b2',   factor:1 },
      { key:'ha',  label:'ha',        factor:1e4 },
      { key:'km2', label:'km\u00b2',  factor:1e6 },
    ],
    defFrom:'m2', defTo:'cm2',
  },
};

let UCurrent = 'pressure';

function ufmt(v, decimals) {
  if (v === 0) return '0';
  if (decimals !== undefined) {
    return v.toLocaleString('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }
  const abs = Math.abs(v);
  if (abs >= 1e9) return v.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  if (abs >= 1)   return v.toLocaleString('de-DE', {
    maximumFractionDigits: 6,
    maximumSignificantDigits: 8,
  });
  return parseFloat(v.toPrecision(8))
    .toLocaleString('de-DE', { maximumFractionDigits: 10 });
}

function buildSelects(cat) {
  const d = UNITS[cat];
  const fs = $('unit-from-sel');
  const ts = $('unit-to-sel');
  if (!fs || !ts) return;
  fs.innerHTML = '';
  ts.innerHTML = '';
  d.units.forEach(u => {
    fs.innerHTML += `<option value="${u.key}"${u.key===d.defFrom?' selected':''}>${u.label}</option>`;
    ts.innerHTML += `<option value="${u.key}"${u.key===d.defTo  ?' selected':''}>${u.label}</option>`;
  });
}

function unitCat(cat) {
  UCurrent = cat;
  const sel = $('unit-cat-sel');
  if (sel && sel.value !== cat) sel.value = cat;
  const title = $('unit-card-title');
  if (title) title.textContent = UNITS[cat].title;
  buildSelects(cat);
  const fv = $('unit-from-val'); if (fv) fv.value = '';
  const tv = $('unit-to-val');
  if (tv) { tv.textContent = '\u2013'; tv.style.color = 'var(--t4)'; }
  const al = $('unit-all-list');
  if (al) al.innerHTML = '<p style="color:var(--t3);font-size:12px;text-align:center;padding:12px 0">Wert eingeben \u2192</p>';
}

function unitCalc() {
  const d    = UNITS[UCurrent];
  const raw  = parseFloat($('unit-from-val').value);
  const fKey = $('unit-from-sel').value;
  const tKey = $('unit-to-sel').value;
  const tv   = $('unit-to-val');
  const al   = $('unit-all-list');

  if (isNaN(raw)) {
    if (tv) { tv.textContent = '\u2013'; tv.style.color = 'var(--t4)'; }
    if (al) al.innerHTML = '<p style="color:var(--t3);font-size:12px;text-align:center;padding:12px 0">Wert eingeben \u2192</p>';
    return;
  }

  const fUnit  = d.units.find(u => u.key === fKey);
  const tUnit  = d.units.find(u => u.key === tKey);
  const base   = raw * fUnit.factor;
  const result = base / tUnit.factor;

  if (tv) { tv.textContent = ufmt(result, tUnit.decimals); tv.style.color = 'var(--grn)'; }

  if (al) {
    let html = '';
    d.units.forEach(u => {
      const v      = base / u.factor;
      const isFrom = u.key === fKey;
      const isTo   = u.key === tKey;
      const cls    = (isFrom || isTo) ? 'unit-row uh' : 'unit-row';
      const marker = isFrom ? ' \u2190' : isTo ? ' \u2192' : '';
      html += `<div class="${cls}">
        <span class="unit-k">${u.label}${marker}</span>
        <span class="unit-v">${ufmt(v, u.decimals)}</span>
      </div>`;
    });
    al.innerHTML = html;
  }
}

function unitSwap() {
  const fs = $('unit-from-sel');
  const ts = $('unit-to-sel');
  const tmp = fs.value;
  fs.value = ts.value;
  ts.value = tmp;
  const resText = $('unit-to-val')?.textContent;
  if (resText && resText !== '\u2013') {
    const n = parseFloat(resText.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(n)) $('unit-from-val').value = n;
  }
  unitCalc();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  unitCat('pressure');
});
