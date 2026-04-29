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
const TABS = ['flow', 'luft', 'pipe', 'unit', 'hx', 'wrg', 'trinkwasser', 'mag', 'entwaesserung'];

const MODULES = {
  flow: { label:'Heizung', fullLabel:'Heizung/Kälte', shortLabel:'Heizung', aria:'Heizung und Kälte', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c-1 2.5-2.5 4.5-2 7.5a4 4 0 108 0c0-1.5-.8-3-2-4 0 1.5-1 3-2.5 3S10 7 10 5"/><circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none"/></svg>' },
  luft: { label:'Lüftung', fullLabel:'Lüftung', shortLabel:'Lüftung', aria:'Lüftung', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.8"/><path d="M12 10.2C12 7 10 5 8 6s-2 4.5 1.5 5.5"/><path d="M13.8 12C17 12 19 10 18 8s-4.5-2-5.5 1.5"/><path d="M12 13.8C12 17 14 19 16 18s2-4.5-1.5-5.5"/><path d="M10.2 12C7 12 5 14 6 16s4.5 2 5.5-1.5"/></svg>' },
  pipe: { label:'Rohr', fullLabel:'Rohrdimensionierung', shortLabel:'Rohr', aria:'Rohrdimensionierung', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="5" height="8" rx="1.5"/><rect x="17" y="8" width="5" height="8" rx="1.5"/><line x1="7" y1="10.5" x2="17" y2="10.5"/><line x1="7" y1="13.5" x2="17" y2="13.5"/></svg>' },
  unit: { label:'Einheiten', fullLabel:'Einheiten', shortLabel:'Einheiten', aria:'Einheitenrechner', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h2v16H4M8 4l8 16M16 4h4M16 12h3"/><circle cx="18" cy="20" r="2"/></svg>' },
  hx: { label:'h,x', fullLabel:'h,x-Diagramm', shortLabel:'h,x', aria:'h,x-Diagramm', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 20 7 10 11 14 15 6 21 6"/><path d="M3 20h18M3 20V4"/></svg>' },
  wrg: { label:'WRG', fullLabel:'WRG / Mischluft', shortLabel:'WRG', aria:'WRG und Mischluft', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h12M4 8l3-3M4 8l3 3"/><path d="M20 16H8M20 16l-3-3M20 16l-3 3"/><line x1="12" y1="8" x2="12" y2="16"/></svg>' },
  trinkwasser: { label:'Trinkwasser', fullLabel:'Trinkwasser', shortLabel:'Wasser', aria:'Trinkwasser', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 7 6 10 6 14a6 6 0 0 0 12 0c0-4-2-7-6-12z"/><path d="M9 14h6"/></svg>' },
  mag: { label:'MAG', fullLabel:'MAG / Druckhaltung', shortLabel:'MAG', aria:'MAG und Druckhaltung', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><path d="M12 5v4"/><path d="M8 15c2.4 1.6 5.6 1.6 8 0"/><path d="M12 12h.01"/></svg>' },
  entwaesserung: { label:'Entwässerung', fullLabel:'Entwässerung', shortLabel:'Abwasser', aria:'Entwässerung', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16"/><path d="M6 5v4a6 6 0 0 0 12 0V5"/><path d="M12 15v6"/><path d="M8 21h8"/></svg>' },
};

const NAV_STORAGE_KEY = 'tcp_nav_favorites_v1';
const NAV_DEFAULT_FAVORITES = ['pipe', 'trinkwasser', 'unit', 'flow'];
let NAV_FAVORITES = _loadNavFavorites();

function _loadNavFavorites() {
  try {
    const raw = localStorage.getItem(NAV_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(id => TABS.includes(id)).filter((id, i, a) => a.indexOf(id) === i).slice(0, 4);
      if (valid.length === 4) return valid;
    }
  } catch (_) {}
  return NAV_DEFAULT_FAVORITES.filter(id => TABS.includes(id)).slice(0, 4);
}

function setNavFavorites(ids) {
  const valid = (Array.isArray(ids) ? ids : [])
    .filter(id => TABS.includes(id))
    .filter((id, i, a) => a.indexOf(id) === i)
    .slice(0, 4);
  while (valid.length < 4) {
    const next = TABS.find(id => !valid.includes(id));
    if (!next) break;
    valid.push(next);
  }
  NAV_FAVORITES = valid;
  try { localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(NAV_FAVORITES)); } catch (_) {}
  renderBottomNav();
  NAV._apply();
}

function resetNavFavorites() {
  try { localStorage.removeItem(NAV_STORAGE_KEY); } catch (_) {}
  NAV_FAVORITES = _loadNavFavorites();
  renderBottomNav();
  NAV._apply();
}

function _moduleButtonHtml(id, mode) {
  const m = MODULES[id];
  if (!m) return '';
  if (mode === 'pill') return `<button class="pill-btn" id="pill-${id}" data-tab="${id}" aria-label="${m.aria}">${m.icon}${m.shortLabel}</button>`;
  return `<button class="plus-item" id="plus-${id}" data-tab="${id}" aria-label="${m.aria}">${m.icon}${m.fullLabel}</button>`;
}

function renderBottomNav() {
  const pill = $('bottom-pill');
  const grid = document.querySelector('#plus-sheet .plus-grid');
  if (!pill || !grid) return;
  const visible = NAV_FAVORITES.filter(id => TABS.includes(id)).slice(0, 4);
  const overflow = TABS.filter(id => !visible.includes(id));
  pill.innerHTML = '<span class="pill-indicator" aria-hidden="true"></span>' + visible.map(id => _moduleButtonHtml(id, 'pill')).join('') + `
    <button class="pill-plus" id="pill-plus" aria-label="Weitere Module" aria-expanded="false">
      <span class="pill-plus-icon">+</span>
    </button>`;
  grid.innerHTML = overflow.map(id => _moduleButtonHtml(id, 'plus')).join('') || '<div class="plus-empty">Alle Module liegen bereits auf der Navigation Pill.</div>';
  pill.querySelectorAll('.pill-btn[data-tab]').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  $('pill-plus')?.addEventListener('click', togglePlusSheet);
  grid.querySelectorAll('.plus-item[data-tab]').forEach(btn => btn.addEventListener('click', () => _switchFromPlus(btn.dataset.tab)));
  updateBottomPillIndicator();
}

function updateBottomPillIndicator() {
  const pill = $('bottom-pill');
  if (!pill) return;
  const indicator = pill.querySelector('.pill-indicator');
  const activeBtn = pill.querySelector(`.pill-btn[data-tab="${NAV.activeTab}"]`);
  if (!indicator || !activeBtn) {
    if (indicator) indicator.style.setProperty('--pill-indicator-w', '0px');
    return;
  }
  const pillRect = pill.getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();
  const x = Math.max(0, btnRect.left - pillRect.left - 6);
  indicator.style.setProperty('--pill-indicator-x', `${Math.round(x)}px`);
  indicator.style.setProperty('--pill-indicator-w', `${Math.round(btnRect.width)}px`);
}
/* ─── NAVIGATION STATE MACHINE ─── */
const NAV = {
  activeTab:   'flow',
  sheetOpen:   false,

  /* Einzige Wahrheitsquelle für alle Navigation-Zustände */
  _apply() {
    /* Tabs: zentrale UI-Sprache steuert Layout ausschließlich über Klassen. */
    document.body.dataset.activeTab = NAV.activeTab;
    TABS.forEach(id => {
      const el = $('tab-' + id);
      if (!el) return;
      const active = id === NAV.activeTab;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-hidden', String(!active));
    });

    /* Desktop Tab-Bar */
    document.querySelectorAll('.tab-btn[data-tab]').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === NAV.activeTab)
    );

    /* Mobile Pill + Plus-Sheet Markierung (dynamisch gerendert) */
    document.querySelectorAll('.pill-btn[data-tab]').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.tab === NAV.activeTab)
    );
    
    updateBottomPillIndicator();

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

window.addEventListener('resize', () => requestAnimationFrame(updateBottomPillIndicator));
window.addEventListener('orientationchange', () => setTimeout(updateBottomPillIndicator, 120));

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

function openAppMenu()  { MENU.open = true;  closePlusSheet(); closeProjects(); MENU._apply(); }
function closeAppMenu() { MENU.open = false; MENU._apply(); }
function toggleAppMenu(){ MENU.open = !MENU.open; if (MENU.open) closePlusSheet(); MENU._apply(); }

/* ─── NAV FAVORITES CONFIG SHEET ─── */
const NAV_CONFIG = {
  open: false,
  draft: [],
  _apply() {
    document.body.classList.toggle('nav-config-open', NAV_CONFIG.open);
    $('nav-config-overlay')?.classList.toggle('open', NAV_CONFIG.open);
    $('nav-config-sheet')?.classList.toggle('open', NAV_CONFIG.open);
    if (NAV_CONFIG.open) renderNavConfig();
  },
};

function openNavConfig() {
  NAV_CONFIG.draft = NAV_FAVORITES.slice(0, 4);
  NAV_CONFIG.open = true;
  closeAppMenu();
  closePlusSheet();
  closeProjects();
  NAV_CONFIG._apply();
}
function closeNavConfig() { NAV_CONFIG.open = false; NAV_CONFIG._apply(); }
function toggleNavConfig() { NAV_CONFIG.open ? closeNavConfig() : openNavConfig(); }

function _navConfigToggle(id) {
  if (!TABS.includes(id)) return;
  const i = NAV_CONFIG.draft.indexOf(id);
  if (i >= 0) NAV_CONFIG.draft.splice(i, 1);
  else {
    if (NAV_CONFIG.draft.length >= 4) return;
    NAV_CONFIG.draft.push(id);
  }
  renderNavConfig();
}
let _navMoveLock = false;
function _navConfigMove(id, dir) {
  if (_navMoveLock) return;
  const i = NAV_CONFIG.draft.indexOf(id);
  if (i < 0) return;
  const j = i + dir;
  if (j < 0 || j >= NAV_CONFIG.draft.length) return;
  _navMoveLock = true;
  [NAV_CONFIG.draft[i], NAV_CONFIG.draft[j]] = [NAV_CONFIG.draft[j], NAV_CONFIG.draft[i]];
  renderNavConfig();
  setTimeout(() => { _navMoveLock = false; }, 180);
}
function saveNavConfig() {
  setNavFavorites(NAV_CONFIG.draft);
  closeNavConfig();
}
function resetNavConfig() {
  NAV_CONFIG.draft = NAV_DEFAULT_FAVORITES.slice(0, 4);
  renderNavConfig();
}
function renderNavConfig() {
  const selectedEl = $('nav-config-selected');
  const listEl = $('nav-config-list');
  const saveBtn = $('nav-config-save');
  const countEl = $('nav-config-count');
  if (!selectedEl || !listEl) return;

  const draft = NAV_CONFIG.draft.filter(id => TABS.includes(id)).slice(0, 4);
  NAV_CONFIG.draft = draft;
  if (countEl) countEl.textContent = `${draft.length}/4 Schnellzugriffe`;
  if (saveBtn) saveBtn.disabled = draft.length !== 4;

  selectedEl.innerHTML = draft.map((id, idx) => {
    const m = MODULES[id];
    return `<div class="nav-slot" data-id="${id}">
      <div class="nav-slot-rank">${idx + 1}</div>
      <div class="nav-slot-icon">${m.icon}</div>
      <div class="nav-slot-main"><strong>${m.fullLabel}</strong><small>${idx === 0 ? 'Links' : idx === 3 ? 'Rechts' : 'Position ' + (idx + 1)}</small></div>
      <button type="button" class="nav-move" data-move="up" data-id="${id}" ${idx === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" class="nav-move" data-move="down" data-id="${id}" ${idx === draft.length - 1 ? 'disabled' : ''}>↓</button>
      <button type="button" class="nav-remove" data-remove="${id}" aria-label="Entfernen">×</button>
    </div>`;
  }).join('') || '<div class="nav-config-empty">Noch keine Schnellzugriffe ausgewählt.</div>';

  listEl.innerHTML = TABS.map(id => {
    const m = MODULES[id];
    const on = draft.includes(id);
    const disabled = !on && draft.length >= 4;
    return `<button type="button" class="nav-module ${on ? 'selected' : ''}" data-nav-module="${id}" ${disabled ? 'disabled' : ''}>
      <span class="nav-module-icon">${m.icon}</span>
      <span><strong>${m.fullLabel}</strong><small>${on ? 'Auf Navigation Pill' : disabled ? 'Max. 4 erreicht' : 'Zum Schnellzugriff hinzufügen'}</small></span>
      <b>${on ? '✓' : '+'}</b>
    </button>`;
  }).join('');

  selectedEl.querySelectorAll('[data-move]').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      btn.blur();
      _navConfigMove(btn.dataset.id, btn.dataset.move === 'up' ? -1 : 1);
    });
  });
  selectedEl.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => _navConfigToggle(btn.dataset.remove)));
  listEl.querySelectorAll('[data-nav-module]').forEach(btn => btn.addEventListener('click', () => _navConfigToggle(btn.dataset.navModule)));
}


