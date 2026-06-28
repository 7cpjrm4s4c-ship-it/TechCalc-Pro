import { currentRoute } from './router.js';
import { esc } from './renderer.js';
import { getProjectMeta, setProjectMeta, downloadProjectFile, readProjectFile, applyProjectData, getOpenedFileName, saveSessionSnapshot } from './projectStorage.js';
import { PDF_PAGE, PDF_THEME } from './pdf/reportTheme.js';


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
  companyLogo: '',
  companyName: '',
  companyAddress: '',
  documentVersion: '',
  checkedBy: '',
  approvedBy: ''
};

const PDF_COMPANY_LOGO_STORAGE_KEY = 'techcalc-pdf-company-logo';
const APP_ICON_FALLBACK_JPEG = { dataUrl: 'data:image/jpeg;base64,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', width: 192, height: 192 };


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
    companyLogo: readStoredCompanyLogo(),
    companyLogoName: readStoredCompanyLogoName(),
    companyName: document.getElementById('pdfCompanyName')?.value || '',
    companyAddress: document.getElementById('pdfCompanyAddress')?.value || '',
    documentVersion: document.getElementById('pdfDocumentVersion')?.value || '',
    checkedBy: document.getElementById('pdfCheckedBy')?.value || '',
    approvedBy: document.getElementById('pdfApprovedBy')?.value || ''
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
  bindProjectInput('pdfCompanyName', 'companyName');
  bindProjectInput('pdfCompanyAddress', 'companyAddress');
  bindProjectInput('pdfDocumentVersion', 'documentVersion');
  bindProjectInput('pdfCheckedBy', 'checkedBy');
  bindProjectInput('pdfApprovedBy', 'approvedBy');
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
  setInputValue('pdfCompanyName', data.companyName);
  setInputValue('pdfCompanyAddress', data.companyAddress);
  setInputValue('pdfDocumentVersion', data.documentVersion);
  setInputValue('pdfCheckedBy', data.checkedBy);
  setInputValue('pdfApprovedBy', data.approvedBy);
  setInputValue('pdfDate', data.date);
  hydrateCompanyLogoStatus(data.companyLogo || readStoredCompanyLogo(), data.companyLogoName || readStoredCompanyLogoName());
}


function readStoredCompanyLogo() {
  const metaLogo = getProjectMeta().companyLogo || '';
  if (metaLogo) return metaLogo;
  try { return localStorage.getItem(PDF_COMPANY_LOGO_STORAGE_KEY) || ''; } catch { return ''; }
}

function readStoredCompanyLogoName() {
  const metaName = getProjectMeta().companyLogoName || '';
  if (metaName) return metaName;
  try { return localStorage.getItem(`${PDF_COMPANY_LOGO_STORAGE_KEY}-name`) || ''; } catch { return ''; }
}

function persistCompanyLogo(dataUrl = '', fileName = '') {
  setProjectMeta({ companyLogo: dataUrl, companyLogoName: fileName });
  try {
    if (dataUrl) localStorage.setItem(PDF_COMPANY_LOGO_STORAGE_KEY, dataUrl);
    else localStorage.removeItem(PDF_COMPANY_LOGO_STORAGE_KEY);
    if (fileName) localStorage.setItem(`${PDF_COMPANY_LOGO_STORAGE_KEY}-name`, fileName);
    else if (!dataUrl) localStorage.removeItem(`${PDF_COMPANY_LOGO_STORAGE_KEY}-name`);
  } catch (error) {
    console.warn('Firmenlogo konnte nicht dauerhaft gespeichert werden.', error);
  }
}

function hydrateCompanyLogoStatus(dataUrl = '', fileName = '') {
  const status = document.getElementById('pdfCompanyLogoStatus');
  if (!status) return;
  status.textContent = dataUrl ? `Firmenlogo fuer PDF hinterlegt${fileName ? `: ${fileName}` : ''}` : 'Kein Firmenlogo hinterlegt';
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
      reader.onload = async () => {
        const dataUrl = String(reader.result || '');
        const fileName = file.name || 'Firmenlogo';
        // Rohdaten sofort speichern, damit das Logo auch dann erhalten bleibt,
        // wenn die JPEG-Normalisierung auf einzelnen Mobilbrowsern fehlschlägt.
        persistCompanyLogo(dataUrl, fileName);
        hydrateCompanyLogoStatus(dataUrl, fileName);
        const normalizedLogo = await normalizeImageToJpeg(dataUrl, { maxWidth: 1200, maxHeight: 520, quality: 0.92 });
        const storedLogo = normalizedLogo?.dataUrl || dataUrl;
        persistCompanyLogo(storedLogo, fileName);
        setProjectMeta({ ...collectProjectFormValues(), companyLogo: storedLogo, companyLogoName: fileName });
        hydrateCompanyLogoStatus(storedLogo, fileName);
      };
      reader.onerror = () => alert('Firmenlogo konnte nicht gelesen werden.');
      reader.readAsDataURL(file);
    });
  }

  if (clearButton && clearButton.dataset.bound !== 'true') {
    clearButton.dataset.bound = 'true';
    clearButton.addEventListener('click', event => {
      event.preventDefault();
      persistCompanyLogo('', '');
      hydrateCompanyLogoStatus('', '');
      if (input) input.value = '';
    });
  }

  hydrateCompanyLogoStatus(readStoredCompanyLogo(), readStoredCompanyLogoName());
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

