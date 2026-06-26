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
    const heading = item.title && !/^leitungsabschnitt\s+\d+$/i.test(item.title) ? item.title : `Leitungsabschnitt ${index + 1}`;
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

function reportSections(moduleData) {
  const hasLineSections = moduleData.sections.some(section => isLineSectionTitle(sectionTitle(section.title)));
  const printableSections = hasLineSections
    ? moduleData.sections.filter(section => isLineSectionTitle(sectionTitle(section.title)))
    : moduleData.sections;
  return printableSections.map(section => {
    const title = sectionTitle(section.title).replace(/Parameter/g, 'Bezeichnung');
    const rows = section.rows.map(row => row.slice(0, 3).map(cell => sanitizeText(cell).replace(/^Sättigung$/i, 'Adiabate Befeuchtung').replace(/Parameter/g, 'Bezeichnung')));
    return { title, rows, isLineSection: isLineSectionTitle(title) };
  });
}

const PDF_PT_PER_MM = 72 / 25.4;
const PDF_PAGE = { width: 595.28, height: 841.89 };
const PDF_THEME = {
  margin: 8 * PDF_PT_PER_MM,
  text: [17, 24, 39],
  muted: [100, 116, 139],
  line: [203, 213, 225],
  soft: [248, 250, 252],
  accentBg: [234, 243, 248],
  accent: [7, 89, 133]
};

function pdfHexText(value = '') {
  const text = sanitizeText(value);
  const bytes = [0xFE, 0xFF];
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code > 0xFFFF) continue;
    bytes.push((code >> 8) & 0xFF, code & 0xFF);
  }
  return `<${bytes.map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}>`;
}

function pdfNumber(value) {
  return Number(value).toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
}

function estimateTextWidth(text, size = 8) {
  return sanitizeText(text).length * size * 0.48;
}

