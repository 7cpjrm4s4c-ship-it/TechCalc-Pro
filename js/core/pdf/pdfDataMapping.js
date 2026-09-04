import { currentRoute } from '../router.js';
import { sanitizeText, normalizeKey } from './pdfText.js';
import { buildFloodingReportSections } from './floodingReportSections.js';
import { buildRainwaterReportSections } from './rainwaterReportSections.js';
import { buildFGasesReportSections } from './fGasesReportSections.js';
import { buildEN378ReportSections } from './en378ReportSections.js';
import { buildVentilationReportSections } from './ventilationReportSections.js';
import { buildGenericReportSections } from './genericReportSections.js';

function resolveRuntimeModule(registryEntry) {
  return registryEntry?.module?.loadedModule || registryEntry?.module || registryEntry?.loadedModule || registryEntry;
}

function reportIdentity(id = '', reportDto = {}) {
  return `${id || ''} ${reportDto?.metadata?.moduleId || ''} ${reportDto?.metadata?.moduleTitle || ''} ${reportDto?.metadata?.dtoType || ''}`;
}

function isSpecialReportHeadingModule(id = '', reportDto = {}) {
  return /flooding-verification|hx|h,x/i.test(reportIdentity(id, reportDto));
}

function specialReportHeading(id = '', reportDto = {}) {
  const identity = reportIdentity(id, reportDto);
  if (/f-gases-check|f-gases|f-gase/i.test(identity)) return 'Informationsblatt';
  if (/en-378-safety-check|en\s*378/i.test(identity)) return 'Sicherheitsdatenblatt';
  return '';
}

function normalizeCollectedReportDto(reportDto, id) {
  if (isSpecialReportHeadingModule(id, reportDto)) return reportDto;
  const heading = specialReportHeading(id, reportDto) || 'Berechnungsprotokoll';
  return {
    ...reportDto,
    metadata: {
      ...reportDto.metadata,
      reportHeading: heading
    }
  };
}

function isDesignationKey(key = '') {
  return key === 'bezeichnung' || /^bezeichnung\s*\d+$/.test(key);
}

const LABEL_MAP = Object.freeze({
  'product label': 'Produkt',
  'selected volume': 'ausgewähltes Volumen',
  'selected standard volume': 'Normvolumen',
  'system volume': 'Anlagenvolumen',
  'volume': 'Volumen',
  'standard': 'Normgröße',
  'mode': 'Betriebsart',
  'medium': 'Medium',
  'defrost system volume': 'Anlagenvolumen Abtauung',
  'defrost buffer volume': 'Puffervolumen Abtauung',
  'defrost power': 'Abtauleistung',
  'runtime power': 'Leistung Mindestlaufzeit',
  'runtime system volume': 'Anlagenvolumen Mindestlaufzeit',
  'runtime buffer volume': 'Puffervolumen Mindestlaufzeit',
  'reserve volume': 'Wasservorlage',
  'decisive volume': 'maßgebendes Volumen',
  'decisive system volume': 'maßgebendes Anlagenvolumen',
  'next standard volume': 'nächste Normgröße',
  'pa min': 'Mindestdruck',
  'pamin': 'Mindestdruck',
  'pe': 'Enddruck',
  'p0': 'Vordruck',
  'building': 'Gebäudeart',
  'consumer count': 'Anzahl Einrichtungsgegenstände',
  'raw flow': 'Summendurchfluss',
  'sum flow': 'Summendurchfluss',
  'single sum flow': 'Summendurchfluss Einzelverbraucher',
  'total sum flow': 'Gesamtsummendurchfluss',
  'peak flow': 'Spitzendurchfluss',
  'permanent flow': 'Dauerverbrauch',
  'meter q3': 'Wasserzähler Q3',
  'flow m3 h': 'Durchfluss',
  'nennweite': 'Nennweite',
  'line type': 'Leitungsart',
  'type id': 'Typ',
  'anzahl': 'Anzahl',
  'vr': 'Berechnungsdurchfluss',
  'pmin': 'Mindestfließdruck',
  'ne group': 'Nutzungseinheitengruppe',
  'hot water': 'Warmwasser',
  'permanent': 'Dauerverbraucher',
  'effective role': 'wirksame Zuordnung',
  'central warm water': 'zentrale Warmwasserbereitung',
  'warm water mode': 'Warmwasserbereitung',
  'humidity ratio gkg': 'absolute Feuchte',
  'humidity ratio': 'Feuchtegehalt',
  'enthalpy kj kg': 'Enthalpie',
  'density kgm3': 'Dichte',
  'dry mass flow kg h': 'Trockenluft-Massenstrom',
  'mass flow kg h': 'Massenstrom',
  'outdoor share': 'Außenluftanteil',
  'recirc share': 'Umluftanteil',
  'condensate kg h': 'Kondensat',
  'condensate ls': 'Kondensatvolumenstrom',
  'condensation power kw': 'Kondensationsleistung',
  'has condensation': 'Kondensation',
  'recovered power kw': 'zurückgewonnene Leistung',
  'effective volume flow m3 h': 'wirksamer Volumenstrom',
  'effective dry mass flow kg h': 'wirksamer Trockenluft-Massenstrom',
  'bypass volume flow m3 h': 'Bypass-Volumenstrom',
  'bypass percent': 'Bypass-Anteil',
  'beta': 'Bypass-Anteil',
  'mixing outdoor volume flow m3 h': 'Außenluft-Volumenstrom',
  'mixing outdoor temp': 'Außenlufttemperatur',
  'mixing outdoor relative feuchte': 'relative Feuchte Außenluft',
  'mixing recirc volume flow m3 h': 'Umluft-Volumenstrom',
  'mixing recirc temp': 'Umlufttemperatur',
  'mixing recirc relative feuchte': 'relative Feuchte Umluft',
  'recirc volume flow m3 h': 'Umluft-Volumenstrom',
  'outdoor volume flow m3 h': 'Außenluft-Volumenstrom',
  'current': 'Ausgangszustand',
  'target': 'Zielzustand',
  'process end': 'Prozessende',
  'target reached': 'Zielzustand erreicht',
  'change type': 'Prozessart',
  'selected process': 'gewählter Prozess',
  'effective process': 'wirksamer Prozess',
  'dew point c': 'Taupunkttemperatur',
  'wet bulb c': 'Feuchtkugeltemperatur',
  'temp k': 'Temperaturdifferenz',
  'humidity gkg': 'Feuchtezunahme',
  'relative feuchte': 'relative Feuchte',
  'cooling supply temp c': 'Kälte-Vorlauf',
  'cooling return temp c': 'Kälte-Rücklauf',
  'heating supply temp c': 'Heizung-Vorlauf',
  'heating return temp c': 'Heizung-Rücklauf',
  'air volume m3 h': 'Luftvolumenstrom',
  'target temp c': 'Zieltemperatur',
  'target rh percent': 'Ziel-Feuchte',
  'temp c': 'Temperatur',
  'rh percent': 'relative Feuchte'
});

