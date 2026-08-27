const statusLabel = value => ({
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
  'requirements-identified': 'Pflichten ermittelt'
}[value] || value || '—');

const fmt = (value, digits = 2) => value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('de-DE', { maximumFractionDigits: digits });
const boolLabel = value => value === true ? 'ja' : value === false ? 'nein' : '—';

function obligationRows(items = []) {
  return items.map(item => {
    if (item.type === 'leak-check-records') return { label: 'Anlagenaufzeichnungen', value: `erforderlich · Aufbewahrung ${item.retentionYears} Jahre` };
    if (item.type === 'pre-ban-proof') return { label: 'Altprodukt-Nachweis', value: `erforderlich ab ${item.requiredFrom || '—'}` };
    if (item.type === 'german-pre-ban-declaration') return { label: 'Deutsche Altprodukt-Erklärung', value: 'erforderlich' };
    if (item.type === 'specific-refrigerant-loss') return { label: 'Max. spezifischer Kältemittelverlust', value: item.maximumPercent == null ? statusLabel(item.status) : fmt(item.maximumPercent), unit: item.maximumPercent == null ? '' : '%' };
    if (item.type === 'access-to-detachable-connections') return { label: 'Zugang zu lösbaren Verbindungen', value: 'sicherzustellen, soweit technisch möglich und zumutbar' };
    if (item.type === 'contractor-certification') return { label: 'Beauftragtes Unternehmen', value: 'Zertifizierung/Sachkunde prüfen' };
    if (item.type === 'certified-person-for-leak-check') return { label: 'Dichtheitskontrolle', value: 'durch sachkundige Person' };
    if (item.type === 'certified-person-for-recovery') return { label: 'Rückgewinnung', value: 'durch sachkundige Person' };
    return { label: item.id || 'Pflicht', value: item.type || 'erforderlich' };
  });
}

export function buildFGasesResultModel(state = {}, result = {}) {
  const leak = result.leakCheckDetails || {};
  const docs = result.documentationDetails || {};
  const duties = result.operatorDutyDetails || {};
  const manualRules = (result.regulationEvaluation || []).filter(entry => entry.status === 'manual-review').map(entry => entry.rule?.legalSource || entry.rule?.id).filter(Boolean);
  const unresolved = (result.regulationEvaluation || []).filter(entry => entry.status === 'unresolved');
  const notices = [];
  if (manualRules.length) notices.push({ title: 'Manuelle Rechtsprüfung', messages: [`Nicht automatisch entscheidbar: ${manualRules.join(', ')}`], prefix: 'Hinweis' });
  if (unresolved.length) notices.push({ title: 'Unvollständige Bewertung', messages: ['Für einzelne Regeln fehlen rechtlich erforderliche Eingaben. Fehlende Angaben werden nicht als Freigabe gewertet.'], prefix: 'Hinweis' });

  return {
    primary: {
      title: 'Regulatorische Gesamtübersicht',
      primary: { label: 'Inverkehrbringen', value: statusLabel(result.checks?.placingOnMarket) },
      rows: [
        { label: 'Service / Wartung', value: statusLabel(result.checks?.service) },
        { label: 'Dichtheitskontrolle', value: statusLabel(result.checks?.leakCheck) },
        { label: 'Dokumentation', value: statusLabel(result.checks?.documentation) },
        { label: 'Zertifizierung', value: statusLabel(result.checks?.certification) },
        { label: 'Betreiberpflichten', value: statusLabel(result.checks?.operatorDuties) }
      ]
    },
    groups: [
      {
        title: 'Kältemittel und Klimawirkung',
        rows: [
          { label: 'Kältemittel', value: result.refrigerant?.name || state.refrigerantId || '—' },
          { label: 'GWP nach F-Gas-VO', value: result.gwp ?? '—' },
          { label: 'Füllmenge', value: fmt(result.chargeKg, 3), unit: 'kg' },
          { label: 'CO₂-Äquivalent', value: fmt(result.co2EquivalentTonnes, 3), unit: 't' },
          { label: 'Kältemitteldaten', value: result.dataVersions?.refrigerants || '—' },
          { label: 'GWP-Daten', value: result.dataVersions?.gwp || '—' },
          { label: 'Rechtsdaten', value: result.dataVersions?.regulations || '—' }
        ]
      },
      {
        title: 'Dichtheitskontrolle',
        rows: [
          { label: 'Pflicht', value: boolLabel(leak.required) },
          { label: 'Prüfintervall', value: leak.intervalMonths ?? '—', unit: leak.intervalMonths ? 'Monate' : '' },
          { label: 'Leckage-Erkennungssystem verpflichtend', value: boolLabel(leak.leakDetectionRequired) },
          { label: 'Status', value: statusLabel(leak.status) }
        ]
      },
      { title: 'Dokumentationspflichten', rows: obligationRows(docs.obligations || []).length ? obligationRows(docs.obligations || []) : [{ label: 'Status', value: statusLabel(docs.status) }] },
      { title: 'Betreiberpflichten', rows: obligationRows(duties.obligations || []).length ? obligationRows(duties.obligations || []) : [{ label: 'Status', value: statusLabel(duties.status) }] }
    ],
    notices
  };
}

export default buildFGasesResultModel;
