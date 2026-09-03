export const GENERIC_TYPED_DTO_REPORT_TYPE = 'techcalc.generic-module.report';
export const GENERIC_TYPED_DTO_REPORT_VERSION = 1;

const EMPTY_VALUE = '—';

const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const LABELS = Object.freeze({
  section: 'Abschnitt',
  system: 'Rohrsystem',
  systemId: 'Rohrsystem',
  systemLabel: 'Rohrsystem',
  norm: 'Norm',
  normSmall: 'Norm',
  normLarge: 'Norm',
  dn: 'Nennweite',
  maxDn: 'Maximale Nennweite',
  dimension: 'Rohrabmessung',
  di: 'Innendurchmesser',
  velocity: 'Geschwindigkeit',
  pressureLoss: 'Druckverlust',
  maxPressurePam: 'Maximaler Druckverlust',
  volumeFlowM3h: 'Volumenstrom',
  massFlowKgh: 'Massenstrom',
  powerKw: 'Leistung',
  deltaT: 'Temperaturdifferenz',
  rho: 'Dichte',
  cp: 'Spezifische Wärmekapazität',
  factor: 'Faktor',
  index: 'Tabellenindex',
  roughness: 'Rauheit',
  ratingKey: 'Bewertungsstufe',
  ratingLabel: 'Bewertung',
  noDimension: 'Dimensionierung möglich',
  water: 'Wasser',
  steel: 'Stahl',
  pressureLossPaM: 'Druckverlust',
  massFlow: 'Massenstrom',
  volumeFlow: 'Volumenstrom',
  temperatureDifference: 'Temperaturdifferenz'
});

const UNITS_BY_KEY = Object.freeze({
  velocity: 'm/s',
  pressureLoss: 'Pa/m',
  pressureLossPaM: 'Pa/m',
  maxPressurePam: 'Pa/m',
  volumeFlowM3h: 'm³/h',
  volumeFlow: 'm³/h',
  massFlowKgh: 'kg/h',
  massFlow: 'kg/h',
  powerKw: 'kW',
  deltaT: 'K',
  temperatureDifference: 'K',
  rho: 'kg/m³',
  cp: 'kJ/(kg·K)',
  di: 'mm',
  roughness: 'mm'
});

const INTERNAL_KEYS = new Set([
  'smaller',
  'larger',
  'dimensions',
  'rating',
  'state',
  'result',
  'savedPipes',
  'savedBuffers',
  'savedPlants',
  'savedCalculations',
  'activeSavedRecordId',
  'expandedSavedRecordId'
]);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function hasDisplayValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function normalizeLookupKey(key = '') {
  return String(key || '')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]+/g, ' ')
    .trim()
    .replace(/\s+([a-zA-Z0-9äöüÄÖÜß])/g, (_, char) => char.toUpperCase())
    .replace(/^./, char => char.toLowerCase());
}

function labelFromKey(key = '') {
  const lookupKey = normalizeLookupKey(key);
  if (LABELS[lookupKey]) return LABELS[lookupKey];
  return String(key || 'Wert')
    .replace(/([a-zäöüß0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\bM3h\b/g, 'm³/h')
    .replace(/\bKgh\b/g, 'kg/h')
    .replace(/\bPam\b/g, 'Pa/m')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, char => char.toUpperCase());
}

function normalizeUnit(unit = '') {
  return String(unit || '')
    .replace(/m3\/h|m³h|m3h/gi, 'm³/h')
    .replace(/kg\/h|kgh/gi, 'kg/h')
    .replace(/pa\/m|pam/gi, 'Pa/m')
    .replace(/kw/g, 'kW')
    .replace(/°c/gi, '°C')
    .replace(/\s+/g, ' ')
    .trim();
}

function unitFromKey(key = '') {
  return UNITS_BY_KEY[normalizeLookupKey(key)] || '';
}

function formatNumber(value, fractionDigits = 2) {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

function shouldParseNumericString(value = '') {
  const text = String(value).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return false;
  const fraction = text.split('.')[1] || '';
  if (!fraction) return false;
  return !(fraction.length === 3 && /^0+$/.test(fraction));
}

function formatScalar(value) {
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'string' && shouldParseNumericString(value)) return formatNumber(Number(value));
  return String(value);
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
  return formatScalar(value);
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
      return [field.label || field.title || labelFromKey(field.name || field.id || field.key), text || EMPTY_VALUE, normalizeUnit(field.unit || unitFromKey(field.name || field.id || field.key))];
    })
    .filter(row => row.some(hasDisplayValue));
}

