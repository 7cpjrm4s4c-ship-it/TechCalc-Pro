import { currentRoute } from './router.js';
import { esc } from './renderer.js';
import { getProjectMeta, setProjectMeta, downloadProjectFile, readProjectFile, applyProjectData, getOpenedFileName, saveSessionSnapshot } from './projectStorage.js';


function sanitizeText(value = '') {
  return String(value ?? '')
    .replace(/[‐-―]/g, '-')
    .replace(/[×·]/g, '-')
    .replace(/[ΘϑΦφρΔηṁṽ]/g, match => ({'Θ':'Theta','ϑ':'Theta','Φ':'Phi','φ':'phi','ρ':'rho','Δ':'Delta','η':'eta','ṁ':'m','ṽ':'V'}[match] || ''))
    .replace(/[°³²]/g, match => ({'°':'°','³':'3','²':'2'}[match] || ''))
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


const DEFAULT_PROJECT = {
  client: '',
  project: '',
  projectNo: '',
  engineer: '',
  date: '',
  logoDataUrl: ''
};

function readProject() {
  return { ...DEFAULT_PROJECT, ...getProjectMeta() };
}

function saveProject(next = {}) {
  const saved = setProjectMeta({ ...collectProjectFormValues(), ...next });
  hydrateProjectForm(saved);
  return saved;
}

function collectProjectFormValues() {
  return {
    client: document.getElementById('pdfClient')?.value || '',
    project: document.getElementById('pdfProject')?.value || '',
    projectNo: document.getElementById('pdfProjectNo')?.value || '',
    engineer: document.getElementById('pdfEngineer')?.value || '',
    date: document.getElementById('pdfDate')?.value || '',
    logoDataUrl: readProject().logoDataUrl || ''
  };
}

function flashProjectSaved(text = 'Projektdatei erstellt') {
  const button = document.getElementById('saveProjectButton');
  if (!button) return;
  const original = button.textContent;
  button.textContent = text;
  button.classList.add('is-saved');
  window.setTimeout(() => {
    button.textContent = original || 'Projekt speichern';
    button.classList.remove('is-saved');
  }, 1400);
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

function bindProjectInput(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => setProjectMeta({ [key]: el.value }));
  el.addEventListener('change', () => setProjectMeta({ [key]: el.value }));
}

function updateLogoPreview() {
  const preview = document.getElementById('pdfLogoPreview');
  if (!preview) return;
  const { logoDataUrl } = readProject();
  preview.innerHTML = logoDataUrl
    ? `<img src="${esc(logoDataUrl)}" alt="Firmenlogo für diese Sitzung">`
    : '<span>Kein Logo ausgewählt</span>';
}

function updateOpenedProjectLabel() {
  const label = document.getElementById('projectFileLabel');
  if (!label) return;
  const name = getOpenedFileName();
  label.textContent = name ? `Geöffnet: ${name}` : 'Kein externes Projekt geöffnet';
}

function initProjectSettings() {
  if (window.__techCalcProjectSettingsBound) { hydrateProjectForm(readProject()); updateOpenedProjectLabel(); return; }
  window.__techCalcProjectSettingsBound = true;
  hydrateProjectForm(readProject());

  bindProjectInput('pdfClient', 'client');
  bindProjectInput('pdfProject', 'project');
  bindProjectInput('pdfProjectNo', 'projectNo');
  bindProjectInput('pdfEngineer', 'engineer');
  bindProjectInput('pdfDate', 'date');

  document.getElementById('pdfLogo')?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setProjectMeta({ logoDataUrl: String(reader.result || '') });
      updateLogoPreview();
    });
    reader.readAsDataURL(file);
  });

  document.getElementById('clearPdfLogo')?.addEventListener('click', () => {
    setProjectMeta({ logoDataUrl: '' });
    const file = document.getElementById('pdfLogo');
    if (file) file.value = '';
    updateLogoPreview();
  });

  document.getElementById('saveProjectButton')?.addEventListener('click', event => {
    event.preventDefault();
    setProjectMeta(collectProjectFormValues());
    downloadProjectFile();
    flashProjectSaved();
  });

  document.getElementById('openProjectButton')?.addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('openProjectFile')?.click();
  });

  document.getElementById('openProjectFile')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = await readProjectFile(file);
      applyProjectData(data, { fileName: file.name });
      hydrateProjectForm(readProject());
      updateOpenedProjectLabel();
    } catch (error) {
      console.error('Projekt konnte nicht geöffnet werden.', error);
      alert(error.message || 'Projekt konnte nicht geöffnet werden.');
    } finally {
      event.target.value = '';
    }
  });

  document.addEventListener('techcalc-project-loaded', () => {
    hydrateProjectForm(readProject());
    updateOpenedProjectLabel();
  });

  updateLogoPreview();
  updateOpenedProjectLabel();
}

