import { currentRoute } from '../router.js';
import { sanitizeText, normalizeKey } from './pdfText.js';
import { buildFloodingReportSections } from './floodingReportSections.js';
import { buildRainwaterReportSections } from './rainwaterReportSections.js';
import { buildFGasesReportSections } from './fGasesReportSections.js';
import { buildEN378ReportSections } from './en378ReportSections.js';
import { buildGenericReportSections } from './genericReportSections.js';

function resolveRuntimeModule(registryEntry) {
  return registryEntry?.module?.loadedModule || registryEntry?.module || registryEntry?.loadedModule || registryEntry;
}

function isSpecialReportHeadingModule(id = '', reportDto = {}) {
  const identity = `${id || ''} ${reportDto?.metadata?.moduleId || ''} ${reportDto?.metadata?.moduleTitle || ''} ${reportDto?.metadata?.dtoType || ''}`;
  return /flooding-verification|hx|h,x/i.test(identity);
}

function normalizeCollectedReportDto(reportDto, id) {
  if (isSpecialReportHeadingModule(id, reportDto)) return reportDto;
  return {
    ...reportDto,
    metadata: {
      ...reportDto.metadata,
      reportHeading: 'Berechnungsprotokoll'
    }
  };
}

function isDesignationKey(key = '') {
  return key === 'bezeichnung' || /^bezeichnung\d+$/.test(key);
}

export function collectCurrentModule(modulesRef, routeGetter) {
  const id = typeof routeGetter === 'function' ? routeGetter() : currentRoute();
  const registryEntry = modulesRef?.get?.(id);
  const module = resolveRuntimeModule(registryEntry);
  const report = module?.report || registryEntry?.report;
  const state = module?.state || registryEntry?.state;

  if (typeof report !== 'function') {
    throw new Error(`PDF-Report-Adapter für ${id || 'das aktuelle Modul'} fehlt. Legacy-DOM-Export ist deaktiviert.`);
  }

  const snapshot = state?.get?.() || {};
  const reportDto = report(snapshot);
  if (!reportDto || typeof reportDto !== 'object' || !reportDto.metadata?.dtoType) {
    throw new Error(`PDF-Report-Adapter für ${id || 'das aktuelle Modul'} lieferte kein gültiges Typed-DTO.`);
  }

  const normalizedReportDto = normalizeCollectedReportDto(reportDto, id);

  return {
    id,
    title: registryEntry?.title || module?.title || module?.config?.title || normalizedReportDto.metadata?.moduleTitle || id || 'Modul',
    shortTitle: registryEntry?.shortTitle || module?.shortTitle || module?.config?.shortTitle || normalizedReportDto.metadata?.moduleTitle || id || 'Modul',
    sections: [],
    chartSvg: '',
    chartCanvas: null,
    reportDto: normalizedReportDto,
    reportSource: 'typed-dto'
  };
}

export function sectionTitle(title) {
  const normalized = sanitizeText(title);
  if (/ergebnis\s*zusammenfassung/i.test(normalized)) return 'Zielzustand';
  return normalized;
}

export function isLineSectionTitle(title = '') { return /leitungsabschnitt|rohrauslegung|speicher|gespeicherte/i.test(sanitizeText(title)); }

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
    const isDesignation = isDesignationKey(key);
    if ((isDesignation && current.length) || (key === 'leistung' && current.some(entry => normalizeKey(entry?.[0] || '') === 'leistung'))) pushCurrent();
    if (isDesignation) {
      title = value || title;
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

const typedReportSectionBuilders = Object.freeze({
  'techcalc.flooding-verification.report': buildFloodingReportSections,
  'techcalc.rainwater.report': buildRainwaterReportSections,
  'techcalc.f-gases-check.report': buildFGasesReportSections,
  'techcalc.en-378-safety-check.report': buildEN378ReportSections
});

function buildTypedDtoReportSections(reportDto = {}) {
  const dtoType = reportDto.metadata?.dtoType;
  const buildSections = typedReportSectionBuilders[dtoType] || buildGenericReportSections;
  return buildSections(reportDto);
}

export function reportSections(moduleData) {
  if (moduleData?.reportSource !== 'typed-dto' || !moduleData.reportDto) {
    throw new Error('PDF-Export benötigt ein Typed-DTO. Legacy-DOM-Export ist deaktiviert.');
  }
  const sections = buildTypedDtoReportSections(moduleData.reportDto);
  return sections.map(section => ({ ...section, rows: normalizePdfRows(section.rows, section.title) }));
}

export function pdfFileName(moduleData = {}) {
  const safeTitle = sanitizeText(moduleData.shortTitle || moduleData.title || 'Berechnung').replace(/[^a-z0-9äöüß -]+/gi, '').trim() || 'Berechnung';
  return `TechCalc Pro - ${safeTitle}.pdf`;
}