function normalizeRow(row = []) {
  if (Array.isArray(row)) return row.slice(0, 3).map((cell, index) => index === 2 ? normalizeUnit(valueToText(cell)) : valueToText(cell));
  if (row && typeof row === 'object') {
    const label = row.label ?? row.name ?? row.title ?? 'Eintrag';
    return [
      labelFromKey(label),
      valueToText(row.value ?? row.text ?? EMPTY_VALUE),
      normalizeUnit(row.unit ?? unitFromKey(label))
    ];
  }
  return ['Eintrag', valueToText(row), ''];
}

function shouldSkipObjectKey(key = '') {
  return INTERNAL_KEYS.has(normalizeLookupKey(key));
}

function rowForPrimitive(key, value) {
  return [labelFromKey(key), valueToText(value) || EMPTY_VALUE, normalizeUnit(unitFromKey(key))];
}

function rowsFromObject(source = {}, prefix = '') {
  return Object.entries(object(source)).flatMap(([key, value]) => {
    if (shouldSkipObjectKey(key) || !hasDisplayValue(value)) return [];
    const label = prefix ? `${prefix} ${labelFromKey(key)}` : labelFromKey(key);
    if (Array.isArray(value)) {
      if (!value.length) return [];
      if (value.every(item => item == null || typeof item !== 'object')) return [[label, valueToText(value), normalizeUnit(unitFromKey(key))]];
      return [];
    }
    if (value && typeof value === 'object') {
      const preferred = value.label ?? value.name ?? value.title ?? value.value ?? value.text;
      if (preferred !== undefined && preferred !== value) return [[label, valueToText(preferred), normalizeUnit(unitFromKey(key))]];
      const nested = rowsFromObject(value, label);
      return nested.length ? nested : [];
    }
    return [rowForPrimitive(key, value)];
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
  const normalized = normalizeLookupKey(key);
  if (normalized === 'savedPipes') return 'Leitungsabschnitt';
  if (normalized === 'savedBuffers') return 'Pufferspeicher';
  if (normalized === 'savedPlants') return 'Anlage';
  if (normalized === 'savedCalculations') return 'Berechnung';
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
  const state = object(record.state);
  const result = object(record.result);
  const namedTitle = valueToText(record.name ?? record.title ?? record.label ?? state.name ?? state.pipeName ?? state.plantName ?? state.bufferName);
  if (namedTitle) return namedTitle;
  const system = valueToText(result.system?.label ?? result.systemLabel ?? state.system?.label ?? state.systemLabel ?? state.system);
  const dn = valueToText(result.dn ?? state.dn);
  if (system && dn) return `${system}, DN ${dn}`;
  const base = savedRecordBaseTitle(key) || 'Record';
  return `${base} ${index + 1}`;
}

function savedRecordRows(record = {}, index = 0, key = '') {
  const title = savedRecordTitle(record, index, key);
  const titleRow = ['Bezeichnung', title, ''];
  if (Array.isArray(record.rows)) return [titleRow, ...record.rows.map(normalizeRow).filter(row => row.some(hasDisplayValue))];
  if (record.result && typeof record.result === 'object') {
    const resultRows = rowsFromObject(record.result);
    if (resultRows.length) return [titleRow, ...resultRows];
  }
  if (record.state && typeof record.state === 'object') {
    const stateRows = rowsFromObject(record.state).filter(row => !/^Saved\s+/i.test(row[0] || '') && !/^Active\s+/i.test(row[0] || '') && !/^Expanded\s+/i.test(row[0] || ''));
    if (stateRows.length) return [titleRow, ...stateRows];
  }
  return [titleRow, ...rowsFromObject(record).filter(row => !/^State\s+/i.test(row[0] || '') && !/^Result\s+/i.test(row[0] || ''))];
}

function savedRecordSections(snapshot = {}) {
  return Object.entries(object(snapshot)).flatMap(([key, value]) => {
    if (!/^saved[A-Z].*s$/.test(key) || !Array.isArray(value) || !value.length) return [];
    return value.map((record, index) => ({
      title: savedRecordBaseTitle(key),
      rows: savedRecordRows(record, index, key),
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
