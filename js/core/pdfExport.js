import { currentRoute } from './router.js';

const LEGACY_STORAGE_KEY = 'techcalc-pdf-project-v1';
const PROJECTS_STORAGE_KEY = 'techcalc-projects-v1';
const ACTIVE_PROJECT_KEY = 'techcalc-active-project-id';

const DEFAULT_PROJECT = {
  id: '',
  client: '',
  project: '',
  projectNo: '',
  engineer: '',
  logoDataUrl: ''
};

function createProject(seed = {}) {
  return {
    ...DEFAULT_PROJECT,
    ...seed,
    id: seed.id || `project-${Date.now()}-${Math.random().toString(16).slice(2)}`
  };
}

function readProjects() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY));
    if (Array.isArray(stored) && stored.length) return stored.map(item => createProject(item));
  } catch {}

  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacy && Object.keys(legacy).length) {
      const migrated = createProject(legacy);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([migrated]));
      localStorage.setItem(ACTIVE_PROJECT_KEY, migrated.id);
      return [migrated];
    }
  } catch {}

  const first = createProject({ project: 'Projekt 1' });
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([first]));
  localStorage.setItem(ACTIVE_PROJECT_KEY, first.id);
  return [first];
}

function writeProjects(projects) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function readActiveProjectId(projects = readProjects()) {
  const stored = localStorage.getItem(ACTIVE_PROJECT_KEY);
  return projects.some(project => project.id === stored) ? stored : projects[0]?.id;
}

function readProject() {
  const projects = readProjects();
  const activeId = readActiveProjectId(projects);
  const active = projects.find(project => project.id === activeId) || projects[0];
  return createProject(active || {});
}

function saveProject(next) {
  const projects = readProjects();
  const activeId = readActiveProjectId(projects);
  const index = Math.max(0, projects.findIndex(project => project.id === activeId));
  projects[index] = createProject({ ...projects[index], ...next, id: projects[index]?.id || activeId });
  writeProjects(projects);
  localStorage.setItem(ACTIVE_PROJECT_KEY, projects[index].id);
  renderProjectSelect(projects[index].id);
}

function projectLabel(project) {
  return project.project || project.client || project.projectNo || 'Unbenanntes Projekt';
}

function renderProjectSelect(activeId = readActiveProjectId()) {
  const select = document.getElementById('projectSelect');
  if (!select) return;
  const projects = readProjects();
  select.innerHTML = projects.map(project => `<option value="${esc(project.id)}">${esc(projectLabel(project))}</option>`).join('');
  select.value = activeId;
}
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

function bindProjectInput(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => saveProject({ [key]: el.value }));
  el.addEventListener('change', () => saveProject({ [key]: el.value }));
}

function updateLogoPreview() {
  const preview = document.getElementById('pdfLogoPreview');
  if (!preview) return;
  const { logoDataUrl } = readProject();
  preview.innerHTML = logoDataUrl
    ? `<img src="${esc(logoDataUrl)}" alt="Gespeichertes Firmenlogo">`
    : '<span>Kein Logo gespeichert</span>';
}

function initProjectSettings() {
  renderProjectSelect();
  hydrateProjectForm(readProject());

  document.getElementById('projectSelect')?.addEventListener('change', event => {
    localStorage.setItem(ACTIVE_PROJECT_KEY, event.target.value);
    hydrateProjectForm(readProject());
  });

  document.getElementById('newProjectButton')?.addEventListener('click', () => {
    const projects = readProjects();
    const next = createProject({ project: `Projekt ${projects.length + 1}` });
    projects.push(next);
    writeProjects(projects);
    localStorage.setItem(ACTIVE_PROJECT_KEY, next.id);
    renderProjectSelect(next.id);
    hydrateProjectForm(next);
  });

  document.getElementById('deleteProjectButton')?.addEventListener('click', () => {
    let projects = readProjects();
    if (projects.length <= 1) {
      projects = [createProject({ project: 'Projekt 1' })];
    } else {
      const activeId = readActiveProjectId(projects);
      projects = projects.filter(project => project.id !== activeId);
    }
    writeProjects(projects);
    localStorage.setItem(ACTIVE_PROJECT_KEY, projects[0].id);
    renderProjectSelect(projects[0].id);
    hydrateProjectForm(projects[0]);
  });

  bindProjectInput('pdfClient', 'client');
  bindProjectInput('pdfProject', 'project');
  bindProjectInput('pdfProjectNo', 'projectNo');
  bindProjectInput('pdfEngineer', 'engineer');

  document.getElementById('pdfLogo')?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      saveProject({ logoDataUrl: String(reader.result || '') });
      updateLogoPreview();
    });
    reader.readAsDataURL(file);
  });

  document.getElementById('clearPdfLogo')?.addEventListener('click', () => {
    saveProject({ logoDataUrl: '' });
    const file = document.getElementById('pdfLogo');
    if (file) file.value = '';
    updateLogoPreview();
  });

  updateLogoPreview();
}

