import { formatEngineeringNumber } from '../numberService.js';

const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = value => value == null || value === '' ? '—' : String(value);
const fmt = (value, kind = 'generic') => value == null || value === '' ? '—' : formatEngineeringNumber(value, kind);
const row = (label, value, unit = '') => [label, text(value), unit];
const num = (label, value, kind, unit = '') => [label, fmt(value, kind), value == null || value === '' ? '' : unit];

const STATUS = Object.freeze({
  prohibited: 'verboten',
  'exception-applies': 'Ausnahme greift',
  'no-prohibition-found': 'kein Verbot ermittelt',
  'manual-review': 'manuelle Rechtsprüfung erforderlich',
  incomplete: 'Angaben unvollständig',
  'not-specified': 'nicht bewertet',
  'not-applicable': 'nicht anwendbar',
  'allowed-under-exception': 'unter Ausnahme zulässig',
  required: 'erforderlich',
  'not-required': 'nicht erforderlich',
  verified: 'nachgewiesen',
  'required-not-verified': 'erforderlich, nicht nachgewiesen',
  'non-compliant': 'Anforderung nicht erfüllt',
  'requirements-identified': 'Pflichten ermittelt',
  'exception-applies': 'Ausnahme greift'
});
const status = value => STATUS[value] || value || '—';

const LABELS = Object.freeze({
  refrigeration: 'Kälteanlage',
  'air-conditioning': 'Klimaanlage',
  'heat-pump': 'Wärmepumpe',
  stationary: 'ortsfest',
  mobile: 'mobil',
  'air-water': 'Luft-Wasser',
  'air-air': 'Luft-Luft',
  split: 'Split',
  'mono-split': 'Mono-Split',
  monoblock: 'Monoblock',
  'self-contained': 'in sich geschlossen',
  portable: 'tragbar / steckerfertig',
  centralized: 'zentralisiert',
  cascade: 'Kaskadensystem'
});
const label = value => LABELS[value] || value || '—';

function summarySection(dto) {
  const checks = object(dto.summary?.checks);
  return {
    title: '1. Regulatorische Ergebnisübersicht',
    rows: [
      row('Inverkehrbringen', status(checks.placingOnMarket)),
      row('Service / Wartung', status(checks.service)),
      row('Dichtheitskontrolle', status(checks.leakCheck)),
      row('Dokumentation', status(checks.documentation)),
      row('Zertifizierung', status(checks.certification)),
      row('Betreiberpflichten', status(checks.operatorDuties))
    ]
  };
}

function systemSection(dto) {
  const system = object(dto.systemSnapshot?.system);
  return {
    title: '2. Anlage und Bewertungsgrundlage',
    rows: [
      row('Anlagenbezeichnung', system.systemName),
      row('Anlagenart', label(system.applicationType)),
      row('Aufstellung', label(system.installationType)),
      row('Produkt-/Anlagenkategorie', system.productCategory),
      row('Bauform', label(system.constructionType)),
      row('Split-Systemart', label(system.splitType)),
      num('Nennleistung', system.ratedCapacityKw, 'power', 'kW'),
      row('Bewertungsdatum', system.assessmentDate),
      row('Erstmaliges Inverkehrbringen', system.placedOnMarketDate),
      row('Errichtung am Aufstellungsort', system.installedAtSiteDate),
      row('Zu prüfende Tätigkeit', system.plannedActivity)
    ]
  };
}

function refrigerantSection(dto) {
  const summary = object(dto.summary);
  return {
    title: '3. Kältemittel und CO₂-Äquivalent',
    rows: [
      row('Kältemittel', object(dto.systemSnapshot?.system).refrigerantId),
      num('GWP nach F-Gas-VO', summary.gwp, 'generic'),
      num('Füllmenge', summary.chargeKg, 'mass', 'kg'),
      num('CO₂-Äquivalent', summary.co2EquivalentTonnes, 'generic', 't')
    ]
  };
}

function leakSection(dto) {
  const leak = object(dto.leakCheck);
  return {
    title: '4. Dichtheitskontrolle und Leckage-Erkennung',
    rows: [
      row('Dichtheitskontrolle erforderlich', leak.required === true ? 'ja' : leak.required === false ? 'nein' : '—'),
      num('Prüfintervall', leak.intervalMonths, 'integer', 'Monate'),
      row('Leckage-Erkennungssystem verpflichtend', leak.leakDetectionRequired === true ? 'ja' : leak.leakDetectionRequired === false ? 'nein' : '—'),
      row('Status', status(leak.status))
    ]
  };
}

function obligationsSection(title, payload, startIndex) {
  const obligations = array(payload?.obligations);
  const rows = obligations.length ? obligations.flatMap((item, index) => {
    const detail = [
      item.type,
      item.maximumPercent != null ? `Grenzwert ${item.maximumPercent} %` : '',
      item.retentionYears != null ? `Aufbewahrung ${item.retentionYears} Jahre` : '',
      item.requiredFrom ? `erforderlich ab ${item.requiredFrom}` : '',
      item.applicableBanDate ? `Verbotsdatum ${item.applicableBanDate}` : ''
    ].filter(Boolean).join(' · ');
    return [row(`${index + 1}. ${item.id || 'Pflicht'}`, detail || 'erforderlich')];
  }) : [row('Status', status(payload?.status))];
  return { title: `${startIndex}. ${title}`, rows };
}

function regulationsSection(dto) {
  const rules = array(dto.applicableRegulations);
  return {
    title: '7. Angewendete Rechtsregeln',
    rows: rules.length
      ? rules.map(rule => row(rule.id, [rule.legalSource, rule.validFrom ? `ab ${rule.validFrom}` : '', rule.validUntil ? `bis ${rule.validUntil}` : ''].filter(Boolean).join(' · ')))
      : [row('Status', 'Keine automatisch anwendbare Regelreferenz ermittelt')]
  };
}

function sourcesSection(dto) {
  const metadata = object(dto.metadata);
  const versions = object(dto.dataVersions);
  return {
    title: '8. Quellen, Versionen und Nachweisidentität',
    rows: [
      row('Report-Typ', metadata.dtoType),
      row('Report-Version', metadata.dtoVersion),
      row('Modul-Schema', metadata.schemaVersion),
      row('Erzeugt am', metadata.generatedAt),
      row('Kältemitteldaten', versions.refrigerants),
      row('GWP-Daten', versions.gwp),
      row('Rechtsdaten', versions.regulations),
      ...array(dto.sources).map(source => row(source.title || source.id, source.role || source.id))
    ]
  };
}

export function buildFGasesReportSections(dto = {}) {
  if (object(dto.metadata).dtoType !== 'techcalc.f-gases-check.report') return [];
  return [
    summarySection(dto),
    systemSection(dto),
    refrigerantSection(dto),
    leakSection(dto),
    obligationsSection('Dokumentationspflichten', dto.documentation, 5),
    obligationsSection('Betreiberpflichten', dto.operatorDuties, 6),
    regulationsSection(dto),
    sourcesSection(dto)
  ].map(section => ({ ...section, isLineSection: false }));
}

export default buildFGasesReportSections;