const VALUE_MAP = Object.freeze({
  'true': 'ja',
  'false': 'nein',
  'yes': 'ja',
  'no': 'nein',
  'defrost': 'Abtauung',
  'reserve': 'Wasservorlage',
  'runtime': 'Mindestlaufzeit',
  'adiabatic': 'adiabate Befeuchtung',
  'steam': 'Dampfbefeuchtung',
  'heat': 'Erwärmen',
  'cool': 'Kühlen',
  'cool dehumidify': 'Kühlen und Entfeuchten',
  'cool-dehumidify': 'Kühlen und Entfeuchten',
  'wrg': 'Wärmerückgewinnung',
  'central': 'zentral',
  'decentral': 'dezentral',
  'pwc': 'Trinkwasser kalt',
  'pwh': 'Trinkwasser warm',
  'wwb': 'Warmwasserbereitung',
  'steel': 'Stahl'
});

const UNIT_MAP = Object.freeze({
  'm3 h': 'm³/h',
  'm3': 'm³',
  'm2': 'm²',
  'kg h': 'kg/h',
  'l s': 'l/s',
  'ls': 'l/s',
  'pa m': 'Pa/m',
  'pam': 'Pa/m',
  'kg m3': 'kg/m³',
  'kgm3': 'kg/m³',
  'kj kg': 'kJ/kg',
  'g kg': 'g/kg',
  'gkg': 'g/kg',
  'kw': 'kW',
  'w': 'W',
  'c': '°C',
  'k': 'K',
  'bar': 'bar',
  'l': 'l',
  'percent': '%'
});

const SKIPPED_LABEL_KEYS = new Set([
  'id',
  'created at',
  'createdat',
  'updated at',
  'updatedat',
  'group id',
  'group name',
  'effective index',
  'schema version',
  'report typ',
  'report type',
  'report version',
  'erzeugt am',
  'formula text',
  'system dimensions',
  'smaller system dimensions',
  'larger system dimensions',
  'dimensions'
]);

function normalizedLookup(map, value) {
  const key = normalizeKey(value);
  return map[key] || '';
}

function germanLabel(label = '') {
  const clean = sanitizeText(label);
  return normalizedLookup(LABEL_MAP, clean) || clean;
}