/* ─── PROJECTS — LOCAL STORAGE V1 ─── */
const PROJECT_STORAGE_KEY = 'tcp_saved_projects_v1';
const PROJECT_ACTIVE_KEY = 'tcp_active_project_v1';

const PROJECTS = {
  open: false,
  activeId: null,
  _apply() {
    document.body.classList.toggle('project-open', PROJECTS.open);
    $('project-overlay')?.classList.toggle('open', PROJECTS.open);
    $('project-sheet')?.classList.toggle('open', PROJECTS.open);
    if (PROJECTS.open) renderProjectList();
    updateProjectActiveLabel();
  },
};

function _projectNow() {
  return new Date().toISOString();
}

function _projectId() {
  return 'prj-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function getProjects() {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function saveProjects(arr) {
  try { localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(arr || [])); } catch (err) {
    alert('Projekt konnte nicht gespeichert werden.\n\n' + (err?.message || err));
  }
}

function getActiveProject() {
  const id = PROJECTS.activeId || localStorage.getItem(PROJECT_ACTIVE_KEY);
  return getProjects().find(p => p.id === id) || null;
}

function getActiveProjectMeta() {
  const p = getActiveProject();
  if (!p) return null;
  return {
    sb: p.owner || '',
    proj: p.name || '',
    nr: p.number || '',
    client: p.client || '',
  };
}
window.getActiveProjectMeta = getActiveProjectMeta;

