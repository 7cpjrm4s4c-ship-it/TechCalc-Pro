import config from './config.js';
import { modules } from '../../core/registry.js';
import { navigate } from '../../core/router.js';
import { esc } from '../../core/renderer.js';

const moduleIconMap = {
  'heating-cooling': 'thermometer',
  ventilation: 'waves',
  'pipe-sizing': 'pipe',
  'unit-converter': 'cube',
  'heat-recovery': 'arrow-clockwise',
  'hx-diagram': 'chart',
  'drinking-water': 'drop',
  'pressure-holding': 'gauge',
  'buffer-storage': 'cylinder',
  wastewater: 'waves',
  rainwater: 'snowflake'
};

const accentMap = {
  'drinking-water': 'blue',
  'heating-cooling': 'red',
  rainwater: 'blue',
  ventilation: 'green',
  'pipe-sizing': 'slate',
  'pressure-holding': 'blue',
  'hx-diagram': 'slate',
  'unit-converter': 'slate'
};

function moduleIcon(id) {
  return moduleIconMap[id] || 'grid';
}

function selectableModules() {
  return modules.all().filter(module => module.id !== config.id);
}

function moduleTitle(module) {
  if (!module) return '';
  if (module.id === 'heating-cooling') return 'Heizlast';
  if (module.id === 'drinking-water') return 'Hydraulik';
  if (module.id === 'pipe-sizing') return 'Rohrnetz';
  if (module.id === 'rainwater') return 'Kühllast';
  return module.shortTitle || module.title;
}

function moduleSubtitle(module) {
  const subtitle = {
    'drinking-water': 'Rohrnetz & Druck',
    'heating-cooling': 'DIN EN 12831',
    rainwater: 'VDI 2078 / 6007',
    ventilation: 'DIN EN 16798',
    'pipe-sizing': 'Dimensionierung',
    'pressure-holding': 'Auslegung',
    'hx-diagram': 'Diagramme',
    'unit-converter': 'Einheiten'
  };
  return subtitle[module?.id] || module?.group || '';
}

function firstModuleId() {
  return selectableModules()[0]?.id || 'heating-cooling';
}

function homeModules() {
  const preferred = ['drinking-water', 'heating-cooling', 'rainwater', 'ventilation', 'pipe-sizing', 'pressure-holding', 'hx-diagram', 'unit-converter'];
  const byId = new Map(selectableModules().map(module => [module.id, module]));
  const ordered = preferred.map(id => byId.get(id)).filter(Boolean);
  const rest = selectableModules().filter(module => !preferred.includes(module.id));
  return [...ordered, ...rest];
}

function renderModuleTile(module, { favorite = false } = {}) {
  const accent = accentMap[module.id] || 'blue';
  return `
    <button class="home-module-tile" type="button" data-dashboard-module="${esc(module.id)}" data-accent="${esc(accent)}">
      ${favorite ? '<span class="home-favorite-star tss-icon tss-icon--star" aria-hidden="true"></span>' : ''}
      <span class="home-module-icon tss-icon tss-icon--${moduleIcon(module.id)}" aria-hidden="true"></span>
      <strong>${esc(moduleTitle(module))}</strong>
      <small>${esc(moduleSubtitle(module))}</small>
    </button>
  `;
}

function renderFavorites() {
  return homeModules().slice(0, 4).map(module => renderModuleTile(module, { favorite: true })).join('');
}

function renderAllModules() {
  return homeModules().slice(0, 8).map(module => renderModuleTile(module)).join('');
}

function renderRecent() {
  const rows = [
    ['drinking-water', 'Wohnanlage Musterstraße', 'Hydraulik · Version 3', 'Heute, 14:32'],
    ['heating-cooling', 'Bürogebäude Nord', 'Heizlast · Version 5', 'Heute, 11:18'],
    ['rainwater', 'Einkaufszentrum West', 'Kühllast · Version 2', 'Gestern, 16:45'],
    ['ventilation', 'Produktionshalle Süd', 'Lüftung · Version 4', 'Gestern, 09:27'],
    ['pipe-sizing', 'Schulzentrum Mitte', 'Rohrnetz · Version 3', '09.05.2025, 15:12']
  ];
  return rows.map(([id, title, meta, time]) => `
    <button class="home-recent-row" type="button" data-dashboard-module="${esc(id)}">
      <span class="home-recent-icon tss-icon tss-icon--${moduleIcon(id)}" aria-hidden="true"></span>
      <span class="home-recent-main"><strong>${esc(title)}</strong><small>${esc(meta)}</small></span>
      <time>${esc(time)}</time>
      <span class="tss-icon tss-icon--chevron-right" aria-hidden="true"></span>
    </button>
  `).join('');
}

