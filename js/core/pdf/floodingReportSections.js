import { formatEngineeringNumber } from '../numberService.js';
import { areaTypes } from '../../shared/rainwaterDomainTables.js';

const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = value => value == null || value === '' ? '—' : String(value);
const fmt = (value, kind = 'generic', options = {}) => value == null || value === ''
  ? '—'
  : formatEngineeringNumber(value, kind, options);
const row = (label, value, unit = '') => [label, text(value), unit];
const numericRow = (label, value, kind, unit = '') => [label, fmt(value, kind), value == null || value === '' ? '' : unit];

const ENUM_LABELS = Object.freeze({
  complete: 'vollständig',
  incomplete: 'unvollständig',
  manual: 'manuelle Eingabe',
  automatic: 'automatische Ermittlung',
  'authority-discharge-limit': 'behördliche Einleitungsbegrenzung',
  'pipe-capacity': 'Rohrleistungsnachweis',
  'equation-20': 'DIN 1986-100, Gleichung (20)',
  'equation-21': 'DIN 1986-100, Gleichung (21)',
  local: 'manuelle Eingabe im Überflutungsnachweis',
  rainwater: 'Übernahme aus dem Regenwassermodul'
});

const SURFACE_TYPE_LABELS = Object.freeze({
  ...Object.fromEntries(areaTypes.map(areaType => [areaType.id, areaType.name])),
  'green-extensive-flat': 'Extensivbegrünung ≤ 5°',
  'paving-permeable': 'Wasserdurchlässige Pflasterfläche',
  roof: 'Dachfläche',
  yard: 'Hoffläche',
  property: 'Grundstücksfläche'
});

function label(value, dictionary = ENUM_LABELS) {
  const key = String(value ?? '').trim();
  return dictionary[key] || key || '—';
}

function localDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value);
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date);
}

function summarySection(dto) {
  const summary = object(dto.summary);
  return {
    title: '1. Ergebniszusammenfassung',
    rows: [
      numericRow('Planerisch anzusetzendes Speichervolumen', summary.planningVolumeM3, 'volume', 'm³'),
      row('Maßgebender Nachweis', summary.governingLabel || 'Nachweis unvollständig'),
      numericRow('DIN 1986-100', summary.dinVolumeM3, 'volume', 'm³'),
      numericRow('DWA-A 117', summary.dwaVolumeM3, 'volume', 'm³'),
      row('Nachweisstatus', label(summary.status)),
      row('Begründung', summary.governingReason),
      row('Bemessungsregel', summary.rule)
    ]
  };
}

function interpretationSection(dto) {
  const interpretation = object(dto.interpretation);
  return {
    title: '2. Planerische Interpretation',
    rows: [
      row('Zusammenfassung', interpretation.summary),
      row('Leitungsnachweis', interpretation.discharge),
      row('DWA-A 117', interpretation.dwa),
      row('Normative Aussage', interpretation.normative),
      row('Handlungsempfehlung', interpretation.recommendation)
    ]
  };
}

function projectReferenceSection(dto) {
  const project = object(dto.projectReference);
  return {
    title: '3. Projekt- und Behördenreferenz',
    rows: [
      row('Projektbezeichnung', project.projectName || 'siehe Dokumentkopf'),
      row('Behörde / Netzbetreiber', project.authorityName),
      row('Aktenzeichen / Referenz', project.authorityReference),
      row('Datum der Vorgabe', project.authorityDate),
      row('Quellenhinweis', project.authoritySourceNote)
    ]
  };
}

function surfaceSummary(surface) {
  const type = label(surface.areaType || surface.category || 'Fläche', SURFACE_TYPE_LABELS);
  const source = surface.imported ? 'Übernahme aus dem Regenwassermodul' : label(surface.source || 'local');
  const details = [
    type,
    `A = ${fmt(surface.areaM2, 'area')} m²`,
    `Cₛ = ${fmt(surface.runoffCoefficientCs, 'factor')}`,
    `Cₘ = ${fmt(surface.meanRunoffCoefficientCm, 'factor')}`,
    `A × Cₛ = ${fmt(surface.weightedCsAreaM2, 'area')} m²`,
    source
  ];
  return details.join(' · ');
}

function surfacesSection(dto) {
  const surfaces = array(dto.surfaces);
  return {
    title: `4. Flächenübersicht (${surfaces.length})`,
    rows: surfaces.length
      ? surfaces.map((surface, index) => row(`${index + 1}. ${surface.name || `Fläche ${index + 1}`}`, surfaceSummary(surface)))
      : [row('Status', 'Keine Flächen vorhanden')]
  };
}

