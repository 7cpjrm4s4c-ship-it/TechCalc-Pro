export const GENERIC_TYPED_DTO_REPORT_TYPE = 'techcalc.generic-module.report';
export const GENERIC_TYPED_DTO_REPORT_VERSION = 1;

const EMPTY_VALUE = '—';

const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const LABELS = Object.freeze({
  id: 'ID',
  section: 'Abschnitt',
  name: 'Bezeichnung',
  label: 'Bezeichnung',
  title: 'Titel',
  createdAt: 'Erstellt am',
  updatedAt: 'Aktualisiert am',
  productLabel: 'Produkt',
  selectedVolume: 'Ausgewähltes Volumen',
  selectedStandardVolume: 'Standardvolumen',
  systemVolume: 'Anlagenvolumen',
  paMin: 'Mindestdruck',
  pe: 'Enddruck',
  p0: 'Vordruck',
  mode: 'Betriebsart',
  standard: 'Standard',
  medium: 'Medium',
  type: 'Typ',
  lineType: 'Leitungsart',
  flowUnits: 'Entwässerungsgegenstände',
  fixtureUnits: 'Berechnungsanschlusswerte',
  fixtureType: 'Einrichtungsgegenstand',
  fixture: 'Einrichtungsgegenstand',
  fixtures: 'Einrichtungsgegenstände',
  appliance: 'Einrichtungsgegenstand',
  appliances: 'Einrichtungsgegenstände',
  quantity: 'Anzahl',
  count: 'Anzahl',
  connectionUnit: 'Anschlusswert',
  drainageUnit: 'Abflusskennzahl',
  wastewaterFlow: 'Schmutzwasserabfluss',
  mixedAir: 'Mischluft',
  outsideAir: 'Außenluft',
  exhaustAir: 'Abluft',
  supplyAir: 'Zuluft',
  returnAir: 'Rückluft',
  temperature: 'Temperatur',
  tempC: 'Temperatur',
  relativeHumidity: 'Relative Feuchte',
  rhPercent: 'Relative Feuchte',
  humidity: 'Feuchte',
  enthalpy: 'Enthalpie',
  heatRecovery: 'Wärmerückgewinnung',
  efficiency: 'Wirkungsgrad',
  system: 'Rohrsystem',
  systemId: 'Rohrsystem',
  systemLabel: 'Rohrsystem',
  norm: 'Norm',
  normSmall: 'Norm',
  normLarge: 'Norm',
  dn: 'Nennweite',
  maxDn: 'Maximale Nennweite',
  dimension: 'Rohrabmessung',
  pipeDimension: 'Rohrabmessung',
  pipeSize: 'Rohrabmessung',
  di: 'Innendurchmesser',
  velocity: 'Geschwindigkeit',
  pressureLoss: 'Druckverlust',
  pressureLossPaM: 'Druckverlust',
  maxPressurePam: 'Maximaler Druckverlust',
  volumeFlowM3h: 'Volumenstrom',
  volumeFlow: 'Volumenstrom',
  massFlowKgh: 'Massenstrom',
  massFlow: 'Massenstrom',
  powerKw: 'Leistung',
  deltaT: 'Temperaturdifferenz',
  temperatureDifference: 'Temperaturdifferenz',
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
  process: 'Prozess',
  processLabel: 'Prozess',
  processes: 'Prozesse',
  airVolumeM3h: 'Luftvolumenstrom',
  targetTempC: 'Zieltemperatur',
  targetRhPercent: 'Ziel-Feuchte',
  heatingSupplyTempC: 'Heizung Vorlauf',
  heatingReturnTempC: 'Heizung Rücklauf',
  coolingSupplyTempC: 'Kälte Vorlauf',
  coolingReturnTempC: 'Kälte Rücklauf'
});