function openProjects() {
  PROJECTS.open = true;
  closeAppMenu();
  closePlusSheet();
  closeNavConfig();
  PROJECTS.activeId = localStorage.getItem(PROJECT_ACTIVE_KEY) || PROJECTS.activeId;
  const active = getActiveProject();
  if (active) _fillProjectForm(active);
  PROJECTS._apply();
}
function closeProjects() { PROJECTS.open = false; PROJECTS._apply(); }
function newProjectForm() {
  PROJECTS.activeId = null;
  try { localStorage.removeItem(PROJECT_ACTIVE_KEY); } catch (_) {}
  ['project-name','project-number','project-owner','project-client'].forEach(id => { const el=$(id); if(el) el.value=''; });
  updateProjectActiveLabel();
  renderProjectList();
}

function _fillProjectForm(project) {
  if (!project) return;
  const set = (id, v) => { const el=$(id); if (el) el.value = v || ''; };
  set('project-name', project.name);
  set('project-number', project.number);
  set('project-owner', project.owner);
  set('project-client', project.client);
}

function _projectFormMeta() {
  return {
    name: $('project-name')?.value.trim() || 'Unbenanntes Projekt',
    number: $('project-number')?.value.trim() || '',
    owner: $('project-owner')?.value.trim() || '',
    client: $('project-client')?.value.trim() || '',
  };
}

