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

function moduleIcon(id) {
  return moduleIconMap[id] || 'grid';
}

function selectableModules() {
  return modules.all().filter(module => module.id !== config.id);
}

function renderQuickStart() {
  return selectableModules().slice(0, 6).map(module => `
    <button class="dashboard-module-card" type="button" data-dashboard-module="${esc(module.id)}" data-module-id="${esc(module.id)}" data-accent="${esc(module.accent)}">
      <span class="tss-icon tss-icon--${moduleIcon(module.id)}" aria-hidden="true"></span>
      <strong>${esc(module.shortTitle)}</strong>
    </button>
  `).join('');
}

function renderRecent() {
  const rows = [
    ['drinking-water', 'Wohnanlage Musterstraße', 'Trinkwasser · Version 3', '12.05.2025', '14:32'],
    ['heating-cooling', 'Bürogebäude Nord', 'Heizlast · Version 5', '12.05.2025', '11:18'],
    ['rainwater', 'Einkaufszentrum West', 'Regenwasser · Version 2', '11.05.2025', '16:45'],
    ['ventilation', 'Produktionshalle Süd', 'Lüftung · Version 4', '10.05.2025', '09:27'],
    ['pipe-sizing', 'Schulzentrum Mitte', 'Rohrnetz · Version 3', '09.05.2025', '15:12']
  ];
  return rows.map(([id, title, meta, date, time]) => `
    <button class="dashboard-list-row" type="button" data-dashboard-module="${esc(id)}" data-module-id="${esc(id)}">
      <span class="tss-icon tss-icon--${moduleIcon(id)}" aria-hidden="true"></span>
      <span><strong>${esc(title)}</strong><small>${esc(meta)}</small></span>
      <time>${esc(date)}<br>${esc(time)}</time>
      <span class="tss-icon tss-icon--ellipsis" aria-hidden="true"></span>
    </button>
  `).join('');
}

function renderStatsLegend() {
  const rows = [
    ['Hydraulik', '32 (25%)'], ['Heizlast', '28 (22%)'], ['Kühllast', '24 (19%)'],
    ['Lüftung', '22 (17%)'], ['Rohrnetz', '14 (11%)'], ['Pumpen', '8 (6%)']
  ];
  return rows.map(([label, value]) => `<li><span></span>${esc(label)}<strong>${esc(value)}</strong></li>`).join('');
}

