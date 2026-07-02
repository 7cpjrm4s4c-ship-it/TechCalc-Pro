import { currentRoute } from '../router.js';
import { sanitizeText, normalizeKey } from './pdfText.js';

function textOf(node) { return sanitizeText(node?.textContent || ''); }

function valueOfField(field) {
  const control = field.querySelector('input, select, textarea');
  if (!control) return '';
  if (control.matches('select')) return sanitizeText(control.selectedOptions?.[0]?.textContent || control.value);
  return sanitizeText(control.value);
}

function unitOfField(field) {
  const unitSelect = field.querySelector('.unit-select');
  if (unitSelect) return sanitizeText(unitSelect.selectedOptions?.[0]?.textContent || unitSelect.value);
  const unit = field.querySelector('.unit:not(.unit-select)');
  return unit ? textOf(unit) : '';
}

export function extractCardRows(card) {
  const rows = [];

  card.querySelectorAll(':scope .field').forEach(field => {
    const label = textOf(field.querySelector('label'));
    const value = valueOfField(field);
    const unit = unitOfField(field);
    if (label || value || unit) rows.push([label, value, unit, '']);
  });

  card.querySelectorAll(':scope .main-result, :scope .inline-stat, :scope .result-row').forEach(result => {
    if (result.closest('.saved-record-card, [data-saved-record-card], [data-line-card]')) return;
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
    record.querySelectorAll(':scope .inline-stat, :scope .result-row').forEach(stat => {
      const label = textOf(stat.querySelector('span'));
      const strong = stat.querySelector('strong');
      const small = strong?.querySelector('small');
      const raw = textOf(strong);
      const unit = small ? textOf(small) : '';
      const value = unit ? raw.replace(unit, '').trim() : raw;
      if (label || value) rows.push([label, value, unit, '']);
    });
  });

  card.querySelectorAll(':scope .hx-process-step').forEach((step, index) => {
    const rawLabel = textOf(step.querySelector('strong')) || `Punkt ${index + 1}`;
    const normalizedLabel = rawLabel.match(/^\d+\s+/) ? rawLabel : `${index + 1} ${rawLabel}`;
    const values = [...step.querySelectorAll('span')].map(textOf).join(' | ');
    rows.push([normalizedLabel, values, '', '']);
  });

  card.querySelectorAll(':scope .pipe-dimension-card').forEach((dim, index) => {
    const title = textOf(dim.querySelector('strong')) || `Dimension ${index + 1}`;
    const meta = textOf(dim.querySelector('.pipe-dimension-card__meta'));
    rows.push([title, meta, '', '']);
  });

  return rows;
}

function isChartCard(card) {
  return Boolean(card.querySelector('.hx-chart, svg, canvas')) && /diagramm/i.test(textOf(card.querySelector('.card__title')));
}

export function collectCurrentModule(modulesRef, routeGetter) {
  const id = typeof routeGetter === 'function' ? routeGetter() : currentRoute();
  const module = modulesRef?.get?.(id);
  const app = document.getElementById('app');
  const cards = [...(app?.querySelectorAll('.card') || [])];
  const sections = [];
  let chartSvg = '';
  let chartCanvas = null;

  cards.forEach(card => {
    const title = textOf(card.querySelector(':scope > .card__title'));
    if (!title) return;
    const rows = extractCardRows(card);
    if (isChartCard(card)) {
      const svg = card.querySelector('svg.hx-chart, .hx-chart svg, svg');
      const canvas = card.querySelector('canvas');
      chartSvg = svg ? svg.outerHTML : chartSvg;
      chartCanvas = canvas || chartCanvas;
      if (rows.length) sections.push({ title: `${title} - Prozesspunkte`, rows });
      return;
    }
    if (rows.length) sections.push({ title, rows });
  });

  if (!chartSvg) {
    const svg = app?.querySelector?.('svg.hx-chart, .hx-chart svg');
    chartSvg = svg ? svg.outerHTML : '';
  }
  if (!chartCanvas) chartCanvas = app?.querySelector?.('.hx-chart canvas, canvas.hx-chart') || null;

  return {
    id,
    title: module?.title || module?.config?.title || id || 'Modul',
    shortTitle: module?.shortTitle || module?.title || id || 'Modul',
    sections,
    chartSvg,
    chartCanvas
  };
}