function hydrateProjectForm(data = {}) {
  setInputValue('pdfClient', data.client);
  setInputValue('pdfProject', data.project);
  setInputValue('pdfProjectNo', data.projectNo);
  setInputValue('pdfEngineer', data.engineer);
  setInputValue('pdfDate', data.date);
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

function firstColumnIsNumeric(rows) {
  const values = rows.map(row => sanitizeText(row?.[0] || '')).filter(Boolean);
  return values.length > 0 && values.every(value => /^\d+([.,]\d+)?$/.test(value));
}

function isNumericText(value) {
  const normalized = sanitizeText(value).replace(/\s+/g, '');
  return normalized !== '' && /^[-+]?\d+(?:[.,]\d+)?(?:%|°C|K|l\/s|m3\/h|kg\/h|kg\/m3|Pa\/m|m\/s|kW)?$/i.test(normalized);
}

function cellClass(value, columnIndex, isTextValue = false) {
  if (columnIndex === 0) return ' class="tcp-label-cell"';
  if (columnIndex === 1 && isTextValue) return ' class="tcp-value-cell tcp-value-text"';
  if (columnIndex === 1) return ' class="tcp-value-cell"';
  return ' class="tcp-unit-cell"';
}

function tableHtml(rows, mode = 'standard') {
  const finalRows = rows.map(row => {
    const clone = [...row].map(cell => sanitizeText(cell));
    while (clone.length < 3) clone.push('');
    return clone.slice(0, 3);
  });

  const isNumericFirstColumn = firstColumnIsNumeric(finalRows);
  const firstHeader = mode === 'process' ? 'Nummer' : isNumericFirstColumn ? 'Nummer' : 'Bezeichnung';
  const header = mode === 'process'
    ? [firstHeader, 'Prozessschritt', 'Beschreibung']
    : [firstHeader, 'Wert', 'Einheit'];
  const tableClass = `tcp-table ${mode === 'process' ? 'tcp-table--process' : isNumericFirstColumn ? 'tcp-table--numbered' : 'tcp-table--standard'}`;
  const colgroup = mode === 'process'
    ? '<colgroup><col class="tcp-col-num"><col class="tcp-col-process"><col class="tcp-col-description"></colgroup>'
    : isNumericFirstColumn
      ? '<colgroup><col class="tcp-col-num"><col class="tcp-col-value"><col class="tcp-col-unit"></colgroup>'
      : '<colgroup><col class="tcp-col-label"><col class="tcp-col-value"><col class="tcp-col-unit"></colgroup>';

  const head = `<thead><tr>${header.map((h, index) => `<th${cellClass(h, index, false)}>${esc(h)}</th>`).join('')}</tr></thead>`;
  const body = `<tbody>${finalRows.map(row => `<tr>${row.map((cell, index) => `<td${cellClass(cell, index, index === 1 && !isNumericText(cell))}>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<table class="${tableClass}">${colgroup}${head}${body}</table>`;
}

function printableChart(svg) {
  if (!svg) return '';
  return `<section class="tcp-section tcp-diagram-section"><h2>h,x-Diagramm</h2><div class="tcp-rule"></div><div class="tcp-diagram">${svg}</div></section>`;
}

function buildPrintableHtml(project, moduleData) {
  const printDate = new Date().toLocaleDateString('de-DE');
  const appIconUrl = new URL('./assets/icons/icon-192.png', window.location.href).href;
  const metaValue = value => esc(sanitizeText(value) || '-');

  const sections = moduleData.sections.map(section => {
    const title = sectionTitle(section.title).replace(/Parameter/g, 'Bezeichnung');
    const mode = /prozessablauf/i.test(title) ? 'process' : 'standard';
    const rows = section.rows.map(row => row.slice(0, 3).map(cell => sanitizeText(cell).replace(/^Sättigung$/i, 'Adiabate Befeuchtung').replace(/Parameter/g, 'Bezeichnung')));
    return `<section class="tcp-section"><h2>${esc(title)}</h2><div class="tcp-rule"></div>${tableHtml(rows, mode)}</section>`;
  }).join('');

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>TechCalc Pro - ${esc(moduleData.shortTitle)}</title>${PRINT_STYLE}</head><body>
    <div class="tcp-toolbar">
      <button class="tcp-close" type="button" onclick="try{ if (window.opener) { window.opener.focus(); window.close(); return; } }catch(e){} if (history.length > 1) { history.back(); } else { window.close(); }">Zurück zur App</button>
      <button class="tcp-print" type="button" onclick="window.print()">PDF speichern / drucken</button>
    </div>
    <main class="tcp-page">
      <header class="tcp-header">
        <div class="tcp-brand">
          <img class="tcp-brand-icon" src="${esc(appIconUrl)}" alt="">
          <div class="tcp-brand-text">
            <strong>TechCalc Pro</strong>
            <span>HLSK Quick Tools</span>
          </div>
        </div>
        <div class="tcp-module-name">${esc(sanitizeText(moduleData.title))}</div>
        <div class="tcp-print-date"><span>Druckdatum</span><strong>${esc(printDate)}</strong></div>
      </header>
      <section class="tcp-project-data">
        <div class="tcp-project-row"><span>Sachbearbeiter:</span><strong>${metaValue(project.engineer)}</strong><span>Auftraggeber:</span><strong>${metaValue(project.client)}</strong></div>
        <div class="tcp-project-row"><span>Projektbezeichnung:</span><strong>${metaValue(project.project)}</strong><span>Unsere Projektnummer:</span><strong>${metaValue(project.projectNo)}</strong></div>
      </section>
      <section class="tcp-title-block">
        <h1>Berechnungsprotokoll</h1>
        <p>Modul: ${esc(sanitizeText(moduleData.title))}</p>
      </section>
      ${sections}
      ${printableChart(moduleData.chartSvg)}
    </main>
    <footer class="tcp-footer"><span>TechCalc Pro</span><span>HLSK Quick Tools</span><span>${esc(moduleData.shortTitle)}</span></footer>
  </body></html>`;
}

const PRINT_STYLE = `<style>
    .tcp-toolbar, .tcp-close, .tcp-print { display: none; }
    @page { size: A4; margin: 12mm 12mm 13mm 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 8.3pt; line-height: 1.22; }
    .tcp-page { width: 100%; }
    .tcp-header { display: grid; grid-template-columns: minmax(45mm, 1fr) minmax(42mm, 1fr) minmax(28mm, 1fr); gap: 5mm; align-items: center; min-height: 16mm; padding-bottom: 3.5mm; border-bottom: 1px solid #D1D5DB; }
    .tcp-brand { display: inline-flex; align-items: center; gap: 3mm; min-width: 0; }
    .tcp-brand-icon { width: 10mm; height: 10mm; border-radius: 2.2mm; object-fit: contain; flex: 0 0 auto; }
    .tcp-brand-text { display: grid; gap: .5mm; min-width: 0; }
    .tcp-brand-text strong { color: #111827; font-size: 12.5pt; line-height: 1; font-weight: 800; letter-spacing: -0.02em; }
    .tcp-brand-text span { color: #4B5563; font-size: 7.5pt; line-height: 1; text-transform: uppercase; letter-spacing: .17em; font-weight: 600; }
    .tcp-module-name { color: #111827; font-size: 10.2pt; line-height: 1.12; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: .035em; }
    .tcp-print-date { display: grid; gap: .7mm; justify-items: end; color: #111827; text-align: right; }
    .tcp-print-date span { color: #6B7280; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .11em; font-weight: 700; }
    .tcp-print-date strong { font-size: 9.6pt; font-weight: 800; }
    .tcp-project-data { margin-top: 3.6mm; padding: 2.2mm 2.8mm; background: #F9FAFB; border: 0.5px solid #D1D5DB; color: #111827; font-size: 8.2pt; line-height: 1.32; }
    .tcp-project-row { display: grid; grid-template-columns: 27mm minmax(38mm, 1fr) 33mm minmax(38mm, 1fr); gap: 2mm 3mm; align-items: baseline; }
    .tcp-project-row + .tcp-project-row { margin-top: 1.25mm; }
    .tcp-project-data span { color: #4B5563; font-weight: 700; text-align: right; white-space: nowrap; }
    .tcp-project-data strong { color: #111827; font-weight: 600; min-width: 0; overflow-wrap: anywhere; }
    .tcp-title-block { margin: 4.5mm 0 4.2mm; }
    .tcp-title-block h1 { margin: 0; font-size: 15pt; line-height: 1.04; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
    .tcp-title-block p { margin: 1.3mm 0 0; color: #4B5563; font-size: 9pt; font-weight: 600; }
    .tcp-section { margin: 0 0 4.2mm; break-inside: avoid; }
    .tcp-section h2 { margin: 0 0 1.15mm; font-size: 9.6pt; line-height: 1.08; font-weight: 700; color: #007EA7; text-transform: uppercase; letter-spacing: .035em; }
    .tcp-rule { height: 1px; background: #D1D5DB; margin-bottom: 2.1mm; }
    .tcp-table { width: 100%; border-collapse: collapse; table-layout: auto; font-size: 7.9pt; }
    .tcp-table col.tcp-col-label { width: 1%; }
    .tcp-table col.tcp-col-num { width: 1%; }
    .tcp-table col.tcp-col-value { width: auto; }
    .tcp-table col.tcp-col-unit { width: 1%; }
    .tcp-table col.tcp-col-process { width: 25%; }
    .tcp-table col.tcp-col-description { width: auto; }
    .tcp-table th, .tcp-table td { border: 0.5px solid #D1D5DB; padding: 1.8px 3.4px; vertical-align: top; }
    .tcp-table th { background: #F3F4F6; color: #111827; font-weight: 700; }
    .tcp-table td { color: #111827; }
    .tcp-table .tcp-label-cell { text-align: left; white-space: nowrap; width: 1%; }
    .tcp-table .tcp-value-cell { text-align: right; width: auto; min-width: 70mm; overflow-wrap: anywhere; }
    .tcp-table .tcp-value-text { text-align: left; white-space: normal; }
    .tcp-table .tcp-unit-cell { text-align: right; white-space: nowrap; width: 1%; }
    .tcp-table th:nth-child(1), .tcp-table td:nth-child(1) { text-align: left; }
    .tcp-table th:nth-child(2), .tcp-table td:nth-child(2) { width: auto; min-width: 70mm; }
    .tcp-table th:nth-child(3), .tcp-table td:nth-child(3) { text-align: right; white-space: nowrap; width: 1%; }
    .tcp-table--numbered th:nth-child(1), .tcp-table--numbered td:nth-child(1), .tcp-table--process th:nth-child(1), .tcp-table--process td:nth-child(1) { text-align: right; white-space: nowrap; width: 1%; }
    .tcp-table--process th:nth-child(2), .tcp-table--process td:nth-child(2) { text-align: left; white-space: nowrap; min-width: 30mm; }
    .tcp-table--process th:nth-child(3), .tcp-table--process td:nth-child(3) { text-align: left; white-space: normal; min-width: 95mm; width: auto; }
    .tcp-diagram-section { break-inside: avoid; }
    .tcp-diagram { width: 100%; border: 0.5px solid #D1D5DB; padding: 3.5mm; background: #fff; overflow: hidden; }
    .tcp-diagram svg { width: 100%; height: auto; display: block; background: #fff; }
    .tcp-diagram .hx-chart-bg { fill: #fff !important; stroke: #D1D5DB !important; }
    .tcp-diagram .hx-grid-line { stroke: #E5E7EB !important; stroke-width: 1 !important; }
    .tcp-diagram .hx-axis-label, .tcp-diagram .hx-title, .tcp-diagram .hx-rh-label { fill: #111827 !important; font-family: Arial, Helvetica, sans-serif !important; }
    .tcp-diagram .hx-rh { fill: none !important; stroke: #94A3B8 !important; stroke-width: 1.1 !important; opacity: .9 !important; }
    .tcp-diagram .hx-rh-100 { stroke: #111827 !important; stroke-width: 2 !important; }
    .tcp-diagram .hx-state-path { fill: none !important; stroke: #F97316 !important; stroke-width: 3 !important; }
    .tcp-diagram .hx-point circle { fill: #fff !important; stroke: #F97316 !important; stroke-width: 2.5 !important; }
    .tcp-diagram .hx-point text { fill: #111827 !important; font-weight: 700 !important; font-family: Arial, Helvetica, sans-serif !important; }
    .tcp-footer { position: fixed; bottom: 5.5mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; border-top: 1px solid #D1D5DB; padding-top: 1.8mm; color: #6B7280; font-size: 7.6pt; }
    @media screen { body { background: #e5e7eb; padding: calc(66px + env(safe-area-inset-top)) 18px 18px; } .tcp-toolbar { position: fixed; z-index: 9999; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: calc(10px + env(safe-area-inset-top)) 14px 10px; background: rgba(255,255,255,.94); border-bottom: 1px solid #CBD5E1; box-shadow: 0 10px 34px rgba(15,23,42,.14); } .tcp-close, .tcp-print { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 0 14px; border: 1px solid #CBD5E1; border-radius: 999px; background: #fff; color: #111827; font: 700 14px Arial, Helvetica, sans-serif; } .tcp-print { background: #007EA7; border-color: #007EA7; color: #fff; } .tcp-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 12mm; box-shadow: 0 18px 70px rgba(0,0,0,.18); } .tcp-footer { display: none; } }
    @media print { .tcp-toolbar, .tcp-close, .tcp-print { display: none !important; } }
  </style>`;

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
  const exportButton = document.getElementById('exportPdfButton');
  if (!exportButton || exportButton.dataset.bound === 'true') return;
  exportButton.dataset.bound = 'true';
  exportButton.addEventListener('click', event => {
    event.preventDefault();
    try {
      const project = saveProject(collectProjectFormValues());
      saveSessionSnapshot();
      const moduleData = collectCurrentModule(modules, routeGetter);
      openPrintWindow(project, moduleData);
    } catch (error) {
      console.error('PDF-Export fehlgeschlagen.', error);
      alert('PDF-Export konnte nicht erstellt werden. Bitte Browser-Konsole prüfen.');
    }
  });
}
