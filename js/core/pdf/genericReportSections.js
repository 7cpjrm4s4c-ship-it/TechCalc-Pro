import { sanitizeText, normalizeKey } from './pdfText.js';

function array(value) {
  return Array.isArray(value) ? value : [];
}

function rowFromField(field = {}) {
  return [field.label || field.title || field.key || '', field.value ?? field.text ?? '', field.unit || ''];
}

function rowsFromObject(values = {}) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return [];
  return Object.entries(values).map(([key, value]) => [key, value ?? '', '']);
}

function sectionRows(section = {}) {
  if (Array.isArray(section.rows)) return section.rows;
  if (Array.isArray(section.fields)) return section.fields.map(rowFromField);
  if (Array.isArray(section.items)) return section.items.map(rowFromField);
  if (section.values && typeof section.values === 'object') return rowsFromObject(section.values);
  if (section.data && typeof section.data === 'object') return rowsFromObject(section.data);
  return [];
}

function rowsFromResultCard(card = {}) {
  const rows = [];
  if (card.primary?.label || card.primary?.value) rows.push(rowFromField(card.primary));
  array(card.rows).forEach(row => rows.push(rowFromField(row)));
  array(card.items).forEach(row => rows.push(rowFromField(row)));
  array(card.fields).forEach(row => rows.push(rowFromField(row)));
  if (!rows.length && card.values && typeof card.values === 'object') rows.push(...rowsFromObject(card.values));
  if (!rows.length && card.data && typeof card.data === 'object') rows.push(...rowsFromObject(card.data));
  return rows;
}

function resultGroupSections(reportDto = {}) {
  return array(reportDto.resultGroups).map((group, index) => {
    const rows = [];
    array(group.cards).forEach(card => rows.push(...rowsFromResultCard(card)));
    array(group.rows).forEach(row => rows.push(rowFromField(row)));
    return {
      title: group.title || `Ergebnis ${index + 1}`,
      rows,
      isLineSection: Boolean(group.isLineSection),
      chartIndex: group.chartIndex,
      chartTitle: group.chartTitle
    };
  });
}

function providedSections(reportDto = {}) {
  if (array(reportDto.sections).length) return array(reportDto.sections);
  const groups = resultGroupSections(reportDto).filter(section => sectionRows(section).length);
  if (groups.length) return groups;
  const sections = [];
  if (reportDto.input && typeof reportDto.input === 'object') sections.push({ title: 'Eingaben', rows: rowsFromObject(reportDto.input) });
  if (reportDto.outputs && typeof reportDto.outputs === 'object') sections.push({ title: 'Berechnungsergebnisse', rows: rowsFromObject(reportDto.outputs) });
  return sections;
}

function hasDesignation(rows = []) {
  return rows.some(row => {
    const key = normalizeKey(row?.[0] || '');
    return key === 'bezeichnung' || /^bezeichnung\s*\d+$/.test(key);
  });
}

function isSavedOrRecordSection(section = {}) {
  const titleKey = normalizeKey(section.title || '');
  return /gespeicherte|saved|leitungsabschnitt|rohrauslegung|pufferspeicher|druckhaltung|mischluft|waermerueckgewinnung|wrg|trinkwasser|schmutzwasser|h x prozess|hx prozess/.test(titleKey);
}

function isMetadataSection(section = {}) {
  const titleKey = normalizeKey(section.title || '');
  return /berichtszusammenfassung|datenversionen|datenstand und berichtserstellung/.test(titleKey);
}

function cleanRows(rows = []) {
  const seen = new Set();
  return rows
    .map(row => [
      sanitizeText(row?.[0] ?? ''),
      sanitizeText(row?.[1] ?? ''),
      sanitizeText(row?.[2] ?? '')
    ])
    .filter(row => row.some(Boolean))
    .filter(row => {
      const signature = row.map(cell => normalizeKey(cell)).join('|');
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
}

function toSection(section = {}, index = 0, forceLine = false) {
  const rows = cleanRows(sectionRows(section));
  const lineSection = forceLine || section.isLineSection || hasDesignation(rows) || isSavedOrRecordSection(section);
  return {
    ...section,
    title: sanitizeText(section.title || `Abschnitt ${index + 1}`),
    rows,
    isLineSection: Boolean(lineSection)
  };
}

function reportSummarySection(reportDto = {}) {
  const metadata = reportDto.metadata || {};
  return {
    title: '1. Berichtszusammenfassung',
    rows: [
      ['Bericht', metadata.reportHeading || 'Berechnungsprotokoll', ''],
      ['Modul', metadata.moduleTitle || '-', ''],
      ['Berichtsquelle', 'TechCalc Pro', '']
    ],
    isLineSection: false
  };
}

function inputSection(reportDto = {}) {
  const rows = reportDto.input && typeof reportDto.input === 'object' ? rowsFromObject(reportDto.input) : [];
  return {
    title: '2. Eingaben',
    rows,
    isLineSection: false
  };
}

function fallbackSummary(reportDto = {}) {
  return [reportSummarySection(reportDto)];
}

export function buildGenericReportSections(reportDto = {}) {
  const rawSections = providedSections(reportDto).filter(section => !isMetadataSection(section));
  const recordSections = rawSections.filter(section => isSavedOrRecordSection(section) || section.isLineSection || hasDesignation(sectionRows(section)));
  const moduleId = normalizeKey(reportDto?.metadata?.moduleId || reportDto?.metadata?.moduleTitle || '');
  const keepAllSections = /hx|h x/.test(moduleId);
  const selectedSections = !keepAllSections && recordSections.length ? recordSections : rawSections;
  const sections = selectedSections
    .map((section, index) => toSection(section, index, !keepAllSections && Boolean(recordSections.length)))
    .filter(section => section.rows.length);

  if (!sections.length) return fallbackSummary(reportDto);

  const prefixedSections = [reportSummarySection(reportDto)];
  const inputs = toSection(inputSection(reportDto), 1, false);
  if (inputs.rows.length) prefixedSections.push(inputs);
  return [...prefixedSections, ...sections];
}
