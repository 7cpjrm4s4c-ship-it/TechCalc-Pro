export const GENERIC_TYPED_DTO_REPORT_TYPE = 'techcalc.generic-module.report';
export const GENERIC_TYPED_DTO_REPORT_VERSION = 1;

const EMPTY_VALUE = '—';

const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function hasDisplayValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function labelFromKey(key = '') {
  return String(key || 'Wert')
    .replace(/([a-zäöüß0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, char => char.toUpperCase());
}

function valueToText(value) {
  if (value === true) return 'Ja';
  if (value === false) return 'Nein';
  if (value == null || value === '') return '';
  if (Array.isArray(value)) {
    if (!value.length) return '';
    if (value.every(item => item == null || typeof item !== 'object')) {
      return value.map(valueToText).filter(Boolean).join(', ');
    }
    return `${value.length} Einträge`;
  }
  if (typeof value === 'object') {
    const preferred = value.label ?? value.name ?? value.title ?? value.value ?? value.text;
    if (preferred !== undefined && preferred !== value) return valueToText(preferred);
    const primitiveEntries = Object.entries(value)
      .filter(([, entryValue]) => entryValue == null || typeof entryValue !== 'object')
      .filter(([, entryValue]) => hasDisplayValue(entryValue));
    if (!primitiveEntries.length) return '';
    return primitiveEntries
      .map(([key, entryValue]) => `${labelFromKey(key)}: ${valueToText(entryValue)}`)
      .join(' · ');
  }
  return String(value);
}

function optionLabel(field = {}, value) {
  const option = array(field.options).find(item => String(item?.value ?? item) === String(value));
  if (!option || typeof option !== 'object') return valueToText(value);
  return valueToText(option.label ?? option.text ?? option.value ?? value);
}

function isFieldVisible(field = {}, snapshot = {}) {
  if (typeof field.visibleWhen === 'function') {
    try { return field.visibleWhen(snapshot); } catch { return false; }
  }
  if (typeof field.when === 'function') {
    try { return field.when(snapshot); } catch { return false; }
  }
  return true;
}

function readFieldValue(field = {}, snapshot = {}) {
  const key = field.name || field.id || field.key;
  if (!key) return undefined;
  if (typeof field.read === 'function') {
    try { return field.read(snapshot); } catch { return undefined; }
  }
  if (field.type === 'stats' && typeof field.items === 'function') return field.items(snapshot);
  return snapshot[key];
}

function schemaInputRows(schema = {}, snapshot = {}) {
  return array(schema.fields)
    .filter(field => isFieldVisible(field, snapshot))
    .map(field => {
      const value = readFieldValue(field, snapshot);
      const text = optionLabel(field, value);
      return [field.label || field.title || labelFromKey(field.name || field.id || field.key), text || EMPTY_VALUE, field.unit || ''];
    })
    .filter(row => row.some(hasDisplayValue));
}

function normalizeRow(row = []) {
  if (Array.isArray(row)) return row.slice(0, 3).map(valueToText);
  if (row && typeof row === 'object') {
    return [
      valueToText(row.label ?? row.name ?? row.title ?? 'Eintrag'),
      valueToText(row.value ?? row.text ?? EMPTY_VALUE),
      valueToText(row.unit ?? '')
    ];
  }
  return ['Eintrag', valueToText(row), ''];
}

function rowsFromObject(source = {}, prefix = '') {
  return Object.entries(object(source)).flatMap(([key, value]) => {
    if (!hasDisplayValue(value)) return [];
    const label = prefix ? `${prefix} ${labelFromKey(key)}` : labelFromKey(key);
    if (Array.isArray(value)) {
      if (!value.length) return [];
      if (value.every(item => item == null || typeof item !== 'object')) return [[label, valueToText(value), '']];
      return [[label, `${value.length} Einträge`, '']];
    }
    if (value && typeof value === 'object') {
      const nested = rowsFromObject(value, label);
      if (nested.length) return nested;
      return [];
    }
    return [[label, valueToText(value) || EMPTY_VALUE, '']];
  });
}

function rowsFromCard(card = {}) {
  const fields = array(card.fields || card.rows || card.items).map(normalizeRow).filter(row => row.some(hasDisplayValue));
  if (fields.length) return fields;
  return rowsFromObject(card.values || card.data || card);
}

function sectionFromCard(card = {}, index = 0) {
  return {
    title: card.title || card.label || `Ergebnis ${index + 1}`,
    rows: rowsFromCard(card)
  };
}

function resultModelSections(resultModel) {
  if (!resultModel) return [];
  if (Array.isArray(resultModel.sections)) return resultModel.sections.map(sectionFromCard);
  if (Array.isArray(resultModel.groups)) return resultModel.groups.map(sectionFromCard);
  if (Array.isArray(resultModel.cards)) return resultModel.cards.map(sectionFromCard);
  if (resultModel.primary) return [sectionFromCard(resultModel.primary)];
  return [{ title: 'Ergebnis', rows: rowsFromObject(resultModel) }].filter(section => section.rows.length);
}

function calculationSections(calculation, calculationCached) {
  if (calculationCached && calculation && typeof calculation === 'object') {
    const rows = rowsFromObject(calculation);
    if (rows.length) return [{ title: 'Berechnungsstand', rows }];
  }
  return [{
    title: 'Berechnungsstand',
    rows: [[
      'Status',
      'Keine zwischengespeicherte Berechnung verfügbar. Der PDF-Export führt keine Neuberechnung aus.',
      ''
    ]]
  }];
}

function savedRecordBaseTitle(key = '') {
  return labelFromKey(key)
    .replace(/^Saved\s+/i, 'Gespeicherte ')
    .replace(/\bPipes\b/i, 'Rohrauslegungen')
    .replace(/\bBuffers\b/i, 'Pufferspeicher')
    .replace(/\bPlants\b/i, 'Anlagen')
    .replace(/\bCalculations\b/i, 'Berechnungen')
    .replace(/\bLine Sections\b/i, 'Leitungsabschnitte')
    .replace(/\bRecords\b/i, 'Records')
    .trim();
}

function savedRecordTitle(record = {}, index = 0, key = '') {
  const fallback = savedRecordBaseTitle(key).replace(/^Gespeicherte\s+/i, '').replace(/e?n$/i, '') || 'Record';
  return valueToText(record.name ?? record.title ?? record.label ?? record.state?.name ?? record.state?.pipeName ?? record.state?.plantName ?? record.state?.bufferName) || `${fallback} ${index + 1}`;
}

function savedRecordRows(record = {}) {
  if (Array.isArray(record.rows)) return record.rows.map(normalizeRow).filter(row => row.some(hasDisplayValue));
  if (record.result && typeof record.result === 'object') {
    const resultRows = rowsFromObject(record.result);
    if (resultRows.length) return resultRows;
  }
  if (record.state && typeof record.state === 'object') {
    const stateRows = rowsFromObject(record.state).filter(row => !/^Saved\s+/i.test(row[0] || '') && !/^Active\s+/i.test(row[0] || '') && !/^Expanded\s+/i.test(row[0] || ''));
    if (stateRows.length) return stateRows;
  }
  return rowsFromObject(record).filter(row => !/^State\s+/i.test(row[0] || '') && !/^Result\s+/i.test(row[0] || ''));
}

function savedRecordSections(snapshot = {}) {
  return Object.entries(object(snapshot)).flatMap(([key, value]) => {
    if (!/^saved[A-Z].*s$/.test(key) || !Array.isArray(value) || !value.length) return [];
    const baseTitle = savedRecordBaseTitle(key);
    return value.map((record, index) => ({
      title: `${baseTitle}: ${savedRecordTitle(record, index, key)}`,
      rows: savedRecordRows(record),
      isLineSection: true
    })).filter(section => section.rows.length);
  });
}

export function buildGenericModuleReportDto({
  config = {},
  schema = {},
  state = {},
  calculation = {},
  resultModel = null,
  generatedAt = new Date().toISOString(),
  calculationCached = false
} = {}) {
  const inputRows = schemaInputRows(schema, state);
  const inputSection = {
    title: 'Eingaben',
    rows: inputRows.length ? inputRows : [['Eingaben', 'Keine Eingaben im Modul-Schema verfügbar', '']]
  };
  const resultSections = resultModelSections(resultModel);
  const sections = [
    inputSection,
    ...(resultSections.length ? resultSections : calculationSections(calculation, calculationCached)),
    ...savedRecordSections(state)
  ];
  return Object.freeze({
    metadata: Object.freeze({
      dtoType: GENERIC_TYPED_DTO_REPORT_TYPE,
      dtoVersion: GENERIC_TYPED_DTO_REPORT_VERSION,
      moduleId: config.id || 'module',
      moduleTitle: config.title || config.shortTitle || 'Modul',
      reportHeading: config.title || config.shortTitle || 'Modul',
      generatedAt,
      calculationCached: Boolean(calculationCached)
    }),
    summary: Object.freeze({
      title: config.title || config.shortTitle || 'Modul',
      status: calculationCached ? 'Berechnungsstand aus Modulzustand übernommen' : 'Berechnungsstand nicht verfügbar',
      description: 'PDF-Daten werden ausschließlich aus dem Typed-DTO-Adapter des Moduls bereitgestellt.'
    }),
    input: Object.freeze({}),
    sections: Object.freeze(sections),
    sources: Object.freeze([])
  });
}

export function createTypedDtoReportAdapter({
  config = {},
  schema = {},
  state,
  calculate,
  results,
  buildReportDto
} = {}) {
  let latestCalculation = null;
  let latestResultModel = null;
  let latestSnapshot = null;
  let latestRevision = null;

  function readRevision() {
    return typeof state?.getRevision === 'function' ? state.getRevision() : null;
  }

  function calculateAndCache(snapshot = {}) {
    if (typeof calculate !== 'function') return {};
    const calculation = calculate(snapshot);
    latestSnapshot = clone(snapshot);
    latestCalculation = clone(calculation);
    latestRevision = readRevision();
    latestResultModel = null;
    if (typeof results === 'function') {
      latestResultModel = clone(results(snapshot, calculation));
    }
    return calculation;
  }

  function report(snapshot = state?.get?.() || latestSnapshot || {}) {
    const currentSnapshot = clone(snapshot || latestSnapshot || {});
    const calculation = clone(latestCalculation || {});
    const resultModel = clone(latestResultModel || null);
    const calculationCached = Boolean(latestCalculation);
    const context = {
      config,
      schema,
      state: currentSnapshot,
      calculation,
      resultModel,
      calculationCached,
      calculationCacheRevision: latestRevision,
      generatedAt: new Date().toISOString()
    };
    if (typeof buildReportDto === 'function') return buildReportDto(context);
    return buildGenericModuleReportDto(context);
  }

  return Object.freeze({
    calculate: calculateAndCache,
    report
  });
}

export default createTypedDtoReportAdapter;