function hydrateProjectForm(data) {
  setInputValue('pdfClient', data.client);
  setInputValue('pdfProject', data.project);
  setInputValue('pdfProjectNo', data.projectNo);
  setInputValue('pdfEngineer', data.engineer);
  const file = document.getElementById('pdfLogo');
  if (file) file.value = '';
  updateLogoPreview();
}

function textOf(node) {
  return sanitizeText(node?.textContent || '');
}

function valueOfField(field) {
  const control = field.querySelector('input, select, textarea');
  if (!control) return '';
  if (control.matches('select')) {
    return sanitizeText(control.selectedOptions?.[0]?.textContent || control.value);
  }
  return sanitizeText(control.value);
}

function unitOfField(field) {
  const unitSelect = field.querySelector('.unit-select');
  if (unitSelect) return sanitizeText(unitSelect.selectedOptions?.[0]?.textContent || unitSelect.value);
  const unit = field.querySelector('.unit:not(.unit-select)');
  return unit ? textOf(unit) : '';
}

function extractCardRows(card) {
  const rows = [];

  card.querySelectorAll(':scope .field').forEach(field => {
    const label = textOf(field.querySelector('label'));
    const value = valueOfField(field);
    const unit = unitOfField(field);
    if (label || value || unit) rows.push([label, value, unit, '']);
  });

  card.querySelectorAll(':scope .main-result').forEach(result => {
    const label = textOf(result.querySelector('span'));
    const strong = result.querySelector('strong');
    const small = strong?.querySelector('small');
    const raw = textOf(strong);
    const unit = small ? textOf(small) : '';
    const value = unit ? raw.replace(unit, '').trim() : raw;
    if (label || value) rows.push([label, value, unit, '']);
  });

  card.querySelectorAll(':scope .inline-stat').forEach(stat => {
    const label = textOf(stat.querySelector('span'));
    const strong = stat.querySelector('strong');
    const small = strong?.querySelector('small');
    const raw = textOf(strong);
    const unit = small ? textOf(small) : '';
    const value = unit ? raw.replace(unit, '').trim() : raw;
    if (label || value) rows.push([label, value, unit, '']);
  });

  card.querySelectorAll(':scope .result-row').forEach(row => {
    const label = textOf(row.querySelector('span'));
    const strong = row.querySelector('strong');
    const small = strong?.querySelector('small');
    const raw = textOf(strong);
    const unit = small ? textOf(small) : '';
    const value = unit ? raw.replace(unit, '').trim() : raw;
    if (label || value) rows.push([label, value, unit, '']);
  });

  card.querySelectorAll(':scope .hx-process-step').forEach((step, index) => {
    const label = textOf(step.querySelector('strong')) || String(index + 1);
    const values = [...step.querySelectorAll('span')].map(textOf).join(' | ');
    rows.push([String(index + 1), label, values, '']);
  });

  card.querySelectorAll(':scope .pipe-dimension-card').forEach((dim, index) => {
    const title = textOf(dim.querySelector('strong')) || `Dimension ${index + 1}`;
    const meta = textOf(dim.querySelector('.pipe-dimension-card__meta'));
    rows.push([title, meta, '', '']);
  });

  return rows;
}

function isChartCard(card) {
  return Boolean(card.querySelector('.hx-chart, svg')) && /diagramm/i.test(textOf(card.querySelector('.card__title')));
}

function collectCurrentModule(modulesRef, routeGetter) {
  const id = typeof routeGetter === 'function' ? routeGetter() : currentRoute();
  const module = modulesRef?.get?.(id);
  const app = document.getElementById('app');
  const cards = [...(app?.querySelectorAll('.card') || [])];
  const sections = [];
  let chartSvg = '';

  cards.forEach(card => {
    const title = textOf(card.querySelector(':scope > .card__title'));
    if (!title) return;
    if (isChartCard(card)) {
      const svg = card.querySelector('svg');
      chartSvg = svg ? svg.outerHTML : '';
      return;
    }
    const rows = extractCardRows(card);
    if (rows.length) sections.push({ title, rows });
  });

  return {
    id,
    title: module?.title || module?.config?.title || id || 'Modul',
    shortTitle: module?.shortTitle || module?.title || id || 'Modul',
    sections,
    chartSvg
  };
}