const VALUE_LABELS = Object.freeze({
  yes: 'Ja',
  no: 'Nein',
  true: 'Ja',
  false: 'Nein',
  defrost: 'Abtauung',
  reserve: 'Wasservorlage',
  runtime: 'Mindestlaufzeit',
  heating: 'Heizung',
  cooling: 'Kühlung',
  heat: 'Heizen',
  cool: 'Kühlen',
  humidify: 'Befeuchten',
  dehumidify: 'Entfeuchten',
  adiabaticHumidification: 'Adiabate Befeuchtung',
  mixing: 'Mischung',
  standard: 'Standard',
  water: 'Wasser',
  steel: 'Stahl',
  copper: 'Kupfer',
  stainlessSteel: 'Edelstahl',
  mapressStainlessSteel: 'Mapress Edelstahl',
  stack: 'Fallleitung',
  branch: 'Anschlussleitung',
  collector: 'Sammelleitung',
  medium: 'Medium',
  small: 'Klein',
  large: 'Groß',
  red: 'rot',
  green: 'grün',
  yellow: 'gelb'
});

const UNITS_BY_KEY = Object.freeze({
  velocity: 'm/s',
  pressureLoss: 'Pa/m',
  pressureLossPaM: 'Pa/m',
  maxPressurePam: 'Pa/m',
  volumeFlowM3h: 'm³/h',
  volumeFlow: 'm³/h',
  airVolumeM3h: 'm³/h',
  massFlowKgh: 'kg/h',
  massFlow: 'kg/h',
  powerKw: 'kW',
  deltaT: 'K',
  temperatureDifference: 'K',
  temperature: '°C',
  tempC: '°C',
  targetTempC: '°C',
  heatingSupplyTempC: '°C',
  heatingReturnTempC: '°C',
  coolingSupplyTempC: '°C',
  coolingReturnTempC: '°C',
  relativeHumidity: '%',
  rhPercent: '%',
  targetRhPercent: '%',
  rho: 'kg/m³',
  cp: 'kJ/(kg·K)',
  di: 'mm',
  roughness: 'mm',
  selectedVolume: 'l',
  selectedStandardVolume: 'l',
  systemVolume: 'l',
  paMin: 'bar',
  pe: 'bar',
  p0: 'bar',
  flowUnits: 'DU',
  fixtureUnits: 'DU',
  wastewaterFlow: 'l/s'
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
  'savedProcesses',
  'activeSavedRecordId',
  'expandedSavedRecordId',
  'activeProcessId',
  'expandedProcessId',
  'points',
  'path'
]);

const HIDDEN_ROW_KEYS = new Set(['id', 'createdAt', 'updatedAt']);

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
    .replace(/\bId\b/g, 'ID')
    .replace(/\bM3h\b/g, 'm³/h')
    .replace(/\bKgh\b/g, 'kg/h')
    .replace(/\bPam\b/g, 'Pa/m')
    .replace(/\bDn\b/g, 'DN')
    .replace(/\bRh\b/g, 'relative Feuchte')
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

function valueLabel(value) {
  if (typeof value !== 'string') return null;
  const lookup = normalizeLookupKey(value);
  return VALUE_LABELS[lookup] || null;
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
  return valueLabel(value) || String(value);
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
    return value.map((item, index) => `${index + 1}. ${valueToText(item)}`).filter(Boolean).join(' · ');
  }
  if (typeof value === 'object') {
    const preferred = value.label ?? value.name ?? value.title ?? value.value ?? value.text;
    if (preferred !== undefined && preferred !== value) return valueToText(preferred);
    const primitiveEntries = Object.entries(value)
      .filter(([key]) => !HIDDEN_ROW_KEYS.has(normalizeLookupKey(key)))
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
      const fieldKey = field.name || field.id || field.key;
      const value = readFieldValue(field, snapshot);
      const text = optionLabel(field, value);
      return [field.label || field.title || labelFromKey(fieldKey), text || EMPTY_VALUE, normalizeUnit(field.unit || unitFromKey(fieldKey))];
    })
    .filter(row => row.some(hasDisplayValue));
}