function splitPdfText(text, maxWidth, size = 8) {
  const words = sanitizeText(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = '';
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (estimateTextWidth(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function rgb(values) {
  return values.map(value => pdfNumber(value / 255)).join(' ');
}

class NativePdfReport {
  constructor() {
    this.pages = [];
    this.addPage();
  }

  addPage() {
    this.page = [];
    this.pages.push(this.page);
    this.cursorY = PDF_THEME.margin;
  }

  cmd(command) {
    this.page.push(command);
  }

  y(topY) {
    return PDF_PAGE.height - topY;
  }

  color(values, stroke = false) {
    this.cmd(`${rgb(values)} ${stroke ? 'RG' : 'rg'}`);
  }

  text(value, x, y, { size = 8, font = 'F1', color = PDF_THEME.text, align = 'left', maxWidth = null } = {}) {
    const lines = maxWidth ? splitPdfText(value, maxWidth, size) : [sanitizeText(value)];
    lines.forEach((line, index) => {
      const lineY = y + index * size * 1.18;
      let lineX = x;
      if (align === 'center') lineX = x - estimateTextWidth(line, size) / 2;
      if (align === 'right') lineX = x - estimateTextWidth(line, size);
      this.color(color);
      this.cmd(`BT /${font} ${pdfNumber(size)} Tf ${pdfNumber(lineX)} ${pdfNumber(this.y(lineY))} Td ${pdfHexText(line)} Tj ET`);
    });
    return lines.length * size * 1.18;
  }

  line(x1, y1, x2, y2, color = PDF_THEME.line, width = 0.5) {
    this.color(color, true);
    this.cmd(`${pdfNumber(width)} w ${pdfNumber(x1)} ${pdfNumber(this.y(y1))} m ${pdfNumber(x2)} ${pdfNumber(this.y(y2))} l S`);
  }

  rect(x, y, w, h, { fill = null, stroke = PDF_THEME.line, width = 0.5 } = {}) {
    if (fill) this.color(fill);
    if (stroke) this.color(stroke, true);
    this.cmd(`${pdfNumber(width)} w ${pdfNumber(x)} ${pdfNumber(this.y(y + h))} ${pdfNumber(w)} ${pdfNumber(h)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`);
  }

  ensureSpace(requiredHeight) {
    const bottomLimit = PDF_PAGE.height - PDF_THEME.margin - 14;
    if (this.cursorY + requiredHeight > bottomLimit) this.addPage();
  }

  header(project, moduleData, date) {
    const m = PDF_THEME.margin;
    const right = PDF_PAGE.width - m;
    const titleX = PDF_PAGE.width / 2;
    const logoX = right - 96;

    this.text('TechCalc Pro', m + 25, m + 8, { size: 10.6, font: 'F2' });
    this.text('HLSK QUICK TOOLS', m + 25, m + 19, { size: 6.2, font: 'F2', color: PDF_THEME.muted });
    this.rect(m, m + 1, 21, 21, { fill: [15, 23, 42], stroke: [30, 41, 59], width: 0.6 });
    this.text('TCP', m + 10.5, m + 14.5, { size: 6.3, font: 'F2', color: [255, 255, 255], align: 'center' });

    this.text('Berechnungsprotokoll', titleX, m + 6, { size: 12.4, font: 'F2', align: 'center' });
    this.text(`${moduleData.title} - ${date}`, titleX, m + 18, { size: 7.2, font: 'F2', color: [71, 85, 105], align: 'center' });

    this.rect(logoX, m, 96, 28, { fill: null, stroke: [203, 213, 225], width: 0.5 });
    this.text(project.companyLogo ? 'FIRMENLOGO HINTERLEGT' : 'FIRMENLOGO', logoX + 48, m + 17, { size: 6.3, font: 'F2', color: [148, 163, 184], align: 'center' });
    this.line(m, m + 34, right, m + 34, PDF_THEME.line, 0.55);
    this.cursorY = m + 39;
  }

  projectData(project) {
    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    const h = 19;
    this.rect(m, this.cursorY, w, h, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.45 });
    const labels = [
      ['PROJEKT', project.project],
      ['PROJEKTNR.', project.projectNo],
      ['AUFTRAGGEBER', project.client],
      ['SACHBEARBEITER', project.engineer]
    ];
    const colW = w / 4;
    labels.forEach(([label, value], index) => {
      const x = m + index * colW + 4;
      this.text(label, x, this.cursorY + 7, { size: 6.4, font: 'F2', color: PDF_THEME.muted });
      this.text(value || '-', x + 40, this.cursorY + 7, { size: 7.2, font: 'F2', maxWidth: colW - 45 });
    });
    this.cursorY += h + 8;
  }

  sectionTitle(title) {
    const m = PDF_THEME.margin;
    this.text(title, m, this.cursorY, { size: 8.2, font: 'F2', color: PDF_THEME.accent });
    this.cursorY += 9;
  }

  lineBlock(item) {
    const detailRows = item.rows.filter(row => normalizeKey(row?.[0] || '') !== 'bezeichnung');
    const columns = [[], []];
    detailRows.forEach((row, index) => columns[index % 2].push(row));
    const rowHeight = 12;
    const bodyRows = Math.max(columns[0].length, columns[1].length);
    const blockHeight = 18 + bodyRows * rowHeight + 8;
    this.ensureSpace(blockHeight);

    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    const y0 = this.cursorY;
    this.rect(m, y0, w, blockHeight - 4, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.55 });
    this.rect(m, y0, w, 16, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.45 });
    this.text(item.title || 'Abschnitt', m + 5, y0 + 10.5, { size: 7.4, font: 'F2', maxWidth: w - 10 });

    const colGap = 20;
    const colW = (w - 10 - colGap) / 2;
    const labelW = colW * 0.48;
    columns.forEach((column, colIndex) => {
      const x = m + 5 + colIndex * (colW + colGap);
      column.forEach((row, rowIndex) => {
        const y = y0 + 24 + rowIndex * rowHeight;
        const label = sanitizeText(row?.[0] || '-');
        const value = [sanitizeText(row?.[1] || ''), sanitizeText(row?.[2] || '')].filter(Boolean).join(' ') || '-';
        this.text(label, x, y, { size: 6.5, font: 'F2', color: [71, 85, 105], maxWidth: labelW });
        this.text(value, x + labelW + 4, y, { size: 6.8, font: 'F2', align: 'right', maxWidth: colW - labelW - 4 });
        this.line(x, y + 3.3, x + colW, y + 3.3, [226, 232, 240], 0.35);
      });
    });
    this.cursorY += blockHeight;
  }

  standardSection(section) {
    const rows = section.rows.filter(row => row.some(cell => sanitizeText(cell)));
    const rowHeight = 12;
    const blockHeight = 18 + rows.length * rowHeight + 8;
    this.ensureSpace(blockHeight);
    this.sectionTitle(section.title);
    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    rows.forEach(row => {
      const y = this.cursorY;
      const label = sanitizeText(row?.[0] || '-');
      const value = [sanitizeText(row?.[1] || ''), sanitizeText(row?.[2] || '')].filter(Boolean).join(' ') || '-';
      this.text(label, m + 3, y, { size: 6.7, font: 'F2', color: [71, 85, 105], maxWidth: w * 0.44 });
      this.text(value, m + w - 3, y, { size: 6.9, font: 'F2', align: 'right', maxWidth: w * 0.5 });
      this.line(m, y + 3.3, m + w, y + 3.3, [226, 232, 240], 0.35);
      this.cursorY += rowHeight;
    });
    this.cursorY += 4;
  }

  footer() {
    const total = this.pages.length;
    this.pages.forEach((page, index) => {
      this.page = page;
      this.text(`Seite ${index + 1} von ${total}`, PDF_PAGE.width - PDF_THEME.margin, PDF_PAGE.height - 6, { size: 6.5, font: 'F1', color: PDF_THEME.muted, align: 'right' });
    });
  }

  build(project, moduleData) {
    const date = new Date().toLocaleDateString('de-DE');
    this.header(project, moduleData, date);
    this.projectData(project);
    const sections = reportSections(moduleData);
    const lineSections = sections.filter(section => section.isLineSection);
    if (lineSections.length) {
      this.sectionTitle('LEITUNGSABSCHNITTE');
      lineSections.forEach(section => {
        lineSectionItems(section.rows).forEach(item => this.lineBlock(item));
      });
    } else {
      sections.forEach(section => this.standardSection(section));
    }
    this.footer();
    return this.output();
  }

  output() {
    const objects = [];
    const addObject = value => { objects.push(value); return objects.length; };
    const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pageIds = [];
    const contentIds = [];
    this.pages.forEach(page => {
      const stream = page.join('\n');
      contentIds.push(addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`));
    });
    const pagesIdPlaceholder = objects.length + this.pages.length + 1;
    this.pages.forEach((page, index) => {
      pageIds.push(addObject(`<< /Type /Page /Parent ${pagesIdPlaceholder} 0 R /MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`));
    });
    const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
    const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    const chunks = ['%PDF-1.4\n'];
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(chunks.join('').length);
      chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
    });
    const xrefOffset = chunks.join('').length;
    chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
    for (let i = 1; i <= objects.length; i += 1) {
      chunks.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    }
    chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
    return new Blob(chunks, { type: 'application/pdf' });
  }
}

function pdfFileName(moduleData) {
  const safeTitle = sanitizeText(moduleData.shortTitle || moduleData.title || 'Berechnung').replace(/[^a-z0-9äöüß -]+/gi, '').trim() || 'Berechnung';
  return `TechCalc Pro - ${safeTitle}.pdf`;
}

function downloadNativePdf(project, moduleData) {
  const report = new NativePdfReport();
  const blob = report.build(project, moduleData);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = pdfFileName(moduleData);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
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
      downloadNativePdf(project, moduleData);
    } catch (error) {
      console.error('PDF-Export fehlgeschlagen.', error);
      alert('PDF-Export konnte nicht erstellt werden. Bitte Browser-Konsole prüfen.');
    }
  });
}