function rainfallSection(dto) {
  const rainfall = object(dto.rainfall);
  const rows = [
    row('Eingabemodus', label(rainfall.entryMode)),
    row('Regendauermodus', label(rainfall.durationMode)),
    numericRow('Automatisch ermittelte Regendauer', rainfall.automaticDurationMinutes, 'duration', 'min'),
    numericRow('Verwendete Regendauer', rainfall.governingDurationMinutes, 'duration', 'min'),
    row('Begründung manueller Dauer', rainfall.manualDurationReason),
    row('Datensatz', rainfall.sourceDataset),
    row('Standort', rainfall.sourceLocation),
    row('Datenstand / Version', rainfall.sourceVersion),
    row('Regendaten vollständig', rainfall.valid ? 'ja' : 'nein')
  ];
  for (const duration of [5, 10, 15]) {
    rows.push(numericRow(`r(${duration},2)`, object(rainfall.r2ByDuration)[duration], 'rainIntensity', 'l/(s·ha)'));
    rows.push(numericRow(`r(${duration},30)`, object(rainfall.r30ByDuration)[duration], 'rainIntensity', 'l/(s·ha)'));
  }
  rows.push(numericRow('r(5,100)', object(rainfall.r100ByDuration)[5], 'rainIntensity', 'l/(s·ha)'));
  return { title: '5. Regendaten und Berechnungsgrundlagen', rows };
}

function hydraulicsSection(dto) {
  const hydraulics = object(dto.hydraulics);
  return {
    title: '6. Leitungs- und Abflussnachweis',
    rows: [
      row('Betriebsart', label(hydraulics.dischargeMode)),
      numericRow('Erforderlicher Regenwasserabfluss Qᵣ', hydraulics.requiredRainFlowLs, 'flow', 'l/s'),
      numericRow('Verfügbarer Abfluss Qab', hydraulics.availableFlowLs, 'flow', 'l/s'),
      numericRow('Auslastung', hydraulics.utilizationPercent, 'percent', '%'),
      row('Nachweis', hydraulics.adequate ? 'ausreichend' : 'nicht ausreichend / unvollständig'),
      row('Nennweite', hydraulics.pipeNominalDiameterDn),
      numericRow('Gefälle', hydraulics.pipeSlopePercent, 'percent', '%'),
      row('Quelle Qab', hydraulics.tableReference),
      numericRow('Behördliche Einleitungsbegrenzung', hydraulics.authorityLimitLs, 'flow', 'l/s')
    ]
  };
}

function dinSections(dto) {
  const verification = object(dto.floodingVerification);
  const equation20 = object(verification.equation20);
  const governing = object(verification.governing);
  const equation21Governing = object(verification.equation21Governing);
  const eq20 = {
    title: '7. DIN 1986-100 – Gleichung (20)',
    rows: [
      numericRow('Regendauer D', equation20.durationMinutes, 'duration', 'min'),
      numericRow('r(D,30)', equation20.rain30, 'rainIntensity', 'l/(s·ha)'),
      numericRow('r(D,2)', equation20.rain2, 'rainIntensity', 'l/(s·ha)'),
      numericRow('Gesamtfläche A ges', equation20.totalAreaM2 ?? verification.totalAreaM2, 'area', 'm²'),
      numericRow('Σ(A × Cₛ)', equation20.weightedCsAreaM2 ?? verification.weightedCsAreaM2, 'area', 'm²'),
      numericRow('Rohwert', equation20.rawValueM3, 'volume', 'm³'),
      numericRow('Anzusetzendes Volumen', equation20.valueM3, 'volume', 'm³'),
      row('Gültigkeit', equation20.valid ? 'vollständig' : 'unvollständig')
    ]
  };
  const durationRows = array(verification.equation21ByDuration).map(item => [
    `${fmt(item.durationMinutes, 'duration')} min${item.durationMinutes === equation21Governing.durationMinutes ? ' · maßgebend' : ''}`,
    fmt(item.valueM3, 'volume'),
    item.valueM3 == null ? '' : 'm³'
  ]);
  const eq21 = {
    title: '8. DIN 1986-100 – Gleichung (21), Dauerstufenvergleich',
    rows: [
      ...durationRows,
      row('Maßgebende Gleichung', label(governing.source)),
      numericRow('Maßgebende Regendauer', governing.durationMinutes ?? equation21Governing.durationMinutes, 'duration', 'min'),
      numericRow('Maßgebendes DIN-Volumen', governing.valueM3, 'volume', 'm³')
    ]
  };
  return [eq20, eq21];
}