function captureProjectSnapshot() {
  const fields = {};
  document.querySelectorAll('#app-shell input[id], #app-shell select[id], #app-shell textarea[id]').forEach(el => {
    fields[el.id] = {
      value: el.value,
      checked: !!el.checked,
      type: el.type || el.tagName.toLowerCase(),
    };
  });

  const snapshot = {
    version: 1,
    activeTab: NAV.activeTab,
    fields,
    navFavorites: NAV_FAVORITES.slice(),
    theme: localStorage.getItem('tcp_theme') || 'dark',
    modules: {},
  };

  if (window.TW_STATE) {
    try { snapshot.modules.trinkwasser = JSON.parse(JSON.stringify(window.TW_STATE)); } catch (_) {}
  }
  if (window._hxState) {
    try { snapshot.modules.hx = JSON.parse(JSON.stringify(window._hxState)); } catch (_) {}
  }
  if (window.MAG_STATE) {
    try { snapshot.modules.mag = JSON.parse(JSON.stringify(window.MAG_STATE)); } catch (_) {}
  }
  if (window.EW_STATE) {
    try { snapshot.modules.entwaesserung = JSON.parse(JSON.stringify(window.EW_STATE)); } catch (_) {}
  }
  return snapshot;
}

function applyProjectSnapshot(snapshot) {
  if (!snapshot) return;

  if (snapshot.navFavorites) setNavFavorites(snapshot.navFavorites);
  if (snapshot.theme && ['dark','light','system'].includes(snapshot.theme)) {
    localStorage.setItem('tcp_theme', snapshot.theme);
    document.querySelector(`[data-theme="${snapshot.theme}"]`)?.click();
  }

  if (snapshot.modules?.trinkwasser && window.TW_STATE) {
    window.TW_STATE.nes = Array.isArray(snapshot.modules.trinkwasser.nes)
      ? JSON.parse(JSON.stringify(snapshot.modules.trinkwasser.nes))
      : [];
    if (typeof renderNeList === 'function') renderNeList();
  }

  const fields = snapshot.fields || {};
  Object.entries(fields).forEach(([id, data]) => {
    const el = $(id);
    if (!el) return;
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!data.checked;
    else el.value = data.value ?? '';
    el.dispatchEvent(new Event('input', { bubbles:true }));
    el.dispatchEvent(new Event('change', { bubbles:true }));
  });

  if (snapshot.modules?.hx) {
    window._hxState = snapshot.modules.hx;
    if (typeof drawHxChart === 'function') setTimeout(() => drawHxChart(window._hxState), 120);
  }
  if (snapshot.modules?.mag && window.MAG_STATE) {
    Object.assign(window.MAG_STATE, JSON.parse(JSON.stringify(snapshot.modules.mag)));
  }

  setTimeout(() => {
    if (typeof calcAll === 'function') calcAll();
    if (typeof luftCalc === 'function') luftCalc();
    if (typeof calcTrinkwasser === 'function') calcTrinkwasser();
    if (typeof calcMAG === 'function') calcMAG();
    if (typeof calcEntwaesserung === 'function') calcEntwaesserung();
    if (typeof unitCalc === 'function') unitCalc();
    if (snapshot.activeTab && TABS.includes(snapshot.activeTab)) switchTab(snapshot.activeTab);
    else NAV._apply();
  }, 80);
}

