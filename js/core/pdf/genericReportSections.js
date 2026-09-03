import { sanitizeText } from './pdfText.js';

const EMPTY_VALUE = '—';

const LABELS = Object.freeze({
  dtoType: 'Report-Typ',
  dtoVersion: 'Report-Version',
  moduleId: 'Modul-ID',
  moduleTitle: 'Modul',
  reportHeading: 'Bericht',
  schemaVersion: 'Schema-Version',
  generatedAt: 'Erzeugt am',
  status: 'Status',
  inputComplete: 'Eingaben vollständig',
  inputIssues: 'Eingabehinweise',
  importedSystemName: 'Importierte Anlage',
  refrigerantId: 'Kältemittel',
  chargeKg: 'Füllmenge',
  roomVolumeM3: 'Raumvolumen',
  installationLocation: 'Aufstellort',
  accessArea: 'Zugangsbereich',
  usageType: 'Nutzung',
  ventilationType: 'Lüftung',
  hasGasWarningSystem: 'Gaswarnsystem',
  hasMachineryRoom: 'Maschinenraum',
  additionalSafetyMeasures: 'Weitere Sicherheitsmaßnahmen',
  requiredMeasures: 'Erforderliche Maßnahmen',
  notices: 'Hinweise'
});

const UNIT_BY_KEY = Object.freeze({
  chargeKg: 'kg',
  roomVolumeM3: 'm³'
});

const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function hasRawValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function labelFromKey(key = '') {
  const raw = String(key || '').trim();
  if (!raw) return '';
  if (LABELS[raw]) return LABELS[raw];

  const words = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!words) return raw;

  return sanitizeText(words.charAt(0).toUpperCase() + words.slice(1));
}

function valueToText(value) {
  if (!hasRawValue(value)) return EMPTY_VALUE;
  if (typeof value === 'boolean') return value ? 'ja' : 'nein';
  if (Array.isArray(value)) {
    const values = value.map(valueToText).filter(item => item && item !== EMPTY_VALUE);
    return values.length ? values.join(' · ') : EMPTY_VALUE;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, entryValue]) => hasRawValue(entryValue));
    if (!entries.length) return EMPTY_VALUE;
    return entries.map(([key, entryValue]) => `${labelFromKey(key)}: ${valueToText(entryValue)}`).join(' · ');
  }
  return sanitizeText(String(value));
}

function row(label, value, unit = '') {
  return [label, valueToText(value), unit];
}

function rowHasContent(reportRow = []) {
  return reportRow.some(cell => sanitizeText(cell || '').length > 0);
}

function normalizeReportRow(reportRow) {
  if (Array.isArray(reportRow)) {
    return [reportRow[0] ?? '', reportRow[1] ?? '', reportRow[2] ?? ''].map(cell => sanitizeText(cell));
  }
  if (reportRow && typeof reportRow === 'object') {
    const label = reportRow.label || reportRow.title || reportRow.key || '';
    const value = reportRow.value ?? reportRow.message ?? reportRow.text ?? '';
    return [label, valueToText(value), reportRow.unit || ''].map(cell => sanitizeText(cell));
  }
  return ['', valueToText(reportRow), ''].map(cell => sanitizeText(cell));
}

function normalizeRows(rows = []) {
  return array(rows)
    .map(normalizeReportRow)
    .filter(rowHasContent);
}

function rowsFromObject(value = {}, ignoredKeys = []) {
  const ignored = new Set(ignoredKeys);
  return Object.entries(object(value))
    .filter(([key]) => !ignored.has(key))
    .map(([key, entryValue]) => row(labelFromKey(key), entryValue, UNIT_BY_KEY[key] || ''));
}

function rowsFromArrayItems(label, values = []) {
  return array(values).map((item, index) => row(`${label} ${index + 1}`, item));
}

function addSection(sections, title, rows, options = {}) {
  const normalizedRows = normalizeRows(rows);
  if (!normalizedRows.length) return;

  sections.push({
    title: `${sections.length + 1}. ${sanitizeText(title) || 'Abschnitt'}`,
    rows: normalizedRows,
    isLineSection: false,
    ...options
  });
}

function summaryRows(dto) {
  const metadata = object(dto.metadata);
  const summary = object(dto.summary);
  const assessment = object(dto.assessment);

  return [
    row('Bericht', metadata.reportHeading || metadata.moduleTitle),
    row('Modul', metadata.moduleTitle || metadata.moduleId),
    row('Report-Typ', metadata.dtoType),
    row('Report-Version', metadata.dtoVersion),
    row('Schema-Version', metadata.schemaVersion),
    row('Status', summary.status),
    row('Eingaben vollständig', summary.inputComplete),
    row('Bewertung', assessment.status),
    row('Erzeugt am', metadata.generatedAt)
  ];
}

function assessmentRows(dto) {
  const assessment = object(dto.assessment);
  return [
    ...rowsFromObject(assessment, ['requiredMeasures', 'notices']),
    ...rowsFromArrayItems('Erforderliche Maßnahme', assessment.requiredMeasures),
    ...rowsFromArrayItems('Hinweis', assessment.notices)
  ];
}

function dataSourceRows(dto) {
  return [
    ...rowsFromObject(dto.dataVersions),
    ...rowsFromArrayItems('Quelle', dto.sources)
  ];
}

export function buildGenericReportSections(dto = {}) {
  const sections = [];

  addSection(sections, 'Berichtszusammenfassung', summaryRows(dto));
  addSection(sections, 'Eingaben', rowsFromObject(dto.input));

  for (const group of array(dto.resultGroups)) {
    addSection(sections, group?.title || 'Ergebnisse', group?.rows || [], {
      isLineSection: Boolean(group?.isLineSection),
      singleColumn: Boolean(group?.singleColumn),
      fullWidthRows: Boolean(group?.fullWidthRows)
    });
  }

  for (const section of array(dto.sections)) {
    addSection(sections, section?.title || 'Ergebnisse', section?.rows || [], {
      isLineSection: Boolean(section?.isLineSection),
      singleColumn: Boolean(section?.singleColumn),
      fullWidthRows: Boolean(section?.fullWidthRows)
    });
  }

  addSection(sections, 'Bewertung', assessmentRows(dto));
  addSection(sections, 'Datenversionen und Quellen', dataSourceRows(dto));

  if (!sections.length) addSection(sections, 'Report-DTO', rowsFromObject(dto));

  return sections;
}

export default buildGenericReportSections;