function retentionSections(dto) {
  const retention = object(dto.retentionVerification);
  const governing = object(retention.governing);
  const parameters = {
    title: '9. DWA-A 117 – Anwendungs- und Parameterprüfung',
    rows: [
      row('Nachweis aktiv', retention.active ? 'ja' : 'nein'),
      row('Berechnung durchgeführt', retention.calculated ? 'ja' : 'nein'),
      numericRow('Überschreitungshäufigkeit n', retention.effectiveRecurrenceFrequencyPerYear, 'frequency', '1/a'),
      numericRow('Zuschlagsfaktor fz', retention.surchargeFactorFz, 'factor'),
      numericRow('Abminderungsfaktor fA', retention.reductionFactorFa, 'factor'),
      numericRow('Drosselabflussspende qDr,R,u', retention.throttleRainShareLsHa, 'rainIntensity', 'l/(s·ha)'),
      row('Quelle fz', object(retention.factorSource).surcharge),
      row('Quelle fA', object(retention.factorSource).reduction),
      row('Quelle Regendaten', object(retention.factorSource).rain)
    ]
  };
  const durationRows = array(retention.durationResults).map(item => [
    `${fmt(item.durationMinutes, 'duration')} min${item.durationMinutes === governing.durationMinutes ? ' · maßgebend' : ''}`,
    item.volumeM3 == null ? '—' : fmt(item.volumeM3, 'volume'),
    item.volumeM3 == null ? '' : 'm³'
  ]);
  const comparison = {
    title: '10. DWA-A 117 – Dauerstufenvergleich',
    rows: durationRows.length ? [
      ...durationRows,
      numericRow('Maßgebende Dauer', governing.durationMinutes, 'duration', 'min'),
      numericRow('Spezifisches Speichervolumen Vs,u', governing.specificStorageM3Ha, 'volume', 'm³/ha'),
      numericRow('Maßgebendes Rückhaltevolumen', governing.volumeM3, 'volume', 'm³')
    ] : [row('Status', retention.active ? 'Dauerstufenvergleich unvollständig' : 'DWA-A 117 nicht erforderlich')]
  };
  return [parameters, comparison];
}

function diagnosticsSection(dto) {
  const diagnostics = object(dto.diagnostics);
  const counts = object(diagnostics.counts);
  const items = array(diagnostics.items);
  return {
    title: '11. Diagnosen, Warnungen und Empfehlungen',
    rows: [
      row('Gesamtstatus', diagnostics.statusLabel || label(diagnostics.status)),
      row('Bewertung', diagnostics.statusReason),
      numericRow('Fehler', counts.errors, 'integer'),
      numericRow('Warnungen', counts.warnings, 'integer'),
      numericRow('Empfehlungen', counts.recommendations, 'integer'),
      numericRow('Hinweise', counts.hints, 'integer'),
      ...items.flatMap((item, index) => [
        row(`${index + 1}. ${item.title || item.code || label(item.type)}`, item.message),
        ...(item.recommendation ? [row(`${index + 1}. Empfehlung`, item.recommendation)] : [])
      ])
    ]
  };
}

function sourcesSection(dto) {
  const metadata = object(dto.metadata);
  const sources = array(dto.sources);
  return {
    title: '12. Quellen, Versionen und Nachweisidentität',
    rows: [
      row('Report-Typ', metadata.dtoType),
      row('Report-Version', metadata.dtoVersion),
      row('Modul', metadata.moduleTitle),
      row('Modul-Schema', metadata.schemaVersion),
      row('TechCalc-Pro-Version', metadata.appVersion),
      row('Berechnungszeitpunkt', localDateTime(metadata.generatedAt)),
      ...sources.map(source => row(source.title || source.id, [source.role, source.version].filter(Boolean).join(' · ')))
    ]
  };
}

export function buildFloodingReportSections(dto = {}) {
  if (object(dto.metadata).dtoType !== 'techcalc.flooding-verification.report') return [];
  return [
    summarySection(dto),
    interpretationSection(dto),
    projectReferenceSection(dto),
    surfacesSection(dto),
    rainfallSection(dto),
    hydraulicsSection(dto),
    ...dinSections(dto),
    ...retentionSections(dto),
    diagnosticsSection(dto),
    sourcesSection(dto)
  ].map(section => ({ ...section, isLineSection: false }));
}

export default buildFloodingReportSections;