export function sectionTitle(title) {
  const normalized = sanitizeText(title);
  if (/ergebnis\s*zusammenfassung/i.test(normalized)) return 'Zielzustand';
  return normalized;
}

export function isLineSectionTitle(title = '') {
  return /leitungsabschnitt|rohrauslegung|speicher|gespeicherte/i.test(sanitizeText(title));
}

export function lineSectionItems(rows = []) {
  const items = [];
  let current = [];
  let title = '';
  const hasRows = entryRows => entryRows.some(row => row.some(cell => sanitizeText(cell)));
  const pushCurrent = () => {
    if (!hasRows(current)) return;
    const index = items.length + 1;
    const cleanTitle = sanitizeText(title) || `Leitungsabschnitt ${index}`;
    items.push({ title: cleanTitle, rows: current });
    current = [];
    title = '';
  };

  rows.forEach(row => {
    const label = sanitizeText(row?.[0] || '');
    const value = sanitizeText(row?.[1] || '');
    const unit = sanitizeText(row?.[2] || '');
    const key = normalizeKey(label);
    if ((key === 'bezeichnung' && current.length) || (key === 'leistung' && current.some(entry => normalizeKey(entry?.[0] || '') === 'leistung'))) pushCurrent();
    if (key === 'bezeichnung') {
      title = value || title;
      if (value) current.push(['Bezeichnung', value, '']);
      return;
    }
    if (label || value || unit) current.push([label, value, unit]);
  });
  pushCurrent();
  if (!items.length && hasRows(rows)) items.push({ title: 'Leitungsabschnitt 1', rows });
  return items;
}

function normalizePdfRows(rows = [], title = '') {
  const normalizedTitle = normalizeKey(title);
  const seenGenericLabels = new Map();
  return rows
    .map(row => row.slice(0, 3).map(cell => sanitizeText(cell).replace(/^Sättigung$/i, 'Adiabate Befeuchtung').replace(/Parameter/g, 'Bezeichnung')))
    .map(row => {
      const key = normalizeKey(row?.[0] || '');
      if (normalizedTitle.includes('gespeicherte') && key === 'bezeichnung') {
        const count = (seenGenericLabels.get(key) || 0) + 1;
        seenGenericLabels.set(key, count);
        return [count === 1 ? 'Bezeichnung' : `Bezeichnung ${count}`, row?.[1] || '', row?.[2] || ''];
      }
      return row;
    });
}

export function reportSections(moduleData) {
  const isHxDiagram = /hx|h,x/i.test(`${moduleData.id || ''} ${moduleData.title || ''}`);
  const hasLineSections = !isHxDiagram && moduleData.sections.some(section => isLineSectionTitle(sectionTitle(section.title)));
  const printableSections = hasLineSections ? moduleData.sections.filter(section => isLineSectionTitle(sectionTitle(section.title))) : moduleData.sections;
  return printableSections.map(section => {
    const title = sectionTitle(section.title).replace(/Parameter/g, 'Bezeichnung');
    const rows = normalizePdfRows(section.rows, title);
    return { title, rows, isLineSection: isLineSectionTitle(title) };
  });
}

export function pdfFileName(moduleData) {
  const safeTitle = sanitizeText(moduleData.shortTitle || moduleData.title || 'Berechnung').replace(/[^a-z0-9äöüß -]+/gi, '').trim() || 'Berechnung';
  return `TechCalc Pro - ${safeTitle}.pdf`;
}
