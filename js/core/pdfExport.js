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
  companyLogo: ''
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
    companyLogo: readStoredCompanyLogo()
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
  bindCompanyLogoInput();


  document.getElementById('saveProjectButton')?.addEventListener('click', async event => {
    event.preventDefault();
    setProjectMeta(collectProjectFormValues());
    const saved = await downloadProjectFile();
    if (saved) flashProjectSaved();
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

  updateOpenedProjectLabel();
}

function hydrateProjectForm(data = {}) {
  setInputValue('pdfClient', data.client);
  setInputValue('pdfProject', data.project);
  setInputValue('pdfProjectNo', data.projectNo);
  setInputValue('pdfEngineer', data.engineer);
  setInputValue('pdfDate', data.date);
  hydrateCompanyLogoStatus(data.companyLogo || readStoredCompanyLogo());
  const file = document.getElementById('pdfCompanyLogo');
  if (file) file.value = '';
}


function readStoredCompanyLogo() {
  return getProjectMeta().companyLogo || '';
}

function hydrateCompanyLogoStatus(dataUrl = '') {
  const status = document.getElementById('pdfCompanyLogoStatus');
  if (!status) return;
  status.textContent = dataUrl ? 'Firmenlogo fuer PDF hinterlegt' : 'Kein Firmenlogo hinterlegt';
}

function bindCompanyLogoInput() {
  const input = document.getElementById('pdfCompanyLogo');
  const clearButton = document.getElementById('clearPdfCompanyLogo');

  if (input && input.dataset.bound !== 'true') {
    input.dataset.bound = 'true';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp|svg\+xml)$/i.test(file.type)) {
        alert('Bitte PNG, JPG, WebP oder SVG als Firmenlogo auswaehlen.');
        input.value = '';
        return;
      }
      if (file.size > 750 * 1024) {
        alert('Das Firmenlogo ist zu gross. Bitte eine Datei bis maximal 750 KB verwenden.');
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        setProjectMeta({ companyLogo: dataUrl });
        hydrateCompanyLogoStatus(dataUrl);
      };
      reader.onerror = () => alert('Firmenlogo konnte nicht gelesen werden.');
      reader.readAsDataURL(file);
    });
  }

  if (clearButton && clearButton.dataset.bound !== 'true') {
    clearButton.dataset.bound = 'true';
    clearButton.addEventListener('click', event => {
      event.preventDefault();
      setProjectMeta({ companyLogo: '' });
      hydrateCompanyLogoStatus('');
      if (input) input.value = '';
    });
  }

  hydrateCompanyLogoStatus(readStoredCompanyLogo());
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

  card.querySelectorAll(':scope .saved-record-card, :scope [data-saved-record-card], :scope [data-line-card]').forEach((record, index) => {
    const title = textOf(record.querySelector('.saved-record-card__title strong, .line-section-card__title strong'))
      || textOf(record.querySelector('.saved-record-card__title, .line-section-card__title'))
      || sanitizeText(record.getAttribute('aria-label') || '')
      || `Leitungsabschnitt ${index + 1}`;
    if (title) rows.push(['Bezeichnung', title, '', '']);
    record.querySelectorAll(':scope .inline-stat').forEach(stat => {
      const label = textOf(stat.querySelector('span'));
      const strong = stat.querySelector('strong');
      const small = strong?.querySelector('small');
      const raw = textOf(strong);
      const unit = small ? textOf(small) : '';
      const value = unit ? raw.replace(unit, '').trim() : raw;
      if (label || value) rows.push([label, value, unit, '']);
    });
  });

  card.querySelectorAll(':scope .inline-stat').forEach(stat => {
    if (stat.closest('.saved-record-card, [data-saved-record-card], [data-line-card]')) return;
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


function isLineSectionTitle(title = '') {
  return /leitungsabschnitt|rohrauslegung|speicher|gespeicherte/i.test(sanitizeText(title));
}

function normalizeKey(label = '') {
  return sanitizeText(label).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function lineSectionItems(rows = []) {
  const items = [];
  let current = [];
  let title = '';

  function hasRows(entryRows) {
    return entryRows.some(row => row.some(cell => sanitizeText(cell)));
  }

  function pushCurrent() {
    if (!hasRows(current)) return;
    const index = items.length + 1;
    const cleanTitle = sanitizeText(title) || `Leitungsabschnitt ${index}`;
    items.push({ title: cleanTitle, rows: current });
    current = [];
    title = '';
  }

  rows.forEach(row => {
    const label = sanitizeText(row?.[0] || '');
    const value = sanitizeText(row?.[1] || '');
    const unit = sanitizeText(row?.[2] || '');
    const key = normalizeKey(label);

    if ((key === 'bezeichnung' && current.length) || (key === 'leistung' && current.some(entry => normalizeKey(entry?.[0] || '') === 'leistung'))) {
      pushCurrent();
    }

    if (key === 'bezeichnung') {
      title = value || title;
      if (value) current.push(['Bezeichnung', value, '']);
      return;
    }

    if (label || value || unit) current.push([label, value, unit]);
  });

  pushCurrent();

  if (!items.length && hasRows(rows)) {
    items.push({ title: 'Leitungsabschnitt 1', rows });
  }
  return items;
}

function lineDetailBlocksHtml(rows = []) {
  const items = lineSectionItems(rows);
  if (!items.length) return tableHtml(rows, 'standard');

  return `<div class="tcp-line-details">${items.map((item, index) => {
    const heading = `Leitungsabschnitt ${index + 1}${item.title && !/^leitungsabschnitt\s+\d+$/i.test(item.title) ? ` - ${item.title}` : ''}`;
    const detailRows = item.rows.filter(row => normalizeKey(row?.[0] || '') !== 'bezeichnung');
    const rowsHtml = detailRows.map(row => {
      const label = sanitizeText(row?.[0] || '');
      const value = sanitizeText(row?.[1] || '');
      const unit = sanitizeText(row?.[2] || '');
      const combinedValue = [value, unit].filter(Boolean).join(' ');
      if (!label && !combinedValue) return '';
      return `<div class="tcp-line-kv"><span>${esc(label || '-')}</span><strong>${esc(combinedValue || '-')}</strong></div>`;
    }).join('');
    return `<article class="tcp-line-detail"><h3>${esc(heading)}</h3><div class="tcp-line-kv-grid">${rowsHtml}</div></article>`;
  }).join('')}</div>`;
}
function printableChart(svg) {
  if (!svg) return '';
  return `<section class="tcp-section tcp-diagram-section"><h2>h,x-Diagramm</h2><div class="tcp-rule"></div><div class="tcp-diagram">${svg}</div></section>`;
}

function buildPrintableHtml(project, moduleData) {
  const printDate = new Date().toLocaleDateString('de-DE');
  const appIconUrl = new URL('./assets/icons/icon-192.png', window.location.href).href;
  const metaValue = value => esc(sanitizeText(value) || '-');

  const hasLineSections = moduleData.sections.some(section => isLineSectionTitle(sectionTitle(section.title)));
  const printableSections = hasLineSections
    ? moduleData.sections.filter(section => isLineSectionTitle(sectionTitle(section.title)))
    : moduleData.sections;

  const sections = printableSections.map(section => {
    const title = sectionTitle(section.title).replace(/Parameter/g, 'Bezeichnung');
    const mode = /prozessablauf/i.test(title) ? 'process' : 'standard';
    const rows = section.rows.map(row => row.slice(0, 3).map(cell => sanitizeText(cell).replace(/^Sättigung$/i, 'Adiabate Befeuchtung').replace(/Parameter/g, 'Bezeichnung')));
    const isWide = isLineSectionTitle(title);
    const table = isWide ? lineDetailBlocksHtml(rows) : tableHtml(rows, mode);
    return `<section class="tcp-section${isWide ? ' tcp-section--wide' : ''}"><h2>${esc(title)}</h2>${table}</section>`;
  }).join('');
  const logoHtml = project.companyLogo ? `<img class="tcp-company-logo" src="${esc(project.companyLogo)}" alt="Firmenlogo">` : `<div class="tcp-company-logo tcp-company-logo--empty">Firmenlogo</div>`;

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>TechCalc Pro - ${esc(moduleData.shortTitle)}</title>${PRINT_STYLE}</head><body>
    <div class="tcp-toolbar">
      <button class="tcp-close" type="button" onclick="try{ if (window.opener) { window.opener.focus(); window.close(); return; } }catch(e){} if (history.length > 1) { history.back(); } else { window.close(); }">Zurück zur App</button>
      <button class="tcp-print" type="button" onclick="window.print()">PDF speichern / drucken</button>
    </div>
    <main class="tcp-page">
      <header class="tcp-header">
        <div class="tcp-brand">
          <img class="tcp-brand-icon" src="${esc(appIconUrl)}" alt="">
          <div class="tcp-brand-text"><strong>TechCalc Pro</strong><span>HLSK Quick Tools</span></div>
        </div>
        <div class="tcp-document-title"><strong>Berechnungsprotokoll</strong><span>${esc(sanitizeText(moduleData.title))} - ${esc(printDate)}</span></div>
        <div class="tcp-logo-slot">${logoHtml}</div>
      </header>
      <section class="tcp-project-data">
        <div><span>Projekt</span><strong>${metaValue(project.project)}</strong></div>
        <div><span>Projektnr.</span><strong>${metaValue(project.projectNo)}</strong></div>
        <div><span>Auftraggeber</span><strong>${metaValue(project.client)}</strong></div>
        <div><span>Sachbearbeiter</span><strong>${metaValue(project.engineer)}</strong></div>
      </section>
      <div class="tcp-sections">${sections}</div>
      ${printableChart(moduleData.chartSvg)}
    </main>
    <footer class="tcp-footer"><span>TechCalc Pro</span><span>${esc(sanitizeText(moduleData.title))}</span><span>${esc(printDate)}</span></footer>
  </body></html>`;
}

const PRINT_STYLE = `<style>
    .tcp-toolbar, .tcp-close, .tcp-print { display: none; }
    @page { size: A4; margin: 8mm 8mm 10mm 8mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 7.35pt; line-height: 1.14; }
    .tcp-page { width: 100%; }
    .tcp-header { display: grid; grid-template-columns: 48mm 1fr 34mm; gap: 4mm; align-items: center; min-height: 14mm; padding-bottom: 2.2mm; border-bottom: .55px solid #CBD5E1; }
    .tcp-brand { display: inline-flex; align-items: center; gap: 2.4mm; min-width: 0; }
    .tcp-brand-icon { width: 8.2mm; height: 8.2mm; border-radius: 1.8mm; object-fit: contain; flex: 0 0 auto; }
    .tcp-brand-text { display: grid; gap: .45mm; min-width: 0; }
    .tcp-brand-text strong { color: #111827; font-size: 10.6pt; line-height: 1; font-weight: 800; letter-spacing: -.02em; }
    .tcp-brand-text span { color: #64748B; font-size: 6.15pt; line-height: 1; text-transform: uppercase; letter-spacing: .16em; font-weight: 700; }
    .tcp-document-title { text-align: center; display: grid; gap: .8mm; }
    .tcp-document-title strong { color: #111827; font-size: 12.4pt; line-height: 1; font-weight: 800; letter-spacing: -.02em; }
    .tcp-document-title span { color: #475569; font-size: 7.2pt; line-height: 1.1; font-weight: 700; text-transform: uppercase; letter-spacing: .055em; }
    .tcp-logo-slot { min-height: 12mm; display: flex; align-items: center; justify-content: flex-end; overflow: hidden; }
    .tcp-company-logo { max-width: 34mm; max-height: 13mm; object-fit: contain; display: block; }
    .tcp-company-logo--empty { width: 30mm; height: 11mm; border: .5px dashed #CBD5E1; color: #94A3B8; font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; align-items: center; justify-content: center; }
    .tcp-project-data { margin: 2.2mm 0 2.7mm; padding: 1.6mm 2mm; background: #F8FAFC; border: .45px solid #CBD5E1; display: grid; grid-template-columns: 1.2fr .78fr 1fr .9fr; gap: 1.5mm 2.5mm; }
    .tcp-project-data div { display: grid; grid-template-columns: auto 1fr; gap: 1.2mm; min-width: 0; align-items: baseline; }
    .tcp-project-data span { color: #64748B; font-size: 6.55pt; font-weight: 800; text-transform: uppercase; letter-spacing: .055em; white-space: nowrap; }
    .tcp-project-data strong { color: #111827; font-size: 7.25pt; font-weight: 700; min-width: 0; overflow-wrap: anywhere; }
    .tcp-sections { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 2.8mm 5mm; align-items: start; }
    .tcp-section { display: block; width: 100%; margin: 0; break-inside: avoid; page-break-inside: avoid; }
    .tcp-section--wide { grid-column: 1 / -1; }
    .tcp-section h2 { margin: 0; padding: 1.05mm 1.4mm; background: #EAF3F8; border: .5px solid #BBD2DE; border-bottom: 0; color: #075985; font-size: 7.2pt; line-height: 1.05; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
    .tcp-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 6.85pt; }
    .tcp-table col.tcp-col-label { width: 45%; }
    .tcp-table col.tcp-col-num { width: 13mm; }
    .tcp-table col.tcp-col-value { width: auto; }
    .tcp-table col.tcp-col-unit { width: 18mm; }
    .tcp-table col.tcp-col-process { width: 34%; }
    .tcp-table col.tcp-col-description { width: auto; }
    .tcp-table col.tcp-col-line-name { width: 32mm; }
    .tcp-table th, .tcp-table td { border: .42px solid #CBD5E1; padding: 1.25px 2.4px; vertical-align: top; }
    .tcp-table th { background: #F1F5F9; color: #334155; font-weight: 800; font-size: 6.35pt; text-transform: uppercase; letter-spacing: .03em; }
    .tcp-table td { color: #111827; }
    .tcp-table .tcp-label-cell { text-align: left; overflow-wrap: anywhere; }
    .tcp-table .tcp-value-cell { text-align: right; overflow-wrap: anywhere; font-weight: 700; }
    .tcp-table .tcp-value-text { text-align: left; font-weight: 600; }
    .tcp-table .tcp-unit-cell { text-align: right; white-space: nowrap; color: #475569; }
    .tcp-table--numbered th:nth-child(1), .tcp-table--numbered td:nth-child(1), .tcp-table--process th:nth-child(1), .tcp-table--process td:nth-child(1) { text-align: right; white-space: nowrap; }
    .tcp-table--process th:nth-child(2), .tcp-table--process td:nth-child(2), .tcp-table--process th:nth-child(3), .tcp-table--process td:nth-child(3) { text-align: left; white-space: normal; }
    .tcp-table--lines { font-size: 6.55pt; table-layout: fixed; }
    .tcp-table--lines th { text-align: right; }
    .tcp-table--lines th:first-child { text-align: left; }
    .tcp-table--lines .tcp-line-name { text-align: left; font-weight: 700; overflow-wrap: anywhere; }
    .tcp-table--lines .tcp-line-value { text-align: right; white-space: nowrap; }
    .tcp-line-details { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2.4mm; align-items: start; }
    .tcp-line-detail { border: .55px solid #CBD5E1; break-inside: avoid; page-break-inside: avoid; }
    .tcp-line-detail h3 { margin: 0; padding: 1.05mm 1.4mm; background: #F8FAFC; border-bottom: .45px solid #CBD5E1; color: #0F172A; font-size: 7.2pt; line-height: 1.05; font-weight: 800; overflow-wrap: anywhere; }
    .tcp-line-kv-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 4mm; row-gap: 0; padding: .6mm 1.2mm 1mm; }
    .tcp-line-kv { display: grid; grid-template-columns: minmax(24mm, .92fr) minmax(0, 1fr); gap: 1.4mm; align-items: baseline; min-height: 3.8mm; padding: .55mm 0; border-bottom: .35px solid #E2E8F0; }
    .tcp-line-kv:nth-last-child(1), .tcp-line-kv:nth-last-child(2):nth-child(odd) { border-bottom: 0; }
    .tcp-line-kv span { color: #475569; font-size: 6.45pt; font-weight: 700; overflow-wrap: anywhere; }
    .tcp-line-kv strong { color: #111827; font-size: 6.8pt; font-weight: 800; text-align: right; overflow-wrap: anywhere; }
    .tcp-diagram-section { margin-top: 3mm; break-inside: avoid; page-break-inside: avoid; }
    .tcp-diagram-section h2 { margin: 0; padding: 1.05mm 1.4mm; background: #EAF3F8; border: .5px solid #BBD2DE; border-bottom: 0; color: #075985; font-size: 7.2pt; line-height: 1.05; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
    .tcp-rule { display: none; }
    .tcp-diagram { width: 100%; border: .5px solid #CBD5E1; padding: 2mm; background: #fff; overflow: hidden; }
    .tcp-diagram svg { width: 100%; height: auto; display: block; background: #fff; }
    .tcp-diagram .hx-chart-bg { fill: #fff !important; stroke: #CBD5E1 !important; }
    .tcp-diagram .hx-grid-line { stroke: #E2E8F0 !important; stroke-width: 1 !important; }
    .tcp-diagram .hx-axis-label, .tcp-diagram .hx-title, .tcp-diagram .hx-rh-label { fill: #111827 !important; font-family: Arial, Helvetica, sans-serif !important; }
    .tcp-diagram .hx-rh { fill: none !important; stroke: #94A3B8 !important; stroke-width: 1.1 !important; opacity: .9 !important; }
    .tcp-diagram .hx-rh-100 { stroke: #111827 !important; stroke-width: 2 !important; }
    .tcp-diagram .hx-state-path { fill: none !important; stroke: #F97316 !important; stroke-width: 3 !important; }
    .tcp-diagram .hx-point circle { fill: #fff !important; stroke: #F97316 !important; stroke-width: 2.5 !important; }
    .tcp-diagram .hx-point text { fill: #111827 !important; font-weight: 700 !important; font-family: Arial, Helvetica, sans-serif !important; }
    .tcp-footer { position: fixed; bottom: 4mm; left: 8mm; right: 8mm; display: flex; justify-content: space-between; border-top: .5px solid #CBD5E1; padding-top: 1.2mm; color: #64748B; font-size: 6.25pt; }
    @media screen { body { background: #e5e7eb; padding: calc(66px + env(safe-area-inset-top)) 18px 18px; } .tcp-toolbar { position: fixed; z-index: 9999; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: calc(10px + env(safe-area-inset-top)) 14px 10px; background: rgba(255,255,255,.94); border-bottom: 1px solid #CBD5E1; box-shadow: 0 10px 34px rgba(15,23,42,.14); } .tcp-close, .tcp-print { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 0 14px; border: 1px solid #CBD5E1; border-radius: 999px; background: #fff; color: #111827; font: 700 14px Arial, Helvetica, sans-serif; } .tcp-print { background: #007EA7; border-color: #007EA7; color: #fff; } .tcp-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 8mm; box-shadow: 0 18px 70px rgba(0,0,0,.18); } .tcp-footer { display: none; } }
    @media print { .tcp-toolbar, .tcp-close, .tcp-print { display: none !important; } }
    @media screen and (max-width: 820px) { .tcp-sections { grid-template-columns: 1fr; } .tcp-section--wide { grid-column: auto; } .tcp-line-kv-grid { grid-template-columns: 1fr; } }
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