function sectionTitle(title) {
  const normalized = sanitizeText(title);
  if (/ergebnis\s*zusammenfassung/i.test(normalized)) return 'Zielzustand';
  return normalized;
}

function tableHtml(rows, mode = 'standard') {
  const header = mode === 'process'
    ? ['Nr.', 'Prozessschritt', 'Beschreibung', '']
    : ['Parameter', 'Wert', 'Einheit', 'Bemerkung'];

  const finalRows = rows.map(row => {
    const clone = [...row];
    while (clone.length < 4) clone.push('');
    return clone.slice(0, 4);
  });

  return `<table class="tcp-table"><thead><tr>${header.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${finalRows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function printableChart(svg) {
  if (!svg) return '';
  return `<section class="tcp-section tcp-diagram-section"><h2>h,x-Diagramm</h2><div class="tcp-rule"></div><div class="tcp-diagram">${svg}</div></section>`;
}

function buildPrintableHtml(project, moduleData) {
  const date = new Date().toLocaleDateString('de-DE');
  const firstLine = [project.client, project.project, project.projectNo]
    .map(value => sanitizeText(value))
    .filter(Boolean)
    .map(value => `<div>${esc(value)}</div>`)
    .join('');

  const logo = project.logoDataUrl
    ? `<img class="tcp-logo" src="${esc(project.logoDataUrl)}" alt="Firmenlogo">`
    : '';

  const sections = moduleData.sections.map(section => {
    const title = sectionTitle(section.title);
    const mode = /prozessablauf/i.test(title) ? 'process' : 'standard';
    const rows = section.rows.map(row => row.map(cell => sanitizeText(cell).replace(/^Sättigung$/i, 'Adiabate Befeuchtung')));
    return `<section class="tcp-section"><h2>${esc(title)}</h2><div class="tcp-rule"></div>${tableHtml(rows, mode)}</section>`;
  }).join('');

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>TechCalc Pro - ${esc(moduleData.shortTitle)}</title>${printStyle()}</head><body>
    <div class="tcp-toolbar">
      <button class="tcp-close" type="button" onclick="try{ if (window.opener) { window.opener.focus(); window.close(); return; } }catch(e){} window.location.href='./';">Zurück zur App</button>
      <button class="tcp-print" type="button" onclick="window.print()">PDF speichern / drucken</button>
    </div>
    <main class="tcp-page">
      <header class="tcp-header">
        <div class="tcp-project-lines">${firstLine || '<div></div>'}</div>
        <div class="tcp-logo-wrap">${logo}</div>
      </header>
      <div class="tcp-meta-row"><span>Sachbearbeiter: ${esc(sanitizeText(project.engineer) || '-')}</span><span>Datum: ${esc(date)}</span></div>
      <section class="tcp-title-block">
        <h1>TechCalc Pro - Berechnungsprotokoll</h1>
        <p>Modul: ${esc(sanitizeText(moduleData.title))}</p>
      </section>
      ${sections}
      ${printableChart(moduleData.chartSvg)}
    </main>
    <footer class="tcp-footer"><span>TechCalc Pro</span><span>HLSK Quick Tools</span><span>${esc(moduleData.shortTitle)}</span></footer>
  </body></html>`;
}

