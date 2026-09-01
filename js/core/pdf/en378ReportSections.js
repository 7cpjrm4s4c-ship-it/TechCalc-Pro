import { formatEngineeringNumber } from '../numberService.js';

const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = value => value == null || value === '' ? '—' : String(value);
const row = (label, value, unit = '') => [label, text(value), unit];
const num = (label, value, kind = 'generic', unit = '') => [label, value == null || value === '' ? '—' : formatEngineeringNumber(value, kind), value == null || value === '' ? '' : unit];
const STATUS = Object.freeze({ acceptable: 'Anforderungen nach aktuellem Prüfstand erfüllt', 'measures-required': 'Maßnahmen oder Anpassungen erforderlich', 'ready-for-assessment': 'Bewertung teilweise offen', incomplete: 'Eingaben unvollständig', 'import-rejected': 'importierter Anlagenstand abgelehnt', passed: 'erfüllt', failed: 'nicht erfüllt', required: 'erforderlich', 'not-assessed': 'offen', 'not-applicable': 'nicht anwendbar' });
const OPTIONS = Object.freeze({ 'occupied-space': 'Personen-Aufenthaltsbereich', 'technical-room': 'technischer Raum', 'machinery-room': 'Maschinenraum', outdoor: 'Außenaufstellung', I: 'Klasse I – belüftetes Gehäuse', II: 'Klasse II – Maschinenraum oder im Freien', III: 'Klasse III – Verdichter in Maschinenraum oder im Freien', IV: 'Klasse IV – mechanische Geräte im Personen-Aufenthaltsbereich', 'general-access': 'allgemeiner Zugangsbereich', 'supervised-access': 'überwachter Zugangsbereich', 'authorized-access': 'Zugang nur für befugte Personen', a: 'Kategorie a – allgemeiner Zugangsbereich', b: 'Kategorie b – überwachter Zugangsbereich', c: 'Kategorie c – Zugang nur für befugte Personen', residential: 'Wohnen', commercial: 'Gewerbe', industrial: 'Industrie', public: 'öffentlich zugänglicher Bereich', 'human-comfort': 'menschlicher Komfort', other: 'andere Lage oder Anwendung', 'upper-no-emergency-exit-or-basement': 'oberes Geschoss ohne Notausgang oder Kellergeschoss', underground: 'unterirdisch', 'deepest-underground': 'tiefstes unterirdisches Geschoss', natural: 'natürliche Lüftung', mechanical: 'mechanische Lüftung', none: 'keine gesicherte Lüftung', yes: 'ja', no: 'nein' });
const CHECKS = Object.freeze({ 'charge-limit.refrigerant-data': 'Kältemitteldaten nach EN 378 prüfen', 'charge-limit.input': 'Füllmenge und Raumvolumen prüfen', 'charge-limit.toxicity': 'toxizitätsbezogene Füllmengengrenze', 'charge-limit.flammability': 'brennbarkeitsbezogene Füllmengengrenze', 'charge-limit.alternative-risk-management': 'alternative Vorkehrungen nach Anhang C.3' });
const FIELDS = Object.freeze({ refrigerantId: 'Kältemittel', chargeKg: 'Füllmenge', roomVolumeM3: 'Raumvolumen', installationLocation: 'Aufstellort', installationClass: 'Aufstellungsort-Klassifikation', accessArea: 'Zugangsbereich', accessCategory: 'Kategorie des Zugangsbereichs', usageType: 'Nutzung', ventilationType: 'Lüftung', qlmvKgM3: 'Grenzwert QLMV für Mindestlüftung', qlavKgM3: 'Grenzwert QLAV für zusätzliche Lüftung', rclKgM3: 'Kältemittel-Konzentrationsgrenzwert RCL' });
function status(value) { return STATUS[value] || text(value); }
function label(value) { return OPTIONS[value] || text(value); }
function checkLabel(value) { return CHECKS[value] || FIELDS[value] || text(value); }
function formatDateOnly(value) { const raw = String(value || ''); const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/); return match ? `${match[3]}.${match[2]}.${match[1]}` : text(value); }
function sourceLabel(source = {}) { return [source.sourcePart || '', source.sourceSection || ''].filter(Boolean).join(' '); }
function summarySection(dto) {
  const summary = object(dto.summary);
  const guidance = object(dto.plannerGuidance || dto.assessment?.plannerGuidance);
  return { title: '1. Berichtszusammenfassung', rows: [row('Bewertung', status(summary.status)), row('Leitfaden', guidance.headline || summary.plannerGuidanceHeadline), row('Zusammenfassung', guidance.summary), row('Eingaben vollständig', summary.inputComplete ? 'ja' : 'nein'), num('Maßnahmen oder Planungspunkte', guidance.actionCount, 'integer'), num('Nicht erfüllte Punkte', guidance.failedCount, 'integer'), num('Offene Prüfpunkte', guidance.openPointCount, 'integer')], singleColumn: true };
}
function importedSystemSection(dto) {
  const input = object(dto.input);
  return { title: '2. Importierter Anlagenstand und Eingaben', rows: [row('Importierte Anlage', input.importedSystemName), row('Importstatus', input.importStatusMessage), row('Kältemittel', input.refrigerantId), num('Füllmenge', input.chargeKg, 'generic', 'kg'), num('Raumvolumen', input.roomVolumeM3, 'generic', 'm³'), row('Aufstellort', label(input.installationLocation)), row('Aufstellungsort-Klassifikation', label(input.installationClass)), row('Zugangsbereich', label(input.accessArea)), row('Kategorie des Zugangsbereichs', label(input.accessCategory)), row('Nutzung', label(input.usageType)), row('Anwendungsart', label(input.applicationType)), row('Geschoss oder Lage', label(input.locationLevel)), row('Lüftung', label(input.ventilationType))] };
}
function refrigerantSafetySection(dto) {
  const safetyData = object(dto.assessment?.chargeLimit?.refrigerantSafetyData);
  return { title: '3. Kältemittel-Sicherheitsdaten', rows: [row('Sicherheitsklasse', safetyData.safetyClass), row('Toxizitätsklasse', safetyData.toxicityClass), row('Brennbarkeitsklasse', safetyData.flammabilityClass), num('Praktischer Grenzwert', safetyData.practicalLimitKgM3, 'generic', 'kg/m³'), num('ATEL- oder ODL-Grenzwert', safetyData.atelOdlKgM3, 'generic', 'kg/m³'), num('Untere Explosionsgrenze LFL', safetyData.lflKgM3, 'generic', 'kg/m³'), num('Dampfdichte bei 25 °C und 101,3 kPa', safetyData.vaporDensity25C1013KpaKgM3, 'generic', 'kg/m³')] };
}
function chargeLimitSection(dto) {
  const chargeLimit = object(dto.assessment?.chargeLimit);
  const rows = [row('Bewertung', status(chargeLimit.status)), num('Kältemittelkonzentration im Raum', chargeLimit.concentrationKgM3, 'generic', 'kg/m³'), num('Maximal zulässige Füllmenge', chargeLimit.maximumAllowedChargeKg, 'generic', 'kg')];
  array(chargeLimit.checks).forEach(check => { rows.push(row(checkLabel(check.id), status(check.status), sourceLabel(check.source))); if (check.maximumChargeKg != null) rows.push(num(`${checkLabel(check.id)} – Grenzwert`, check.maximumChargeKg, 'generic', 'kg')); });
  return { title: '4. Füllmengenbewertung nach EN 378-1 Anhang C', rows };
}
function alternativeRiskSection(dto) {
  const assessment = object(dto.assessment?.alternativeRiskMeasures);
  const rows = [row('Bewertung', status(assessment.status)), num('Erforderliche Mindestanzahl', assessment.requiredMeasureCount, 'integer'), num('Ausgewählte Maßnahmen', assessment.selectedMeasureCount, 'integer'), num('Maximaler C.3-Grenzwert', assessment.maximumChargeKg, 'generic', 'kg')];
  const details = object(assessment.details);
  rows.push(num('Erforderliche Öffnungsfläche', details.openingAreaM2, 'generic', 'm²'));
  rows.push(num('Vereinfachter mechanischer Luftstrom', details.mechanicalVentilationFlowM3h, 'generic', 'm³/h'));
  array(assessment.requirements).forEach(item => rows.push(row(item.title || checkLabel(item.id), `${status(item.status)}: ${item.measure || item.requirement || 'prüfen'}`, sourceLabel(item.source))));
  return { title: '5. Alternative Vorkehrungen nach EN 378-1 C.3', rows, singleColumn: true };
}
function safetyComponentsSection(dto) {
  const installationSafety = object(dto.assessment?.installationSafety);
  const rows = [row('Bewertung', status(installationSafety.status))];
  array(installationSafety.requirements).forEach(item => rows.push(row(item.title || checkLabel(item.id), `${status(item.status)}: ${item.measure || item.requirement || 'prüfen'}`, sourceLabel(item.source))));
  return { title: '6. Sicherheitskomponenten nach EN 378-3', rows, singleColumn: true };
}
function guidanceSection(dto) {
  const guidance = object(dto.plannerGuidance || dto.assessment?.plannerGuidance);
  const rows = [];
  array(guidance.groups).forEach(group => { rows.push(row(group.title || 'Leitfaden', '')); array(group.items).forEach(item => rows.push(row(item.title, `${status(item.status)}: ${item.measure || item.requirement}`, item.sourceLabel || ''))); });
  if (!rows.length) rows.push(row('Planer-Leitfaden', guidance.summary || 'Keine zusätzlichen Maßnahmen ermittelt.'));
  return { title: '7. Planer-Leitfaden', rows, singleColumn: true };
}
function confirmedSection(dto) {
  const guidance = object(dto.plannerGuidance || dto.assessment?.plannerGuidance);
  const rows = array(guidance.confirmedItems).map(item => row(item.title, `${status(item.status)}: ${item.requirement || item.measure}`, item.sourceLabel || ''));
  return { title: '8. Bestätigte Prüfpunkte', rows: rows.length ? rows : [row('Status', 'Keine bestätigten Prüfpunkte ausgewiesen.')], singleColumn: true };
}
function sourcesSection(dto) {
  const metadata = object(dto.metadata);
  const dataVersions = object(dto.dataVersions);
  return { title: '9. Datenstand und Berichtserstellung', rows: [row('Erzeugt am', formatDateOnly(metadata.generatedAt)), row('Berichtstyp', 'EN-378-Sicherheitsbericht'), row('Kältemitteldaten', dataVersions.refrigerants), row('EN-378-Sicherheitsdaten', dataVersions.en378SafetyData), row('GWP-Daten', dataVersions.gwp)] };
}
export function buildEN378ReportSections(dto = {}) {
  if (object(dto.metadata).dtoType !== 'techcalc.en-378-safety-check.report') return [];
  return [summarySection(dto), importedSystemSection(dto), refrigerantSafetySection(dto), chargeLimitSection(dto), alternativeRiskSection(dto), safetyComponentsSection(dto), guidanceSection(dto), confirmedSection(dto), sourcesSection(dto)].map(section => ({ ...section, isLineSection: false }));
}
export default buildEN378ReportSections;
