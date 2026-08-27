const STATUS_LABELS = Object.freeze({
  prohibited: 'unzulässig',
  'exception-applies': 'Ausnahme anwendbar',
  'no-prohibition-found': 'keine Beschränkung ermittelt',
  'manual-review': 'manuelle Rechtsprüfung erforderlich',
  incomplete: 'Bewertung unvollständig',
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

const INPUT_FIELD_LABELS = Object.freeze({
  assessmentDate: 'Bewertungsdatum', placedOnMarketDate: 'Erstmaliges Inverkehrbringen', installedAtSiteDate: 'Errichtung am Aufstellungsort', applicationType: 'Anlagenart', installationType: 'Aufstellung', mobileEquipmentType: 'Art der mobilen Einrichtung', productCategory: 'Produkt-/Anlagenkategorie', constructionType: 'Bauform', splitType: 'Split-Systemart', ratedCapacityKw: 'Nennleistung', refrigerantId: 'Kältemittel', chargeKg: 'Füllmenge', plannedActivity: 'Aktuell zu prüfende Tätigkeit', refrigerantOrigin: 'Herkunft des Servicekältemittels', preChargedStatus: 'Einrichtung vorbefüllt', leakDetectionSystemStatus: 'Leckage-Erkennungssystem vorhanden', hermeticallySealedStatus: 'Hermetisch geschlossen', hermeticallySealedLabelStatus: 'Als hermetisch geschlossen gekennzeichnet', coolingBelowMinus50Status: 'Kühlung von Erzeugnissen unter −50 °C', siteSafetyRestrictionStatus: 'Standortbezogene Sicherheitsanforderung verhindert niedrigeres GWP', nationalSafetyStandardRestrictionStatus: 'Nationale Sicherheitsnorm verhindert Alternative', cascadePrimaryCircuitStatus: 'Primärer Kältemittelkreislauf eines Kaskadensystems', specificRefrigerantLossPercent: 'Spezifischer Kältemittelverlust', personCertificationStatus: 'Sachkunde der natürlichen Person', companyCertificationStatus: 'Unternehmenszertifikat'
});

const DERIVED_FIELD_LABELS = Object.freeze({ gwp: 'GWP des ausgewählten Kältemittels', co2EquivalentTonnes: 'CO₂-Äquivalent', gasScope: 'Stoffklassifikation des Kältemittels', gasType: 'Kältemittelart', leakCheckRequired: 'abgeleitete Dichtheitskontrollpflicht', leakCheckIntervalMonths: 'abgeleitetes Prüfintervall der Dichtheitskontrolle', leakDetectionRequired: 'abgeleitete Pflicht zum Leckage-Erkennungssystem', annexIvCompliance: 'abgeleitete Anhang-IV-Konformität' });

export const formatFGasesStatus = value => STATUS_LABELS[value] || value || '—';
const fmt = (value, digits = 2) => value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('de-DE', { maximumFractionDigits: digits });
const boolLabel = value => value === true ? 'ja' : value === false ? 'nein' : '—';
const hasValue = value => value !== undefined && value !== null && value !== '';

function legalSourceLabel(source = '') {
  const value = String(source);
  let match = value.match(/^EU-FGAS:Art\.(\d+)(?:\((\d+)\))?$/);
  if (match) return `Verordnung (EU) 2024/573, Art. ${match[1]}${match[2] ? ` Abs. ${match[2]}` : ''}`;
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

function serviceLabel(details = {}) {
  if (details.status === 'prohibited') return 'Wartung/Instandhaltung mit dem angegebenen Servicekältemittel unzulässig';
  if (details.status === 'allowed-under-exception') return 'Wartung/Instandhaltung nur unter gesetzlicher Ausnahme zulässig';
  if (details.status === 'no-prohibition-found') return 'Keine Servicebeschränkung aus den geprüften F-Gas-Regeln ermittelt';
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
function serviceScenarioRows(details = {}) { return (details.originScenarios || []).map(item => ({ label: `Servicekältemittel: ${originLabel(item.refrigerantOrigin)}`, value: serviceLabel({ status: item.status }) })); }

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

function dataReferenceRows() {
  return [
    { label: 'Kältemitteldaten – Quelle', value: 'Umweltbundesamt – Treibhauspotentiale (GWP) ausgewählter Verbindungen und Gemische, Stand März 2026' },
    { label: 'GWP-Daten – Rechtsbezug', value: 'Verordnung (EU) 2024/573 und Umweltbundesamt, Datenstand März 2026' },
    { label: 'Rechtsgrundlagen', value: 'Verordnung (EU) 2024/573; Chemikaliengesetz (ChemG); Chemikalien-Klimaschutzverordnung (ChemKlimaschutzV)' }
  ];
}

function unresolvedInputMessages(entries = [], state = {}, context = {}) {
  const fields = new Map();
  for (const entry of entries) {
    for (const reason of entry.reasons || []) {
      const normalizedReason = reason === 'assessment-date' ? 'assessmentDate' : reason;
      const isInput = Boolean(INPUT_FIELD_LABELS[normalizedReason]);
      const isDerived = Boolean(DERIVED_FIELD_LABELS[normalizedReason]);
      if (!isInput && !isDerived) continue;
      if (isInput && hasValue(state[normalizedReason])) continue;
      if (isDerived && hasValue(context[normalizedReason])) continue;
      if (!fields.has(normalizedReason)) fields.set(normalizedReason, { isInput, sources: new Set() });
      fields.get(normalizedReason).sources.add(legalSourceLabel(entry.rule?.legalSource || entry.rule?.id || 'Regel'));
    }
  }

  return [...fields.entries()].map(([field, detail]) => {
    if (detail.isInput) {
      if (field === 'assessmentDate') return 'Bitte Eingabefeld „Bewertungsdatum“ ausfüllen. Das Datum wird für die zeitbezogene Prüfung der anwendbaren Rechtsregeln benötigt.';
      const sources = [...detail.sources].join('; ');
      return `Bitte Eingabefeld „${INPUT_FIELD_LABELS[field]}“ ausfüllen.${sources ? ` Betroffene Rechtsgrundlage${detail.sources.size > 1 ? 'n' : ''}: ${sources}.` : ''}`;
    }
    const sources = [...detail.sources].join('; ');
    return `Die ${DERIVED_FIELD_LABELS[field]} kann noch nicht bestimmt werden. Bitte die dafür erforderlichen Anlagen- und Kältemittelangaben prüfen.${sources ? ` Betroffene Rechtsgrundlage${detail.sources.size > 1 ? 'n' : ''}: ${sources}.` : ''}`;
  });
}

export function buildFGasesResultModel(state = {}, result = {}) {
  const leak = result.leakCheckDetails || {};
  const service = result.serviceDetails || {};
  const docs = result.documentationDetails || {};
  const duties = result.operatorDutyDetails || {};
  const allEvaluations = [...(result.regulationEvaluation || []), ...(result.lifecycleRegulationEvaluation || [])];
  const manualRules = [...new Set(allEvaluations.filter(entry => entry.status === 'manual-review').map(entry => entry.rule?.legalSource || entry.rule?.id).filter(Boolean))];
  const unresolved = allEvaluations.filter(entry => entry.status === 'unresolved');
  const unresolvedMessages = unresolvedInputMessages(unresolved, state, result.regulatoryContext || {});
  const notices = [];
  if (manualRules.length) notices.push({ title: 'Manuelle Rechtsprüfung', messages: [`Nicht automatisch entscheidbar: ${manualRules.map(legalSourceLabel).join(', ')}`], prefix: 'Hinweis' });
  if (unresolvedMessages.length) notices.push({ title: 'Unvollständige Bewertung', messages: unresolvedMessages, prefix: 'Hinweis' });

  return {
    primary: {
      title: 'Regulatorische Gesamtübersicht',
      primary: { label: 'Inverkehrbringen', value: placingOnMarketLabel(result.checks?.placingOnMarket) },
      rows: [
        { label: 'Wartung / Instandhaltung', value: serviceLabel(service) },
        { label: 'Dichtheitskontrolle', value: leakCheckLabel(leak) },
        { label: 'Dokumentation', value: formatFGasesStatus(result.checks?.documentation) },
        { label: 'Zertifizierung', value: formatFGasesStatus(result.checks?.certification) },
        { label: 'Betreiberpflichten', value: formatFGasesStatus(result.checks?.operatorDuties) }
      ]
    },
    groups: [
      { title: 'Bewertungsumfang', rows: [{ label: 'Prüfmodell', value: 'Vollständige Anlagenprüfung über Installation, Wartung/Instandhaltung, Reparatur, Dichtheitskontrolle, Rückgewinnung und Außerbetriebnahme' }, { label: 'Aktuell ausgewählte Tätigkeit', value: state.plannedActivity || '—' }] },
      { title: 'Kältemittel und Klimawirkung', rows: [{ label: 'Kältemittel', value: result.refrigerant?.name || state.refrigerantId || '—' }, { label: 'GWP nach F-Gas-Verordnung', value: result.gwp ?? '—' }, { label: 'Füllmenge', value: fmt(result.chargeKg, 3), unit: 'kg' }, { label: 'CO₂-Äquivalent', value: fmt(result.co2EquivalentTonnes, 3), unit: 't' }, ...dataReferenceRows()] },
      { title: 'Wartung und Instandhaltung', rows: [{ label: 'Gesamtbewertung', value: serviceLabel(service) }, ...serviceScenarioRows(service)] },
      { title: 'Dichtheitskontrolle', rows: [{ label: 'Bewertung', value: leakCheckLabel(leak) }, { label: 'Erforderlich', value: boolLabel(leak.required) }, { label: 'Prüfintervall', value: leak.intervalMonths ?? '—', unit: leak.intervalMonths ? 'Monate' : '' }, { label: 'Leckage-Erkennungssystem verpflichtend', value: boolLabel(leak.leakDetectionRequired) }] },
      { title: 'Dokumentationspflichten', rows: obligationRows(docs.obligations || []).length ? obligationRows(docs.obligations || []) : [{ label: 'Status', value: formatFGasesStatus(docs.status) }] },
      { title: 'Betreiberpflichten', rows: obligationRows(duties.obligations || []).length ? obligationRows(duties.obligations || []) : [{ label: 'Status', value: formatFGasesStatus(duties.status) }] }
    ],
    notices
  };
}

export default buildFGasesResultModel;