function winAnsiByteForChar(ch) {
  const code = ch.codePointAt(0);
  const fallback = {
    '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
    'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E,
    '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
    '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F
  };
  if (fallback[ch]) return fallback[ch];
  if (code >= 0x20 && code <= 0x7E) return code;
  if (code >= 0xA0 && code <= 0xFF) return code;
  return 0x3F;
}

function pdfHexText(value = '') {
  const text = sanitizeText(value);
  const bytes = [];
  for (const ch of text) bytes.push(winAnsiByteForChar(ch));
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

function rowHeightForPdfRow(row, valueWidth = 110) {
  const labelLines = splitPdfText(row?.[0] || '', 82, 6.5).length;
  const value = [sanitizeText(row?.[1] || ''), sanitizeText(row?.[2] || '')].filter(Boolean).join(' ');
  const valueLines = splitPdfText(value, valueWidth, 6.8).length;
  return Math.max(12, Math.max(labelLines, valueLines) * 8.2 + 3.8);
}

function distributeRowsBalanced(rows = []) {
  const columns = [[], []];
  const heights = [0, 0];
  rows.forEach(row => {
    const target = heights[0] <= heights[1] ? 0 : 1;
    columns[target].push(row);
    heights[target] += rowHeightForPdfRow(row);
  });
  return { columns, heights };
}


function imageElementFromSource(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    // Wichtig: crossOrigin darf bei data:-URLs und lokalen App-Assets nicht gesetzt werden.
    // iOS/Safari kann solche Bilder sonst nicht zuverlässig in Canvas/PDF übernehmen.
    if (/^https?:/i.test(String(source || ''))) img.crossOrigin = 'anonymous';
    img.src = source;
  });
}

async function normalizeImageToJpeg(source, { maxWidth = 512, maxHeight = 256, quality = 0.88 } = {}) {
  if (!source) return null;
  try {
    const img = await imageElementFromSource(source);
    const scale = Math.min(1, maxWidth / Math.max(1, img.naturalWidth || img.width), maxHeight / Math.max(1, img.naturalHeight || img.height));
    const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL('image/jpeg', quality), width, height };
  } catch (error) {
    console.warn('PDF-Bild konnte nicht vorbereitet werden.', error);
    return null;
  }
}

function parseJpegDataUrl(image) {
  if (!image?.dataUrl || !/^data:image\/jpeg;base64,/i.test(image.dataUrl)) return null;
  const base64 = image.dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  return { width: image.width, height: image.height, binary };
}

