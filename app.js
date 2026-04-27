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
const TABS = ['flow', 'luft', 'pipe', 'unit', 'hx', 'wrg', 'trinkwasser'];

/* ─── NAVIGATION STATE MACHINE ─── */
const NAV = {
  activeTab:   'flow',
  sheetOpen:   false,

  /* Einzige Wahrheitsquelle für alle Navigation-Zustände */
  _apply() {
    /* Tabs */
    TABS.forEach(id => {
      const el = $('tab-' + id);
      if (!el) return;
      if (id === NAV.activeTab) {
        el.style.display = (id === 'hx') ? 'block' : 'flex';
      } else {
        el.style.display = 'none';
      }
    });

    /* Desktop Tab-Bar */
    document.querySelectorAll('.tab-btn[data-tab]').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === NAV.activeTab)
    );

    /* Pill Haupt-Buttons */
    ['flow','luft','hx','unit'].forEach(id =>
      $('pill-' + id)?.classList.toggle('active', id === NAV.activeTab)
    );

    /* Plus-Sheet-Items Markierung */
    ['pipe','unit','wrg','trinkwasser'].forEach(id =>
      $('plus-' + id)?.classList.toggle('active-tab', id === NAV.activeTab)
    );

    /* Plus-Sheet */
    $('plus-sheet')?.classList.toggle('open', NAV.sheetOpen);
    $('plus-overlay')?.classList.toggle('open', NAV.sheetOpen);
    $('pill-plus')?.classList.toggle('open', NAV.sheetOpen);
    $('pill-plus')?.setAttribute('aria-expanded', String(NAV.sheetOpen));

    /* h,x Canvas: bei Tab-Wechsel neu zeichnen */
    if (NAV.activeTab === 'hx' && typeof drawHxChart === 'function') {
      setTimeout(() => drawHxChart(window._hxState || null), 80);
    }
  },
};

/* ─── HEADER MENU ─── */
const MENU = {
  open: false,
  _apply() {
    document.body.classList.toggle('menu-open', MENU.open);
    $('app-menu-overlay')?.classList.toggle('open', MENU.open);
    $('app-menu-sheet')?.classList.toggle('open', MENU.open);
    $('hdr-menu-btn')?.classList.toggle('open', MENU.open);
    $('hdr-menu-btn')?.setAttribute('aria-expanded', String(MENU.open));
  },
};

function openAppMenu()  { MENU.open = true;  closePlusSheet(); MENU._apply(); }
function closeAppMenu() { MENU.open = false; MENU._apply(); }
function toggleAppMenu(){ MENU.open = !MENU.open; if (MENU.open) closePlusSheet(); MENU._apply(); }

function _setMenuMessage(title, body) {
  alert(title + (body ? '\n\n' + body : ''));
}

function _handleMenuAction(action) {
  if (action === 'pdf') {
    closeAppMenu();
    if (typeof openPdfSheet === 'function') openPdfSheet();
    return;
  }
  if (action === 'nav-config') {
    _setMenuMessage('Schnellzugriffe', 'Die frei konfigurierbare Navigation Pill ist für Phase 2 vorbereitet.');
    return;
  }
  if (action === 'favorites') {
    _setMenuMessage('Favoriten', 'Favoriten werden in einer späteren Ausbaustufe aktiviert.');
    return;
  }
  if (action === 'projects') {
    _setMenuMessage('Projekte', 'Projektverwaltung wird in einer späteren Ausbaustufe aktiviert.');
    return;
  }
  if (action === 'help') {
    _setMenuMessage('Hinweis', 'TechCalc Pro ist als HLSK Quick Tool für schnelle Prüfung, Nachrechnung und Dokumentation gedacht. Keine vollständige Fachplanung oder Rohrnetzberechnung.');
    return;
  }
  if (action === 'legal') {
    _setMenuMessage('Impressum / Datenschutz', 'Platzhalter für die rechtlichen Angaben.');
  }
}

function _setupThemeMenu() {
  const saved = localStorage.getItem('tcp_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
  document.querySelectorAll('[data-theme]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === saved);
    btn.addEventListener('click', () => {
      localStorage.setItem('tcp_theme', btn.dataset.theme);
      document.documentElement.dataset.theme = btn.dataset.theme;
      document.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('active', b === btn));
    });
  });
}

function _setBuildLabel() {
  const el = $('app-build-label');
  if (!el) return;
  const build = window.TECHCALC_BUILD || document.querySelector('meta[name="techcalc-build"]')?.content || 'local';
  el.textContent = build;
}

function switchTab(t) {
  if (!TABS.includes(t)) return;
  NAV.activeTab = t;
  NAV.sheetOpen = false;  /* Sheet schließt immer beim Tab-Wechsel */
  closeAppMenu();
  NAV._apply();
}

function togglePlusSheet() {
  NAV.sheetOpen = !NAV.sheetOpen;
  NAV._apply();
}

function openPlusSheet()  { NAV.sheetOpen = true;  NAV._apply(); }
function closePlusSheet() { NAV.sheetOpen = false; NAV._apply(); }

function _switchFromPlus(tab) {
  if (!TABS.includes(tab)) return;
  NAV.activeTab = tab;
  NAV.sheetOpen = false;
  NAV._apply();
}

/* ─── PILL SICHTBARKEIT ─── */

/* ─── MOBILE KEYBOARD GUARD — Pill nie über iOS Tastatur ─── */
function _setKeyboardOpen(on) {
  document.body.classList.toggle('keyboard-open', !!on);
  if (on) closePlusSheet();
}

function _setupKeyboardGuard() {
  let baseH = window.visualViewport?.height || window.innerHeight;
  const isFormEl = el => el && ['INPUT','TEXTAREA','SELECT'].includes(el.tagName);

  document.addEventListener('focusin', e => {
    if (isFormEl(e.target)) _setKeyboardOpen(true);
  });
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!isFormEl(document.activeElement)) _setKeyboardOpen(false);
    }, 120);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const h = window.visualViewport.height;
      if (h > baseH) baseH = h;
      _setKeyboardOpen(baseH - h > 120 || isFormEl(document.activeElement));
    });
  }
}

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
  // Header Menü
  $('hdr-menu-btn')?.addEventListener('click', toggleAppMenu);
  $('app-menu-close')?.addEventListener('click', closeAppMenu);
  $('app-menu-overlay')?.addEventListener('click', closeAppMenu);
  document.querySelectorAll('[data-menu-action]').forEach(btn => {
    btn.addEventListener('click', () => _handleMenuAction(btn.dataset.menuAction));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAppMenu(); });
  _setupThemeMenu();
  _setBuildLabel();

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
  ['pipe','unit','wrg','trinkwasser'].forEach(id => {
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
  _setupKeyboardGuard();

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
