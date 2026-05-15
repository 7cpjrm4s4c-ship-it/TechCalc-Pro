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
  const date = sanitizeText(project.date) || new Date().toLocaleDateString('de-DE');
  const printDate = new Date().toLocaleDateString('de-DE');
  const appIconUrl = new URL('./assets/icons/icon-192.png', window.location.href).href;
  const projectLines = [
    ['Auftraggeber', project.client],
    ['Projektbezeichnung', project.project],
    ['Projektnummer', project.projectNo]
  ]
    .map(([label, value]) => [label, sanitizeText(value)])
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `<div><span>${esc(label)}:</span> ${esc(value)}</div>`)
    .join('');

  const sections = moduleData.sections.map(section => {
    const title = sectionTitle(section.title);
    const mode = /prozessablauf/i.test(title) ? 'process' : 'standard';
    const rows = section.rows.map(row => row.map(cell => sanitizeText(cell).replace(/^Sättigung$/i, 'Adiabate Befeuchtung')));
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
      <div class="tcp-meta-row"><span>Sachbearbeiter: ${esc(sanitizeText(project.engineer) || '-')}</span><span>Datum: ${esc(date)}</span></div>
      ${projectLines ? `<section class="tcp-project-data">${projectLines}</section>` : ''}
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
    @page { size: A4; margin: 16mm 18mm 16mm 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.35; }
    .tcp-page { width: 100%; }
    .tcp-header { display: grid; grid-template-columns: minmax(48mm, 1fr) minmax(42mm, 1fr) minmax(34mm, 1fr); gap: 8mm; align-items: center; min-height: 22mm; padding-bottom: 5mm; border-bottom: 1px solid #D1D5DB; }
    .tcp-brand { display: inline-flex; align-items: center; gap: 3mm; min-width: 0; }
    .tcp-brand-icon { width: 12mm; height: 12mm; border-radius: 2.4mm; object-fit: contain; flex: 0 0 auto; }
    .tcp-brand-text { display: grid; gap: .5mm; min-width: 0; }
    .tcp-brand-text strong { color: #111827; font-size: 14pt; line-height: 1; font-weight: 800; letter-spacing: -0.02em; }
    .tcp-brand-text span { color: #4B5563; font-size: 7.8pt; line-height: 1; text-transform: uppercase; letter-spacing: .18em; font-weight: 600; }
    .tcp-module-name { color: #111827; font-size: 12pt; line-height: 1.15; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: .04em; }
    .tcp-print-date { display: grid; gap: .8mm; justify-items: end; color: #111827; text-align: right; }
    .tcp-print-date span { color: #6B7280; font-size: 7.8pt; text-transform: uppercase; letter-spacing: .12em; font-weight: 700; }
    .tcp-print-date strong { font-size: 10pt; font-weight: 800; }
    .tcp-meta-row { display: flex; justify-content: space-between; gap: 8mm; color: #4B5563; font-size: 9pt; margin-top: 5mm; }
    .tcp-project-data { margin-top: 3mm; padding: 3mm 4mm; background: #F9FAFB; border: 0.5px solid #D1D5DB; color: #111827; font-size: 9pt; line-height: 1.45; }
    .tcp-project-data span { color: #4B5563; font-weight: 700; }
    .tcp-title-block { margin: 7mm 0 7mm; }
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