function renderBottomNav() {
  const items = [
    ['dashboard', 'Start', 'grid'],
    ['projects', 'Projekte', 'folder'],
    ['unit-converter', 'Berechnungen', 'calculator'],
    ['settings', 'Einstellungen', 'gear']
  ];
  return items.map(([id, label, icon]) => `
    <button class="home-bottom-item ${id === 'dashboard' ? 'is-active' : ''}" type="button" data-home-action="${esc(id)}">
      <span class="tss-icon tss-icon--${esc(icon)}" aria-hidden="true"></span>
      <span>${esc(label)}</span>
    </button>
  `).join('');
}

function renderDashboard() {
  return `
    <section class="home-shell span-12" aria-labelledby="homeTitle">
      <div class="home-topbar">
        <div>
          <h1 id="homeTitle">Start</h1>
          <p>Übersicht & Schnellzugriff</p>
        </div>
        <div class="home-top-actions">
          <button class="home-circle-button" type="button" aria-label="Suchen"><span class="tss-icon tss-icon--magnifyingglass" aria-hidden="true"></span></button>
          <button class="home-circle-button" type="button" aria-label="Weitere Optionen"><span class="tss-icon tss-icon--ellipsis" aria-hidden="true"></span></button>
        </div>
      </div>

      <div class="home-search" role="search">
        <span class="tss-icon tss-icon--magnifyingglass" aria-hidden="true"></span>
        <input type="search" placeholder="Suche…" aria-label="Startseite durchsuchen">
      </div>

      <section class="home-section home-section--favorites" aria-labelledby="homeFavoritesTitle">
        <header class="home-section-head"><h2 id="homeFavoritesTitle">Favoriten</h2><button type="button">Bearbeiten</button></header>
        <div class="home-favorites-strip">${renderFavorites()}</div>
      </section>

      <section class="home-section" aria-labelledby="homeRecentTitle">
        <header class="home-section-head"><h2 id="homeRecentTitle">Zuletzt verwendet</h2><button type="button">Alle anzeigen</button></header>
        <div class="home-recent-list">${renderRecent()}</div>
      </section>

      <section class="home-section" aria-labelledby="homeModulesTitle">
        <header class="home-section-head"><h2 id="homeModulesTitle">Alle Module</h2><button type="button">Alle anzeigen</button></header>
        <div class="home-module-grid">${renderAllModules()}</div>
      </section>

      <div class="home-new-project-wrap">
        <button class="home-new-project" type="button" data-dashboard-module="${esc(firstModuleId())}"><span class="tss-icon tss-icon--plus" aria-hidden="true"></span> Neues Projekt</button>
      </div>

      <nav class="home-bottom-nav" aria-label="Startseiten-Navigation">${renderBottomNav()}</nav>
    </section>
  `;
}

function bind(root) {
  root.querySelectorAll('[data-dashboard-module]').forEach(button => {
    button.addEventListener('click', () => navigate(button.dataset.dashboardModule));
  });
  root.querySelectorAll('[data-home-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.homeAction;
      if (action === 'dashboard') return;
      if (action === 'settings') {
        document.getElementById('settingsButton')?.click();
        return;
      }
      if (action === 'projects') {
        document.getElementById('openProjectButton')?.click();
        return;
      }
      navigate(action);
    });
  });
}

export default {
  config,
  mount(root) {
    root.innerHTML = renderDashboard();
    root.dataset.activeModuleId = config.id;
    document.body.dataset.route = config.id;
    bind(root);
    return () => {
      if (document.body.dataset.route === config.id) delete document.body.dataset.route;
    };
  }
};