function printStyle() {
  return `<style>
    .tcp-toolbar, .tcp-close, .tcp-print { display: none; }
    @page { size: A4; margin: 16mm 18mm 16mm 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.35; }
    .tcp-page { width: 100%; }
    .tcp-header { display: grid; grid-template-columns: 1fr 42mm; gap: 12mm; align-items: start; min-height: 25mm; padding-bottom: 5mm; border-bottom: 1px solid #D1D5DB; }
    .tcp-project-lines { font-size: 10pt; color: #111827; line-height: 1.5; font-weight: 500; min-height: 18mm; }
    .tcp-logo-wrap { height: 22mm; display: flex; align-items: center; justify-content: flex-end; }
    .tcp-logo { max-width: 42mm; max-height: 22mm; object-fit: contain; }
    .tcp-meta-row { display: flex; justify-content: space-between; gap: 8mm; color: #4B5563; font-size: 9pt; margin-top: 5mm; }
    .tcp-title-block { margin: 9mm 0 7mm; }
    .tcp-title-block h1 { margin: 0; font-size: 20pt; line-height: 1.05; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
    .tcp-title-block p { margin: 2mm 0 0; color: #4B5563; font-size: 11pt; font-weight: 600; }
    .tcp-section { margin: 0 0 7mm; break-inside: avoid; }
    .tcp-section h2 { margin: 0 0 1.8mm; font-size: 11.5pt; line-height: 1.1; font-weight: 700; color: #007EA7; text-transform: uppercase; letter-spacing: .04em; }
    .tcp-rule { height: 1px; background: #D1D5DB; margin-bottom: 2.5mm; }
    .tcp-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9.5pt; }
    .tcp-table th, .tcp-table td { border: 0.5px solid #D1D5DB; padding: 5px 7px; vertical-align: top; }
    .tcp-table th { background: #F3F4F6; color: #111827; font-weight: 700; text-align: left; }
    .tcp-table td { color: #111827; }
    .tcp-table th:nth-child(1), .tcp-table td:nth-child(1) { width: 43%; }
    .tcp-table th:nth-child(2), .tcp-table td:nth-child(2) { width: 27%; }
    .tcp-table th:nth-child(3), .tcp-table td:nth-child(3) { width: 15%; }
    .tcp-table th:nth-child(4), .tcp-table td:nth-child(4) { width: 15%; }
    .tcp-table td:nth-child(2), .tcp-table td:nth-child(3) { text-align: right; }
    .tcp-diagram-section { break-inside: avoid; }
    .tcp-diagram { width: 100%; border: 0.5px solid #D1D5DB; padding: 4mm; background: #fff; overflow: hidden; }
    .tcp-diagram svg { width: 100%; height: auto; display: block; background: #fff; }
    .tcp-diagram .hx-chart-bg { fill: #fff !important; stroke: #D1D5DB !important; }
    .tcp-diagram .hx-grid-line { stroke: #E5E7EB !important; stroke-width: 1 !important; }
    .tcp-diagram .hx-axis-label, .tcp-diagram .hx-title, .tcp-diagram .hx-rh-label { fill: #111827 !important; font-family: Arial, Helvetica, sans-serif !important; }
    .tcp-diagram .hx-rh { fill: none !important; stroke: #94A3B8 !important; stroke-width: 1.1 !important; opacity: .9 !important; }
    .tcp-diagram .hx-rh-100 { stroke: #111827 !important; stroke-width: 2 !important; }
    .tcp-diagram .hx-state-path { fill: none !important; stroke: #F97316 !important; stroke-width: 3 !important; }
    .tcp-diagram .hx-point circle { fill: #fff !important; stroke: #F97316 !important; stroke-width: 2.5 !important; }
    .tcp-diagram .hx-point text { fill: #111827 !important; font-weight: 700 !important; font-family: Arial, Helvetica, sans-serif !important; }
    .tcp-footer { position: fixed; bottom: 7mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; border-top: 1px solid #D1D5DB; padding-top: 2mm; color: #6B7280; font-size: 8pt; }
    @media screen { body { background: #e5e7eb; padding: calc(66px + env(safe-area-inset-top)) 18px 18px; } .tcp-toolbar { position: fixed; z-index: 9999; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: calc(10px + env(safe-area-inset-top)) 14px 10px; background: rgba(255,255,255,.94); border-bottom: 1px solid #CBD5E1; box-shadow: 0 10px 34px rgba(15,23,42,.14); } .tcp-close, .tcp-print { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 0 14px; border: 1px solid #CBD5E1; border-radius: 999px; background: #fff; color: #111827; font: 700 14px Arial, Helvetica, sans-serif; } .tcp-print { background: #007EA7; border-color: #007EA7; color: #fff; } .tcp-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 18mm; box-shadow: 0 18px 70px rgba(0,0,0,.18); } .tcp-footer { display: none; } }
    @media print { .tcp-toolbar, .tcp-close, .tcp-print { display: none !important; } }
  </style>`;
}

function openPrintWindow(project, moduleData) {
  const html = buildPrintableHtml(project, moduleData);
  const win = window.open('about:blank', '_blank');

  if (!win) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    return;
  }

  try {
    win.document.open('text/html', 'replace');
    win.document.write(html);
    win.document.close();
    win.focus();
  } catch (error) {
    console.error('PDF-Export fehlgeschlagen.', error);
    try { win.close(); } catch {}
    alert('PDF-Export konnte nicht erstellt werden. Bitte Browser-Konsole prüfen.');
  }
}

export function initPdfExport({ modules, currentRoute: routeGetter } = {}) {
  initProjectSettings();
  document.getElementById('exportPdfButton')?.addEventListener('click', () => {
    const project = readProject();
    const moduleData = collectCurrentModule(modules, routeGetter);
    openPrintWindow(project, moduleData);
  });
}