function saveCurrentProject() {
  const meta = _projectFormMeta();
  const list = getProjects();
  const now = _projectNow();
  let id = PROJECTS.activeId || localStorage.getItem(PROJECT_ACTIVE_KEY);
  let idx = list.findIndex(p => p.id === id);

  const project = {
    id: idx >= 0 ? list[idx].id : _projectId(),
    ...meta,
    updatedAt: now,
    createdAt: idx >= 0 ? list[idx].createdAt : now,
    snapshot: captureProjectSnapshot(),
  };

  if (idx >= 0) list[idx] = project;
  else list.unshift(project);

  saveProjects(list);
  PROJECTS.activeId = project.id;
  try { localStorage.setItem(PROJECT_ACTIVE_KEY, project.id); } catch (_) {}
  renderProjectList();
  updateProjectActiveLabel();
}

function loadProject(id) {
  const project = getProjects().find(p => p.id === id);
  if (!project) return;
  PROJECTS.activeId = project.id;
  try { localStorage.setItem(PROJECT_ACTIVE_KEY, project.id); } catch (_) {}
  _fillProjectForm(project);
  applyProjectSnapshot(project.snapshot);
  closeProjects();
}

function deleteProject(id) {
  const project = getProjects().find(p => p.id === id);
  if (!project) return;
  if (!confirm(`Projekt „${project.name || 'Unbenannt'}“ löschen?`)) return;
  const list = getProjects().filter(p => p.id !== id);
  saveProjects(list);
  if (PROJECTS.activeId === id || localStorage.getItem(PROJECT_ACTIVE_KEY) === id) newProjectForm();
  renderProjectList();
}

