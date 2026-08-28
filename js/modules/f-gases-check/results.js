const STATUS_LABELS = Object.freeze({ prohibited: 'unzulässig', 'exception-applies': 'Ausnahme anwendbar', 'no-prohibition-found': 'keine Beschränkung ermittelt', 'manual-review': 'manuelle Rechtsprüfung erforderlich', incomplete: 'Bewertung unvollständig', 'not-specified': 'nicht bewertet', 'not-applicable': 'nicht anwendbar', 'allowed-under-exception': 'unter gesetzlicher Ausnahme zulässig', required: 'erforderlich', 'not-required': 'nicht erforderlich', verified: 'nachgewiesen', 'required-not-verified': 'erforderlich, nicht nachgewiesen', 'non-compliant': 'Anforderung nicht erfüllt', 'requirements-identified': 'Pflichten erfüllt' });
const INPUT_FIELD_LABELS = Object.freeze({ placedOnMarketDate: 'Erstmaliges Inverkehrbringen', commissioningDate: 'Erstmalige Inbetriebnahme', stockAssessmentDate: 'Prüfdatum der Bestandsanlage', applicationType: 'Anlagenart', installationType: 'Aufstellung', mobileEquipmentType: 'Art der mobilen Einrichtung', productCategory: 'Produkt-/Anlagenkategorie', constructionType: 'Bauform', splitType: 'Split-Systemart', ratedCapacityKw: 'Nennleistung', refrigerantId: 'Kältemittel', chargeKg: 'Füllmenge', plannedActivity: 'Aktuell zu prüfende Tätigkeit', refrigerantOrigin: 'Herkunft des Servicekältemittels', preChargedStatus: 'Einrichtung vorbefüllt', leakDetectionSystemStatus: 'Leckage-Erkennungssystem vorhanden', hermeticallySealedStatus: 'Hermetisch geschlossen', hermeticallySealedLabelStatus: 'Als hermetisch geschlossen gekennzeichnet', coolingBelowMinus50Status: 'Kühlung von Erzeugnissen unter −50 °C', siteSafetyRestrictionStatus: 'Standortbezogene Sicherheitsanforderung verhindert niedrigeres GWP', nationalSafetyStandardRestrictionStatus: 'Nationale Sicherheitsnorm verhindert Alternative', cascadePrimaryCircuitStatus: 'Primärer Kältemittelkreislauf eines Kaskadensystems', specificRefrigerantLossPercent: 'Spezifischer Kältemittelverlust', personCertificationStatus: 'Sachkunde der natürlichen Person', companyCertificationStatus: 'Unternehmenszertifikat' });
const BASE_REQUIRED_FIELDS = Object.freeze(['applicationType', 'installationType', 'productCategory', 'constructionType', 'ratedCapacityKw', 'refrigerantId', 'chargeKg', 'placedOnMarketDate', 'commissioningDate']);
const DATE_FIELDS = new Set(['placedOnMarketDate', 'commissioningDate', 'stockAssessmentDate']);
export const formatFGasesStatus = value => STATUS_LABELS[value] || value || '—';
const fmt = (value, digits = 2) => value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('de-DE', { maximumFractionDigits: digits });
const boolLabel = value => value === true ? 'ja' : value === false ? 'nein' : '—';
const hasValue = value => value !== undefined && value !== null && String(value).trim() !== '';
function validDateInput(value) {
  const raw = String(value ?? '').trim();
  let day; let month; let year;
  let match = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) [, day, month, year] = match;
  else { match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!match) return false; [, year, month, day] = match; }
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day);
}
function legalSourceLabel(source = '') {
  const value = String(source);
  let match = value.match(/^EU-FGAS:Art\.(\d+)(?:\((\d+)\))?$/);
  if (match) return `Verordnung (EU) 2024/573, Art. ${match[1]}${match[2] ? ` Abs. ${match[2]}` : ''}`;
  if (value === 'EU-FGAS:Art.17+AnnexVII') return 'Verordnung (EU) 2024/573, Art. 17 in Verbindung mit Anhang VII';
  match = value.match(/^DE-CHEMKLIMA:§(\d+)(?:\((\d+)\))?$/);
  if (match) return `Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § ${match[1]}${match[2] ? ` Abs. ${match[2]}` : ''}`;
  match = value.match(/^DE-CHEMG:§([\w]+)(?:\((\d+)\))?$/);
  if (match) return `Chemikaliengesetz (ChemG), § ${match[1]}${match[2] ? ` Abs. ${match[2]}` : ''}`;
  if (value.includes('EU-FGAS:Art.10+DE-CHEMKLIMA:§5')) return 'Verordnung (EU) 2024/573, Art. 10; Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § 5';
  if (value.includes('EU-FGAS:Art.10+DE-CHEMKLIMA:§10')) return 'Verordnung (EU) 2024/573, Art. 10; Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV), § 10';
  return value;
}
function placingOnMarketLabel(status) {
  if (status === 'prohibited') return 'Inverkehrbringen unzulässig';
  if (status === 'exception-applies') return 'Inverkehrbringen aufgrund einer gesetzlichen Ausnahme zulässig';
  if (status === 'no-prohibition-found') return 'Inverkehrbringen nach den geprüften Regeln zulässig';
  if (status === 'manual-review') return 'Manuelle Rechtsprüfung erforderlich';
  if (status === 'incomplete') return 'Bewertung des Inverkehrbringens unvollständig';
  return 'Inverkehrbringen nicht bewertet';
}
function procurementLabel(info) {
  if (!info) return 'keine HFKW-Quoteninformation anwendbar';
  if (info.status === 'quota-zero') return 'Neuware: unionsweite HFKW-Höchstmenge ab 2050 = 0 t CO₂-Äquivalent';
  const period = info.to ? `${info.from}–${info.to}` : `ab ${info.from}`;
  return `Neuware: unionsweite HFKW-Höchstmenge ${period} = ${Number(info.maxTonnesCo2e).toLocaleString('de-DE')} t CO₂-Äquivalent`;
}
function serviceLabel(details = {}) {
  if (details.status === 'prohibited') return 'Wartung/Instandhaltung mit dem angegebenen Servicekältemittel unzulässig';
  if (details.status === 'allowed-under-exception') return 'Wartung/Instandhaltung nur unter gesetzlicher Ausnahme zulässig';
  if (details.status === 'no-prohibition-found' && details.marketAvailability) return 'Kein direktes Serviceverbot; Beschaffung neuer HFKW quotenbedingt eingeschränkt';
  if (details.status === 'no-prohibition-found') return 'Keine direkte Servicebeschränkung aus den geprüften F-Gas-Regeln ermittelt';
  if (details.status === 'incomplete') return 'Servicebewertung unvollständig';
  return formatFGasesStatus(details.status);
}
function leakCheckLabel(leak = {}) {
  if (leak.status === 'required') return leak.intervalMonths ? `Dichtheitskontrolle erforderlich – Prüfintervall ${leak.intervalMonths} Monate` : 'Dichtheitskontrolle erforderlich';
  if (leak.status === 'exception-applies') return 'Dichtheitskontrolle nicht erforderlich – gesetzliche Ausnahme';
  if (leak.status === 'not-required') return 'Dichtheitskontrolle nicht erforderlich';
  if (leak.status === 'not-applicable') return 'Dichtheitskontrolle nicht im gesetzlichen Anwendungsbereich';
  if (leak.status === 'incomplete') return 'Bewertung der Dichtheitskontrolle unvollständig';
  return 'Dichtheitskontrolle nicht bewertet';
}
function originLabel(value) { return ({ new: 'neu', reclaimed: 'aufgearbeitet', recycled: 'recycelt' }[value] || value || '—'); }
function serviceScenarioRows(details = {}) { return (details.originScenarios || []).map(item => ({ label: `Servicekältemittel: ${originLabel(item.refrigerantOrigin)}`, value: serviceLabel(item) })); }
function obligationRows(items = []) {
  return items.map(item => {
    if (item.type === 'leak-check-records') return { label: 'Anlagenaufzeichnungen', value: `erforderlich · Aufbewahrung ${item.retentionYears} Jahre` };
    if (item.type === 'pre-ban-proof') return { label: 'Altprodukt-Nachweis', value: `erforderlich ab ${item.requiredFrom || '—'}` };
    if (item.type === 'german-pre-ban-declaration') return { label: 'Deutsche Altprodukt-Erklärung', value: 'erforderlich' };
    if (item.type === 'specific-refrigerant-loss') return { label: 'Maximaler spezifischer Kältemittelverlust', value: item.maximumPercent == null ? formatFGasesStatus(item.status) : fmt(item.maximumPercent), unit: item.maximumPercent == null ? '' : '%' };
    if (item.type === 'access-to-detachable-connections') return { label: 'Zugang zu lösbaren Verbindungen', value: 'sicherzustellen, soweit technisch möglich und zumutbar' };
    if (item.type === 'contractor-certification') return { label: 'Beauftragtes Unternehmen', value: 'Zertifizierung/Sachkunde prüfen' };
    if (item.type === 'certified-person-for-leak-check') return { label: 'Dichtheitskontrolle', value: 'durch sachkundige Person' };
    if (item.type === 'certified-person-for-recovery') return { label: 'Rückgewinnung', value: 'durch sachkundige Person' };
    return { label: item.id || 'Pflicht', value: item.type || 'erforderlich' };
  });
}
function dataReferenceRows() { return [{ label: 'Kältemitteldaten – Quelle', value: 'Umweltbundesamt – Treibhauspotentiale (GWP) ausgewählter Verbindungen und Gemische, Stand März 2026' }, { label: 'GWP-Daten – Rechtsbezug', value: 'Verordnung (EU) 2024/573 und Umweltbundesamt, Datenstand März 2026' }, { label: 'Rechtsgrundlagen', value: 'Verordnung (EU) 2024/573; Chemikaliengesetz (ChemG); Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV)' }]; }
function collectInputIssues(state = {}, result = {}) {
  const issues = new Map();
  const add = (field, source = '', reason = 'required') => {
    if (!INPUT_FIELD_LABELS[field]) return;
    if (!issues.has(field)) issues.set(field, { field, reason, sources: new Set() });
    if (source) issues.get(field).sources.add(legalSourceLabel(source));
    if (reason === 'invalid') issues.get(field).reason = 'invalid';
  };
  const required = [...BASE_REQUIRED_FIELDS, ...(state.plannedActivity && state.plannedActivity !== 'installation' ? ['stockAssessmentDate'] : [])];
  for (const field of required) {
    if (!hasValue(state[field])) add(field);
    else if (DATE_FIELDS.has(field) && !validDateInput(state[field])) add(field, '', 'invalid');
  }
  const inspectUnresolved = (entries, dateField) => {
    for (const entry of (entries || []).filter(item => item.status === 'unresolved')) {
      for (const rawReason of entry.reasons || []) {
        const field = rawReason === 'assessment-date' ? dateField : rawReason === 'installedAtSiteDate' ? 'commissioningDate' : rawReason;
        if (!INPUT_FIELD_LABELS[field]) continue;
        if (!hasValue(state[field])) add(field, entry.rule?.legalSource || entry.rule?.id);
        else if (DATE_FIELDS.has(field) && !validDateInput(state[field])) add(field, entry.rule?.legalSource || entry.rule?.id, 'invalid');
      }
    }
  };
  inspectUnresolved(result.placingOnMarketRegulationEvaluation, 'placedOnMarketDate');
  inspectUnresolved(result.regulationEvaluation, state.plannedActivity === 'installation' ? 'commissioningDate' : 'stockAssessmentDate');
  inspectUnresolved(result.lifecycleRegulationEvaluation, state.plannedActivity === 'installation' ? 'commissioningDate' : 'stockAssessmentDate');
  const lossDuty = (result.operatorDutyDetails?.obligations || []).find(item => item.type === 'specific-refrigerant-loss');
  if (lossDuty?.status === 'applies' && !hasValue(state.specificRefrigerantLossPercent)) add('specificRefrigerantLossPercent', 'DE-CHEMKLIMA:§2(1)');
  if (lossDuty?.status === 'incomplete') {
    if (!hasValue(state.chargeKg)) add('chargeKg', 'DE-CHEMKLIMA:§2(1)');
    if (!hasValue(state.commissioningDate)) add('commissioningDate', 'DE-CHEMKLIMA:§2(1)');
  }
  if (result.checks?.service === 'incomplete' && !hasValue(state.refrigerantOrigin)) add('refrigerantOrigin', 'EU-FGAS:Art.13(3)');
  if (result.checks?.certification === 'incomplete') {
    const matched = new Set((result.lifecycleRegulationEvaluation || []).filter(entry => ['matched', 'matched-with-unresolved-exception'].includes(entry.status)).map(entry => entry.rule?.id));
    if ((matched.has('FG-050') || matched.has('FG-053') || matched.has('FG-054')) && !hasValue(state.personCertificationStatus)) add('personCertificationStatus', 'EU-FGAS:Art.10+DE-CHEMKLIMA:§5');
    if (matched.has('FG-051') && !hasValue(state.companyCertificationStatus)) add('companyCertificationStatus', 'EU-FGAS:Art.10+DE-CHEMKLIMA:§10');
  }
  return [...issues.values()];
}
function inputIssueMessages(issues = []) {
  return issues.map(issue => {
    const label = INPUT_FIELD_LABELS[issue.field];
    const sources = [...issue.sources];
    if (issue.reason === 'invalid' && DATE_FIELDS.has(issue.field)) return `Bitte Eingabefeld „${label}“ im Format TT.MM.JJJJ ausfüllen.`;
    if (issue.field === 'stockAssessmentDate') return 'Bitte Eingabefeld „Prüfdatum der Bestandsanlage“ ausfüllen. Dieser Stichtag bestimmt die für die Bestandsprüfung anzuwendende Rechtslage.';
    const sourceText = sources.length ? ` Rechtsgrundlage${sources.length > 1 ? 'n' : ''}: ${sources.join('; ')}.` : '';
    return `Bitte Eingabefeld „${label}“ ausfüllen.${sourceText}`;
  });
}
function legalDateWarningMessages(warnings = []) {
  return warnings.map(item => `Der Stichtag im Feld „${INPUT_FIELD_LABELS[item.field] || item.field}“ liegt vor dem Beginn der hinterlegten Rechtsgrundlage ${item.source} (${item.validFrom.split('-').reverse().join('.')}). Die für diesen Zeitpunkt geltende Rechtslage ist eigenständig zu prüfen.`);
}
export function buildFGasesResultModel(state = {}, result = {}) {
  const leak = result.leakCheckDetails || {}, service = result.serviceDetails || {}, docs = result.documentationDetails || {}, duties = result.operatorDutyDetails || {};
  const allEvaluations = [...(result.placingOnMarketRegulationEvaluation || []), ...(result.regulationEvaluation || []), ...(result.lifecycleRegulationEvaluation || [])];
  const manualRules = [...new Set(allEvaluations.filter(entry => entry.status === 'manual-review').map(entry => entry.rule?.legalSource || entry.rule?.id).filter(Boolean))];
  const inputIssues = collectInputIssues(state, result);
  const notices = [];
  if (manualRules.length) notices.push({ title: 'Manuelle Rechtsprüfung', messages: [`Nicht automatisch entscheidbar: ${manualRules.map(legalSourceLabel).join(', ')}`], prefix: 'Hinweis' });
  if (inputIssues.length) notices.push({ title: 'Unvollständige Bewertung', messages: inputIssueMessages(inputIssues), prefix: 'Hinweis' });
  if (result.legalDateWarnings?.length) notices.push({ title: 'Hinweis zum Rechtsstand', messages: legalDateWarningMessages(result.legalDateWarnings), prefix: 'Hinweis' });
  return {
    primary: { title: 'Regulatorische Gesamtübersicht', primary: { label: 'Inverkehrbringen', value: placingOnMarketLabel(result.checks?.placingOnMarket) }, rows: [{ label: 'Wartung / Instandhaltung', value: serviceLabel(service) }, { label: 'Dichtheitskontrolle', value: leakCheckLabel(leak) }, { label: 'Dokumentation', value: formatFGasesStatus(result.checks?.documentation) }, { label: 'Zertifizierung', value: formatFGasesStatus(result.checks?.certification) }, { label: 'Betreiberpflichten', value: formatFGasesStatus(result.checks?.operatorDuties) }] },
    groups: [
      { title: 'Bewertungsumfang', rows: [{ label: 'Prüfmodell', value: 'Vollständige Anlagenprüfung über Installation, Wartung/Instandhaltung, Reparatur, Dichtheitskontrolle, Rückgewinnung und Außerbetriebnahme' }, { label: 'Aktuell ausgewählte Tätigkeit', value: state.plannedActivity || '—' }] },
      { title: 'Kältemittel und Klimawirkung', rows: [{ label: 'Kältemittel', value: result.refrigerant?.name || state.refrigerantId || '—' }, { label: 'GWP nach F-Gas-Verordnung', value: result.gwp ?? '—' }, { label: 'Füllmenge', value: fmt(result.chargeKg, 3), unit: 'kg' }, { label: 'CO₂-Äquivalent', value: fmt(result.co2EquivalentTonnes, 3), unit: 't' }, ...dataReferenceRows()] },
      { title: 'Wartung und Instandhaltung', rows: [{ label: 'Gesamtbewertung', value: serviceLabel(service) }, ...serviceScenarioRows(service), ...(service.marketAvailability ? [{ label: 'Beschaffung neues HFKW-haltiges Kältemittel', value: procurementLabel(service.marketAvailability) }, { label: 'Rechtsgrundlage Beschaffung', value: 'Art. 17 in Verbindung mit Anhang VII der Verordnung (EU) 2024/573' }] : [])] },
      { title: 'Dichtheitskontrolle', rows: [{ label: 'Bewertung', value: leakCheckLabel(leak) }, { label: 'Erforderlich', value: boolLabel(leak.required) }, { label: 'Prüfintervall', value: leak.intervalMonths ?? '—', unit: leak.intervalMonths ? 'Monate' : '' }, { label: 'Leckage-Erkennungssystem verpflichtend', value: boolLabel(leak.leakDetectionRequired) }] },
      { title: 'Dokumentationspflichten', rows: obligationRows(docs.obligations || []).length ? obligationRows(docs.obligations || []) : [{ label: 'Status', value: formatFGasesStatus(docs.status) }] },
      { title: 'Betreiberpflichten', rows: obligationRows(duties.obligations || []).length ? obligationRows(duties.obligations || []) : [{ label: 'Status', value: formatFGasesStatus(duties.status) }] }
    ], notices
  };
}
export default buildFGasesResultModel;