function renderDashboard() {
  return `
    <section class="dashboard-shell span-12" aria-labelledby="dashboardTitle">
      <div class="dashboard-head">
        <div>
          <h1 id="dashboardTitle">Dashboard</h1>
          <p>Übersicht & Schnellzugriff</p>
        </div>
        <div class="dashboard-search" role="search">
          <input type="search" placeholder="Suche…" aria-label="Dashboard durchsuchen">
          <span class="tss-icon tss-icon--magnifyingglass" aria-hidden="true"></span>
        </div>
      </div>

      <div class="dashboard-actions" aria-label="Schnellaktionen">
        <button class="dashboard-action-card dashboard-action-card--primary" type="button" data-dashboard-module="heating-cooling"><span class="tss-icon tss-icon--plus" aria-hidden="true"></span><strong>Neues Projekt</strong></button>
        <button class="dashboard-action-card" type="button"><span class="tss-icon tss-icon--folder" aria-hidden="true"></span><strong>Projekt öffnen</strong></button>
        <button class="dashboard-action-card" type="button" data-dashboard-module="unit-converter"><span class="tss-icon tss-icon--calculator" aria-hidden="true"></span><strong>Berechnung</strong></button>
        <button class="dashboard-action-card" type="button" data-dashboard-module="hx-diagram"><span class="tss-icon tss-icon--chart" aria-hidden="true"></span><strong>Diagramme</strong></button>
        <button class="dashboard-action-card" type="button"><span class="tss-icon tss-icon--doc" aria-hidden="true"></span><strong>Vorlagen</strong></button>
      </div>

      <div class="dashboard-grid">
        <article class="dashboard-panel dashboard-panel--recent">
          <header><span class="tss-icon tss-icon--clock" aria-hidden="true"></span><h2>Zuletzt verwendet</h2></header>
          <div class="dashboard-list">${renderRecent()}</div>
          <button class="dashboard-link" type="button">Alle Projekte anzeigen <span class="tss-icon tss-icon--chevron-right" aria-hidden="true"></span></button>
        </article>

        <article class="dashboard-panel dashboard-panel--quick">
          <header><span class="tss-icon tss-icon--bolt" aria-hidden="true"></span><h2>Schnellstart</h2></header>
          <div class="dashboard-module-grid">${renderQuickStart()}</div>
          <button class="dashboard-link" type="button">Alle Module <span class="tss-icon tss-icon--chevron-right" aria-hidden="true"></span></button>
        </article>

        <article class="dashboard-panel dashboard-panel--stats">
          <header><span class="tss-icon tss-icon--chart" aria-hidden="true"></span><h2>Berechnungsstatistik</h2><button class="tss-select-pill" type="button">Diese Woche <span class="tss-icon tss-icon--chevron-down" aria-hidden="true"></span></button></header>
          <div class="dashboard-donut" aria-label="128 Berechnungen"><strong>128</strong><span>Berechnungen</span></div>
          <ul class="dashboard-legend">${renderStatsLegend()}</ul>
          <button class="dashboard-link" type="button">Statistik öffnen <span class="tss-icon tss-icon--chevron-right" aria-hidden="true"></span></button>
        </article>

        <article class="dashboard-panel dashboard-panel--status">
          <header><span class="tss-icon tss-icon--checkmark-circle" aria-hidden="true"></span><h2>Systemstatus</h2></header>
          <p>Alle Systeme funktionieren einwandfrei.</p>
          <dl class="dashboard-status-list"><div><dt>Berechnungsengine</dt><dd>Online</dd></div><div><dt>Datenbank</dt><dd>Online</dd></div><div><dt>Lizenzstatus</dt><dd>Aktiv</dd></div><div><dt>Updates</dt><dd>Aktuell</dd></div></dl>
        </article>

        <article class="dashboard-panel dashboard-panel--tasks">
          <header><span class="tss-icon tss-icon--bell" aria-hidden="true"></span><h2>Hinweise & Aufgaben</h2></header>
          <div class="dashboard-task"><span class="tss-icon tss-icon--warning" aria-hidden="true"></span><strong>Wartung empfohlen</strong><small>Datenbankwartung in 7 Tagen fällig.</small><span class="tss-icon tss-icon--chevron-right"></span></div>
          <div class="dashboard-task"><span class="tss-icon tss-icon--info" aria-hidden="true"></span><strong>Update verfügbar</strong><small>Version 1.3.1 Beta 2 ist verfügbar.</small><span class="tss-icon tss-icon--chevron-right"></span></div>
          <div class="dashboard-task"><span class="tss-icon tss-icon--checkmark-circle" aria-hidden="true"></span><strong>Backup erfolgreich</strong><small>Letztes Backup: Heute, 02:15 Uhr</small><span class="tss-icon tss-icon--chevron-right"></span></div>
        </article>

        <article class="dashboard-panel dashboard-panel--favorites">
          <header><span class="tss-icon tss-icon--star" aria-hidden="true"></span><h2>Favoriten</h2></header>
          <div class="dashboard-list dashboard-list--compact">${renderRecent().replaceAll('Wohnanlage Musterstraße','Hydraulik Standard').replaceAll('Bürogebäude Nord','Heizlast DIN EN 12831').replaceAll('Einkaufszentrum West','Kühllast VDI 2078').replaceAll('Produktionshalle Süd','Rohrnetz Trinkwasser').split('</button>').slice(0,4).join('</button>')}</button></div>
        </article>
      </div>
    </section>
  `;
}

function bind(root) {
  root.querySelectorAll('[data-dashboard-module]').forEach(button => {
    button.addEventListener('click', () => navigate(button.dataset.dashboardModule));
  });
}

export default {
  config,
  mount(root) {
    root.innerHTML = renderDashboard();
    root.dataset.activeModuleId = config.id;
    bind(root);
    return () => {};
  }
};