function duplicateProject(id) {
  const project = getProjects().find(p => p.id === id);
  if (!project) return;
  const list = getProjects();
  const copy = {
    ...project,
    id: _projectId(),
    name: (project.name || 'Projekt') + ' Kopie',
    createdAt: _projectNow(),
    updatedAt: _projectNow(),
  };
  list.unshift(copy);
  saveProjects(list);
  renderProjectList();
}

function updateProjectActiveLabel() {
  const el = $('project-active-label');
  const active = getActiveProject();
  if (el) el.textContent = active ? `${active.name || 'Unbenannt'}${active.number ? ' · ' + active.number : ''}` : 'Kein Projekt geladen';
}

function _projectDate(s) {
  if (!s) return '–';
  try { return new Date(s).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }); }
  catch (_) { return '–'; }
}

function renderProjectList() {
  const el = $('project-list');
  if (!el) return;
  const list = getProjects().sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  if (!list.length) {
    el.innerHTML = '<div class="project-empty">Noch keine Projekte gespeichert.</div>';
    return;
  }
  const activeId = PROJECTS.activeId || localStorage.getItem(PROJECT_ACTIVE_KEY);
  el.innerHTML = list.map(p => `
    <div class="project-card ${p.id === activeId ? 'active' : ''}" data-project-id="${p.id}">
      <div>
        <h4>${_escProject(p.name || 'Unbenanntes Projekt')}</h4>
        <p>${_escProject(p.number || 'ohne Nummer')} · ${_escProject(p.client || 'kein Objekt')}<br>Aktualisiert: ${_projectDate(p.updatedAt)}</p>
      </div>
      <div class="project-card-actions">
        <button type="button" class="project-mini-btn load" data-project-load="${p.id}">Laden</button>
        <button type="button" class="project-mini-btn" data-project-copy="${p.id}">Kopie</button>
        <button type="button" class="project-mini-btn delete" data-project-delete="${p.id}">Löschen</button>
      </div>
    </div>
  `).join('');
  el.querySelectorAll('[data-project-load]').forEach(btn => btn.addEventListener('click', () => loadProject(btn.dataset.projectLoad)));
  el.querySelectorAll('[data-project-copy]').forEach(btn => btn.addEventListener('click', () => duplicateProject(btn.dataset.projectCopy)));
  el.querySelectorAll('[data-project-delete]').forEach(btn => btn.addEventListener('click', () => deleteProject(btn.dataset.projectDelete)));
}