class GlobalPdfReport {
  constructor(images = {}) {
    this.images = images;
    this.imageResources = [];
    if (images.appIcon) this.imageResources.push({ key: 'appIcon', name: 'ImAppIcon', image: images.appIcon });
    if (images.companyLogo) this.imageResources.push({ key: 'companyLogo', name: 'ImCompanyLogo', image: images.companyLogo });
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

  drawImage(resourceName, x, y, w, h) {
    if (!resourceName) return false;
    this.cmd(`q ${pdfNumber(w)} 0 0 ${pdfNumber(h)} ${pdfNumber(x)} ${pdfNumber(this.y(y + h))} cm /${resourceName} Do Q`);
    return true;
  }

  contentBottom() {
    return PDF_PAGE.height - PDF_THEME.margin - 18;
  }

  ensureSpace(requiredHeight, { repeatTitle = '' } = {}) {
    if (this.cursorY + requiredHeight <= this.contentBottom()) return false;
    this.addPage();
    if (repeatTitle) this.sectionTitle(`${repeatTitle} (Fortsetzung)`);
    return true;
  }

  header(project, moduleData, date) {
    const m = PDF_THEME.margin;
    const right = PDF_PAGE.width - m;
    const titleX = PDF_PAGE.width / 2;
    const logoW = 104;
    const logoH = 42;
    const logoX = right - logoW;

    this.text('TechCalc Pro', m + 25, m + 8, { size: 10.6, font: 'F2' });
    this.text('HLSK QUICK TOOLS', m + 25, m + 19, { size: 6.2, font: 'F2', color: PDF_THEME.muted });
    if (!this.drawImage('ImAppIcon', m, m + 1, 21, 21)) {
      this.rect(m, m + 1, 21, 21, { fill: [15, 23, 42], stroke: [30, 41, 59], width: 0.6 });
      this.text('TCP', m + 10.5, m + 14.5, { size: 6.3, font: 'F2', color: [255, 255, 255], align: 'center' });
    }

    this.text('Berechnungsprotokoll', titleX, m + 6, { size: 12.4, font: 'F2', align: 'center' });
    this.text(`${moduleData.title} - ${date}`, titleX, m + 18, { size: 7.2, font: 'F2', color: [71, 85, 105], align: 'center' });

    this.rect(logoX, m, logoW, logoH, { fill: null, stroke: [203, 213, 225], width: 0.5 });
    if (this.images.companyLogo) {
      const imgRatio = this.images.companyLogo.width / Math.max(1, this.images.companyLogo.height);
      let imgW = logoW - 12;
      let imgH = imgW / imgRatio;
      if (imgH > logoH - 8) { imgH = logoH - 8; imgW = imgH * imgRatio; }
      this.drawImage('ImCompanyLogo', logoX + (logoW - imgW) / 2, m + (logoH - imgH) / 2, imgW, imgH);
    } else {
      this.text('FIRMENLOGO', logoX + logoW / 2, m + logoH / 2 + 2, { size: 6.3, font: 'F2', color: [148, 163, 184], align: 'center' });
    }
    this.line(m, m + logoH + 6, right, m + logoH + 6, PDF_THEME.line, 0.55);
    this.cursorY = m + logoH + 11;
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
      this.text(label, x, this.cursorY + 6.4, { size: 6.1, font: 'F2', color: PDF_THEME.muted, maxWidth: colW - 8 });
      this.text(value || '-', x, this.cursorY + 14.3, { size: 7.2, font: 'F2', maxWidth: colW - 8 });
    });
    this.cursorY += h + 8;
  }

  sectionTitle(title) {
    const m = PDF_THEME.margin;
    this.text(title, m, this.cursorY, { size: 8.2, font: 'F2', color: PDF_THEME.accent });
    this.cursorY += 9;
    return 9;
  }

  lineBlock(item, groupTitle = 'LEITUNGSABSCHNITTE') {
    const detailRows = item.rows.filter(row => normalizeKey(row?.[0] || '') !== 'bezeichnung');
    const { columns, heights } = distributeRowsBalanced(detailRows);
    const blockHeight = Math.max(42, 24 + Math.max(heights[0], heights[1]) + 8);
    this.ensureSpace(blockHeight, { repeatTitle: groupTitle });

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
      let rowY = y0 + 24;
      column.forEach(row => {
        const rowHeight = rowHeightForPdfRow(row, colW - labelW - 4);
        const label = sanitizeText(row?.[0] || '-');
        const value = [sanitizeText(row?.[1] || ''), sanitizeText(row?.[2] || '')].filter(Boolean).join(' ') || '-';
        this.text(label, x, rowY, { size: 6.5, font: 'F2', color: [71, 85, 105], maxWidth: labelW });
        this.text(value, x + colW, rowY, { size: 6.8, font: 'F2', align: 'right', maxWidth: colW - labelW - 4 });
        this.line(x, rowY + rowHeight - 2.7, x + colW, rowY + rowHeight - 2.7, [226, 232, 240], 0.35);
        rowY += rowHeight;
      });
    });
    this.cursorY += blockHeight;
  }

  standardSection(section) {
    const rows = section.rows.filter(row => row.some(cell => sanitizeText(cell)));
    this.ensureSpace(22);
    this.sectionTitle(section.title);
    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    rows.forEach(row => {
      const rowHeight = Math.max(12, rowHeightForPdfRow(row, w * 0.5));
      this.ensureSpace(rowHeight + 2, { repeatTitle: section.title });
      const y = this.cursorY;
      const label = sanitizeText(row?.[0] || '-');
      const value = [sanitizeText(row?.[1] || ''), sanitizeText(row?.[2] || '')].filter(Boolean).join(' ') || '-';
      this.text(label, m + 3, y, { size: 6.7, font: 'F2', color: [71, 85, 105], maxWidth: w * 0.44 });
      this.text(value, m + w - 3, y, { size: 6.9, font: 'F2', align: 'right', maxWidth: w * 0.5 });
      this.line(m, y + rowHeight - 2.7, m + w, y + rowHeight - 2.7, [226, 232, 240], 0.35);
      this.cursorY += rowHeight;
    });
    this.cursorY += 4;
  }

  corporateBlock(project, moduleData) {
    const hasCorporate = [project.companyName, project.companyAddress, project.documentVersion, project.checkedBy, project.approvedBy].some(value => sanitizeText(value));
    if (!hasCorporate) return;

    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    const blockHeight = 58;
    this.ensureSpace(blockHeight + 6);

    const y0 = this.cursorY + 4;
    this.rect(m, y0, w, blockHeight, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.45 });
    this.text('DOKUMENT / CORPORATE DESIGN', m + 5, y0 + 8.5, { size: 6.6, font: 'F2', color: PDF_THEME.accent });

    const leftX = m + 5;
    const midX = m + w * 0.48;
    const rightX = m + w * 0.72;
    const baseY = y0 + 20;

    this.text('Firma', leftX, baseY, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.companyName || '-', leftX + 36, baseY, { size: 6.6, font: 'F2', maxWidth: w * 0.36 });
    this.text('Anschrift', leftX, baseY + 12, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.companyAddress || '-', leftX + 36, baseY + 12, { size: 6.4, font: 'F1', maxWidth: w * 0.36 });

    this.text('Dokumentversion', midX, baseY, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.documentVersion || '-', midX + 58, baseY, { size: 6.6, font: 'F2', maxWidth: 72 });
    this.text('Modul', midX, baseY + 12, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(moduleData.shortTitle || moduleData.title || '-', midX + 58, baseY + 12, { size: 6.4, font: 'F1', maxWidth: 72 });

    this.text('Geprüft', rightX, baseY, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.checkedBy || '-', rightX + 35, baseY, { size: 6.6, font: 'F2', maxWidth: 80 });
    this.text('Freigabe', rightX, baseY + 12, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.approvedBy || '-', rightX + 35, baseY + 12, { size: 6.6, font: 'F2', maxWidth: 80 });


    this.cursorY = y0 + blockHeight + 6;
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
      const lineGroupTitle = 'LEITUNGSABSCHNITTE';
      this.sectionTitle(lineGroupTitle);
      lineSections.forEach(section => {
        lineSectionItems(section.rows).forEach(item => this.lineBlock(item, lineGroupTitle));
      });
    } else {
      sections.forEach(section => this.standardSection(section));
    }
    this.corporateBlock(project, moduleData);
    this.footer();
    return this.output();
  }

  output() {
    const objects = [];
    const addObject = value => { objects.push(value); return objects.length; };
    const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const imageObjectIds = new Map();
    this.imageResources.forEach(resource => {
      const image = parseJpegDataUrl(resource.image);
      if (!image) return;
      const hex = [...image.binary].map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('') + '>';
      const id = addObject(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${hex.length} >>\nstream\n${hex}\nendstream`);
      imageObjectIds.set(resource.name, id);
    });
    const xObjectEntries = [...imageObjectIds.entries()].map(([name, id]) => `/${name} ${id} 0 R`).join(' ');
    const xObjectResource = xObjectEntries ? `/XObject << ${xObjectEntries} >>` : '';
    const pageIds = [];
    const contentIds = [];
    this.pages.forEach(page => {
      const stream = page.join('\n');
      contentIds.push(addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`));
    });
    const pagesIdPlaceholder = objects.length + this.pages.length + 1;
    this.pages.forEach((page, index) => {
      pageIds.push(addObject(`<< /Type /Page /Parent ${pagesIdPlaceholder} 0 R /MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> ${xObjectResource} >> /Contents ${contentIds[index]} 0 R >>`));
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

async function downloadNativePdf(project, moduleData) {
  const appIconUrl = new URL('./assets/icons/icon-192.png', window.location.href).href;
  const appIcon = await normalizeImageToJpeg(appIconUrl, { maxWidth: 256, maxHeight: 256, quality: 0.92 }) || APP_ICON_FALLBACK_JPEG;
  const companyLogo = await normalizeImageToJpeg(project.companyLogo, { maxWidth: 900, maxHeight: 360, quality: 0.9 });
  const report = new GlobalPdfReport({ appIcon, companyLogo });
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
  exportButton.addEventListener('click', async event => {
    event.preventDefault();
    try {
      const project = saveProject({ ...collectProjectFormValues(), companyLogo: readStoredCompanyLogo(), companyLogoName: readStoredCompanyLogoName() });
      saveSessionSnapshot();
      const moduleData = collectCurrentModule(modules, routeGetter);
      await downloadNativePdf(project, moduleData);
    } catch (error) {
      console.error('PDF-Export fehlgeschlagen.', error);
      alert('PDF-Export konnte nicht erstellt werden. Bitte Browser-Konsole prüfen.');
    }
  });
}
