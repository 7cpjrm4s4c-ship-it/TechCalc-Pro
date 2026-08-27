import { formatEngineeringNumber } from '../numberService.js';

const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = value => value == null || value === '' ? '—' : String(value);
const fmt = (value, kind = 'generic') => value == null || value === '' ? '—' : formatEngineeringNumber(value, kind);
const row = (label, value, unit = '') => [label, text(value), unit];
const num = (label, value, kind, unit = '') => [label, fmt(value, kind), value == null || value === '' ? '' : unit];

const STATUS = Object.freeze({
  prohibited: 'unzulässig',
  'exception-applies': 'Ausnahme anwendbar',
  'no-prohibition-found': 'keine Beschränkung ermittelt',
  'manual-review': 'manuelle Rechtsprüfung erforderlich',
  incomplete: 'Angaben unvollständig',
  'not-specified': 'nicht bewertet',
  'not-applicable': 'nicht anwendbar',
  'allowed-under-exception': 'unter gesetzlicher Ausnahme zulässig',
  required: 'erforderlich',
  'not-required': 'nicht erforderlich',
  verified: 'nachgewiesen',
  'required-not-verified': 'erforderlich, nicht nachgewiesen',
  'non-compliant': 'Anforderung nicht erfüllt',
  'requirements-identified': 'Pflichten erfüllt'
});
const status = value => STATUS[value] || value || '—';
const LABELS = Object.freeze({ refrigeration: 'Kälteanlage', 'air-conditioning': 'Klimaanlage', 'heat-pump': 'Wärmepumpe', stationary: 'ortsfest', mobile: 'mobil', 'air-water': 'Luft-Wasser', 'air-air': 'Luft-Luft', split: 'Split', 'mono-split': 'Mono-Split', monoblock: 'Monoblock', 'self-contained': 'in sich geschlossen', portable: 'tragbar / steckerfertig', centralized: 'zentralisiert', cascade: 'Kaskadensystem' });
const label = value => LABELS[value] || value || '—';

const OBLIGATION_LABELS = Object.freeze({
  'leak-check-records': 'Aufzeichnungen zu Dichtheitskontrollen',
  'pre-ban-proof': 'Nachweis für vor dem Verbotsdatum in Verkehr gebrachte Erzeugnisse',
  'german-pre-ban-declaration': 'Erklärung für vor dem Verbotsdatum in Verkehr gebrachte Erzeugnisse',
  'specific-refrigerant-loss': 'Grenzwert für den spezifischen Kältemittelverlust',
  'access-to-detachable-connections': 'Zugang zu lösbaren Verbindungen sicherstellen',
  'contractor-certification': 'Zertifizierung bzw. Sachkunde des beauftragten Unternehmens prüfen',
  'certified-person-for-leak-check': 'Dichtheitskontrolle durch sachkundige Person',
  'certified-person-for-recovery': 'Rückgewinnung durch sachkundige Person'
});

const OBLIGATION_LEGAL = Object.freeze({
  'FG-020': 'Verordnung (EU) 2024/573, Art. 7',
  'FG-045': 'Verordnung (EU) 2024/573, Art. 11 Abs. 1',
  'FG-046': 'Chemikaliengesetz (ChemG), § 12i Abs. 2',
  'FG-060': 'Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § 2 Abs. 1',
  'FG-063': 'Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § 2 Abs. 2',
  'FG-052': 'Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § 14 Abs. 1',
  'FG-053': 'Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § 14 Abs. 2',
  'FG-054': 'Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § 14 Abs. 3'
});

function legalSourceLabel(source = '') {
  const value = String(source);
  let match = value.match(/^EU-FGAS:Art\.(\d+)(?:\((\d+)\))?$/);
  if (match) return `Verordnung (EU) 2024/573, Art. ${match[1]}${match[2] ? ` Abs. ${match[2]}` : ''}`;
  match = value.match(/^EU-FGAS:AnnexIV\((0*\d+)\)$/);
  if (match) return `Verordnung (EU) 2024/573, Anhang IV Nr. ${Number(match[1])}`;
  match = value.match(/^DE-CHEMKLIMA:§(\d+)(?:\((\d+)\))?$/);
  if (match) return `Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § ${match[1]}${match[2] ? ` Abs. ${match[2]}` : ''}`;
  match = value.match(/^DE-CHEMG:§([\w]+)(?:\((\d+)\))?$/);
  if (match) return `Chemikaliengesetz (ChemG), § ${match[1]}${match[2] ? ` Abs. ${match[2]}` : ''}`;
  if (value.includes('EU-FGAS:Art.10+DE-CHEMKLIMA:§5')) return 'Verordnung (EU) 2024/573, Art. 10; Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § 5';
  if (value.includes('EU-FGAS:Art.10+DE-CHEMKLIMA:§10')) return 'Verordnung (EU) 2024/573, Art. 10; Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § 10';
  return value;
}