function germanValue(value) {
  const clean = sanitizeText(value);
  return normalizedLookup(VALUE_MAP, clean) || clean;
}

function isPlainNumericText(value = '') {
  const clean = sanitizeText(value).replace(/\s/g, '');
  return /^[-+]?\d+(?:[.,]\d+)?$/.test(clean) || /^[-+]?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(clean);
}

function parseGermanNumber(value = '') {
  const clean = sanitizeText(value).replace(/\s/g, '');
  if (!isPlainNumericText(clean)) return null;
  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function formatGermanNumber(value) {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value);
}

function formatValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return formatGermanNumber(value);
  if (typeof value === 'boolean') return value ? 'ja' : 'nein';
  const clean = germanValue(value);
  const numeric = parseGermanNumber(clean);
  if (numeric !== null) return formatGermanNumber(numeric);
  return clean;
}

function germanUnit(unit = '') {
  const clean = sanitizeText(unit);
  return normalizedLookup(UNIT_MAP, clean) || clean;
}

function shouldSkipRow(label = '', value = '') {
  const key = normalizeKey(label);
  if (!label && !value) return true;
  if (SKIPPED_LABEL_KEYS.has(key)) return true;
  if (/\bdimensions?\b/i.test(key)) return true;
  const cleanValue = sanitizeText(value);
  if (/^\s*[\[{]/.test(cleanValue) && cleanValue.length > 80) return true;
  return false;
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
  const firstChartSvg = Array.isArray(normalizedReportDto.charts) ? normalizedReportDto.charts.find(chart => chart?.svg)?.svg : '';

  return {
    id,
    title: registryEntry?.title || module?.title || module?.config?.title || normalizedReportDto.metadata?.moduleTitle || id || 'Modul',
    shortTitle: registryEntry?.shortTitle || module?.shortTitle || module?.config?.shortTitle || normalizedReportDto.metadata?.moduleTitle || id || 'Modul',
    sections: [],
    chartSvg: normalizedReportDto.chartSvg || normalizedReportDto.diagramSvg || firstChartSvg || '',
    chartCanvas: normalizedReportDto.chartCanvas || null,
    reportDto: normalizedReportDto,
    reportSource: 'typed-dto'
  };
}
export function sectionTitle(title) {
  const normalized = sanitizeText(title);
  if (/ergebnis\s*zusammenfassung/i.test(normalized)) return 'Zielzustand';
  return normalized;
}

export function isLineSectionTitle(title = '') {
  return /leitungsabschnitt|rohrauslegung|speicher|puffer|druckhaltung|mischluft|wärmerückgewinnung|waermerueckgewinnung|trinkwasser|schmutzwasser|gespeicherte|h,x-prozess|hx-prozess/i.test(sanitizeText(title));
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
    const label = sanitizeText(row?.[0] ?? '');
    const value = sanitizeText(row?.[1] ?? '');
    const unit = sanitizeText(row?.[2] ?? '');
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
  const seenRows = new Set();
  return rows
    .map(row => {
      const label = germanLabel(row?.[0] ?? '')
        .replace(/^Sättigung$/i, 'Adiabate Befeuchtung')
        .replace(/Parameter/g, 'Bezeichnung');
      const value = formatValue(row?.[1] ?? '');
      const unit = germanUnit(row?.[2] ?? '');
      return [sanitizeText(label), sanitizeText(value), sanitizeText(unit)];
    })
    .filter(row => !shouldSkipRow(row?.[0] ?? '', row?.[1] ?? ''))
    .map(row => {
      const key = normalizeKey(row?.[0] ?? '');
      if (normalizedTitle.includes('gespeicherte') && key === 'bezeichnung') {
        const count = (seenGenericLabels.get(key) || 0) + 1;
        seenGenericLabels.set(key, count);
        return [count === 1 ? 'Bezeichnung' : `Bezeichnung ${count}`, row?.[1] ?? '', row?.[2] ?? ''];
      }
      return row;
    })
    .filter(row => {
      const signature = row.map(cell => normalizeKey(cell)).join('|');
      if (seenRows.has(signature)) return false;
      seenRows.add(signature);
      return true;
    });
}
const typedReportSectionBuilders = Object.freeze({
  'techcalc.flooding-verification.report': buildFloodingReportSections,
  'techcalc.rainwater.report': buildRainwaterReportSections,
  'techcalc.f-gases-check.report': buildFGasesReportSections,
  'techcalc.en-378-safety-check.report': buildEN378ReportSections,
  'techcalc.ventilation.report': buildVentilationReportSections
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