function normalizeRow(row = []) {
  if (Array.isArray(row)) {
    const label = row[0] ?? '';
    return [labelFromKey(label), valueToText(row[1] ?? EMPTY_VALUE), normalizeUnit(row[2] ?? unitFromKey(label))];
  }
  if (row && typeof row === 'object') {
    const label = row.label ?? row.name ?? row.title ?? row.key ?? 'Eintrag';
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

function rowsFromObjectArray(key, values = []) {
  const label = labelFromKey(key).replace(/e$/, '');
  return values.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const title = valueToText(item.name ?? item.label ?? item.title ?? item.type ?? item.fixtureType ?? item.appliance ?? item.objectType) || `${label} ${index + 1}`;
    const rows = rowsFromObject(item).filter(row => normalizeLookupKey(row[0]) !== 'bezeichnung');
    return [
      ['Bezeichnung', title, ''],
      ...rows
    ];
  });
}

function rowsFromObject(source = {}, prefix = '') {
  return Object.entries(object(source)).flatMap(([key, value]) => {
    const normalizedKey = normalizeLookupKey(key);
    if (shouldSkipObjectKey(key) || HIDDEN_ROW_KEYS.has(normalizedKey) || !hasDisplayValue(value)) return [];
    const label = prefix ? `${prefix} ${labelFromKey(key)}` : labelFromKey(key);
    if (Array.isArray(value)) {
      if (!value.length) return [];
      if (value.every(item => item == null || typeof item !== 'object')) return [[label, valueToText(value), normalizeUnit(unitFromKey(key))]];
      return rowsFromObjectArray(key, value);
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
  if (normalized === 'savedProcesses') return 'h,x-Prozess';
  if (/fixture|appliance|sanitary|object|line|section/i.test(key)) return 'Einrichtungsgegenstand';
  return labelFromKey(key)
    .replace(/^Saved\s+/i, 'Gespeicherte ')
    .replace(/\bPipes\b/i, 'Rohrauslegungen')
    .replace(/\bBuffers\b/i, 'Pufferspeicher')
    .replace(/\bPlants\b/i, 'Anlagen')
    .replace(/\bCalculations\b/i, 'Berechnungen')
    .replace(/\bProcesses\b/i, 'Prozesse')
    .replace(/\bLine Sections\b/i, 'Leitungsabschnitte')
    .replace(/\bRecords\b/i, 'Records')
    .trim();
}

function savedRecordTitle(record = {}, index = 0, key = '') {
  const state = object(record.state ?? record.input);
  const result = object(record.result);
  const namedTitle = valueToText(record.name ?? record.title ?? record.label ?? state.name ?? state.label ?? state.pipeName ?? state.plantName ?? state.bufferName);
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
  if (record.input && typeof record.input === 'object') {
    const inputRows = rowsFromObject(record.input);
    if (inputRows.length) return [titleRow, ...inputRows];
  }
  if (record.state && typeof record.state === 'object') {
    const stateRows = rowsFromObject(record.state);
    if (stateRows.length) return [titleRow, ...stateRows];
  }
  return [titleRow, ...rowsFromObject(record)];
}

function isLineSectionRecordKey(key = '') {
  const normalized = normalizeLookupKey(key);
  return normalized === 'savedPipes' || /lineSections|pipe/i.test(key);
}

function savedRecordSections(snapshot = {}) {
  return Object.entries(object(snapshot)).flatMap(([key, value]) => {
    if (!/^saved[A-Z].*s$/.test(key) || !Array.isArray(value) || !value.length) return [];
    return value.map((record, index) => ({
      title: savedRecordBaseTitle(key),
      rows: savedRecordRows(record, index, key),
      isLineSection: isLineSectionRecordKey(key)
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
    chartSvg: state.chartSvg || state.diagramSvg || '',
    diagramSvg: state.diagramSvg || state.chartSvg || '',
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