function formatDateOnly(value) {
  const raw = String(value || '');
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : text(value);
}

function summarySection(dto) {
  const checks = object(dto.summary?.checks);
  return { title: '1. Regulatorische Ergebnisübersicht', rows: [row('Inverkehrbringen', status(checks.placingOnMarket)), row('Wartung / Instandhaltung', status(checks.service)), row('Dichtheitskontrolle', status(checks.leakCheck)), row('Dokumentation', status(checks.documentation)), row('Zertifizierung', status(checks.certification)), row('Betreiberpflichten', status(checks.operatorDuties))] };
}
function systemSection(dto) {
  const system = object(dto.systemSnapshot?.system);
  return { title: '2. Anlage und Bewertungsgrundlage', rows: [row('Anlagenbezeichnung', system.systemName), row('Anlagenart', label(system.applicationType)), row('Aufstellung', label(system.installationType)), row('Produkt-/Anlagenkategorie', system.productCategory), row('Bauform', label(system.constructionType)), row('Split-Systemart', label(system.splitType)), num('Nennleistung', system.ratedCapacityKw, 'power', 'kW'), row('Bewertungsdatum', system.assessmentDate), row('Erstmaliges Inverkehrbringen', system.placedOnMarketDate), row('Errichtung am Aufstellungsort', system.installedAtSiteDate), row('Zu prüfende Tätigkeit', system.plannedActivity)] };
}
function refrigerantSection(dto) {
  const summary = object(dto.summary);
  return { title: '3. Kältemittel und CO₂-Äquivalent', rows: [row('Kältemittel', object(dto.systemSnapshot?.system).refrigerantId), num('GWP nach F-Gas-Verordnung', summary.gwp, 'generic'), num('Füllmenge', summary.chargeKg, 'mass', 'kg'), num('CO₂-Äquivalent', summary.co2EquivalentTonnes, 'generic', 't')] };
}
function leakSection(dto) {
  const leak = object(dto.leakCheck);
  return { title: '4. Dichtheitskontrolle und Leckage-Erkennung', rows: [row('Dichtheitskontrolle erforderlich', leak.required === true ? 'ja' : leak.required === false ? 'nein' : '—'), num('Prüfintervall', leak.intervalMonths, 'integer', 'Monate'), row('Leckage-Erkennungssystem verpflichtend', leak.leakDetectionRequired === true ? 'ja' : leak.leakDetectionRequired === false ? 'nein' : '—'), row('Status', status(leak.status))] };
}
function obligationsSection(title, payload, startIndex) {
  const obligations = array(payload?.obligations);
  const rows = obligations.length ? obligations.map((item, index) => {
    const details = [];
    if (item.maximumPercent != null) details.push(`Grenzwert: ${item.maximumPercent} %`);
    if (item.retentionYears != null) details.push(`Aufbewahrung: ${item.retentionYears} Jahre`);
    if (item.requiredFrom) details.push(`erforderlich ab ${formatDateOnly(item.requiredFrom)}`);
    if (item.applicableBanDate) details.push(`Verbotsdatum: ${formatDateOnly(item.applicableBanDate)}`);
    details.push(OBLIGATION_LEGAL[item.id] || 'Rechtsgrundlage siehe angewendete Rechtsregeln');
    return row(`${index + 1}. ${OBLIGATION_LABELS[item.type] || 'Regulatorische Pflicht'}`, details.join(' · '));
  }) : [row('Status', status(payload?.status))];
  return { title: `${startIndex}. ${title}`, rows };
}
function regulationsSection(dto) {
  const rules = array(dto.applicableRegulations);
  return {
    title: '7. Angewendete Rechtsregeln',
    rows: rules.length
      ? rules.map(rule => row(rule.id, [legalSourceLabel(rule.legalSource), rule.validFrom ? `gültig ab ${formatDateOnly(rule.validFrom)}` : '', rule.validUntil ? `bis ${formatDateOnly(rule.validUntil)}` : ''].filter(Boolean).join(' · ')))
      : [row('Status', 'Keine automatisch anwendbare Regelreferenz ermittelt')]
  };
}
function sourcesSection(dto) {
  const metadata = object(dto.metadata);
  return {
    title: '8. Quellen und Berichtserstellung',
    rows: [
      row('Erzeugt am', formatDateOnly(metadata.generatedAt)),
      ...array(dto.sources).map(source => row(source.title || source.id, source.role || source.id))
    ]
  };
}
export function buildFGasesReportSections(dto = {}) {
  if (object(dto.metadata).dtoType !== 'techcalc.f-gases-check.report') return [];
  return [summarySection(dto), systemSection(dto), refrigerantSection(dto), leakSection(dto), obligationsSection('Dokumentationspflichten', dto.documentation, 5), obligationsSection('Betreiberpflichten', dto.operatorDuties, 6), regulationsSection(dto), sourcesSection(dto)].map(section => ({ ...section, isLineSection: false }));
}
export default buildFGasesReportSections;