function _escProject(s) {
  return String(s || '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

function setupProjects() {
  PROJECTS.activeId = localStorage.getItem(PROJECT_ACTIVE_KEY);
  $('project-close')?.addEventListener('click', closeProjects);
  $('project-overlay')?.addEventListener('click', closeProjects);
  $('project-new')?.addEventListener('click', newProjectForm);
  $('project-save')?.addEventListener('click', saveCurrentProject);
  const active = getActiveProject();
  if (active) _fillProjectForm(active);
  updateProjectActiveLabel();
}

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
    openNavConfig();
    return;
  }
  if (action === 'favorites') {
    _setMenuMessage('Favoriten', 'Favoriten werden in einer späteren Ausbaustufe aktiviert.');
    return;
  }
  if (action === 'projects') {
    openProjects();
    return;
  }
  if (action === 'units') {
    _setMenuMessage('Standardeinheiten', 'Standardeinheiten werden später zentral für Druck, Leistung, Volumenstrom und Rohrnormen vorbereitet.');
    return;
  }
  if (action === 'pdf-settings') {
    _setMenuMessage('PDF-Vorlagen', 'PDF-Vorlagen, Firmenlogo und Report-Layout werden in einer späteren Ausbaustufe aktiviert.');
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
  const root = document.documentElement;
  const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

  function effectiveTheme(mode) {
    if (mode === "system") return mq?.matches ? "light" : "dark";
    return mode === "light" ? "light" : "dark";
  }

  function applyTheme(mode) {
    const safeMode = ["dark", "light", "system"].includes(mode) ? mode : "dark";
    const effective = effectiveTheme(safeMode);
    root.dataset.theme = safeMode;
    root.dataset.themeEffective = effective;

    const meta = document.querySelector("meta[name=\"theme-color\"]");
    if (meta) meta.setAttribute("content", effective === "light" ? "#f3f6fb" : "#000000");

    document.querySelectorAll("[data-theme]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.theme === safeMode);
      btn.setAttribute("aria-pressed", String(btn.dataset.theme === safeMode));
    });
  }

  const saved = localStorage.getItem("tcp_theme") || "dark";
  applyTheme(saved);

  document.querySelectorAll("[data-theme]").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.theme || "dark";
      localStorage.setItem("tcp_theme", mode);
      applyTheme(mode);
    });
  });

  mq?.addEventListener?.("change", () => {
    if ((localStorage.getItem("tcp_theme") || "dark") === "system") applyTheme("system");
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
  closeProjects();
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

function _normalizeUiPrimitives() {
  document.body.classList.add('tc-app');
  document.querySelectorAll('.gc,.out-card,.hx-card').forEach(el => el.classList.add('tcp-card'));
  document.querySelectorAll('.igrp').forEach(el => el.classList.add('tcp-input-group'));
  document.querySelectorAll('.ob,.out-row').forEach(el => el.classList.add('tcp-result-row'));
}

document.addEventListener('DOMContentLoaded', () => {
  _normalizeUiPrimitives();
  // Header Menü
  $('hdr-menu-btn')?.addEventListener('click', toggleAppMenu);
  $('app-menu-close')?.addEventListener('click', closeAppMenu);
  $('app-menu-overlay')?.addEventListener('click', closeAppMenu);
  $('nav-config-close')?.addEventListener('click', closeNavConfig);
  $('nav-config-overlay')?.addEventListener('click', closeNavConfig);
  $('nav-config-save')?.addEventListener('click', saveNavConfig);
  $('nav-config-reset')?.addEventListener('click', resetNavConfig);
  setupProjects();
  document.querySelectorAll('[data-menu-action]').forEach(btn => {
    btn.addEventListener('click', () => _handleMenuAction(btn.dataset.menuAction));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAppMenu(); closeNavConfig(); closeProjects(); } });
  _setupThemeMenu();
  _setBuildLabel();

  // Desktop Tab-Bar
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });

  // Mobile Bottom Navigation dynamisch rendern
  renderBottomNav();

  // Plus Overlay schließt Sheet
  $('plus-overlay')?.addEventListener('click', closePlusSheet);

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
  window.addEventListener('resize', () => { _updatePillVisibility(); NAV._apply(); });
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
