import {
  createRegulatoryContext,
  evaluateRegulations,
  getDataStatus,
  getDataVersions,
  getGwp,
  getRefrigerant
} from '../../utils/refrigerants/index.js';

function finiteNumber(value) {
  if (value == null || String(value).trim() === '') return null;
  const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function activeEvaluations(evaluations, category) {
  return evaluations.filter(entry => entry.rule.categories?.includes(category) && entry.status !== 'inactive' && entry.status !== 'not-matched');
}

function aggregatePlacingOnMarket(snapshot, evaluations) {
  if (!snapshot.productCategory) return 'not-specified';
  const relevant = activeEvaluations(evaluations, 'annex-iv');
  if (relevant.some(entry => entry.status === 'manual-review')) return 'manual-review';
  if (relevant.some(entry => entry.status === 'matched' && entry.rule.effect === 'placing-on-market-prohibited')) return 'prohibited';
  if (relevant.some(entry => entry.status === 'matched-with-unresolved-exception')) return 'incomplete';
  if (relevant.some(entry => entry.status === 'unresolved')) return 'incomplete';
  if (relevant.some(entry => entry.status === 'exception-applies')) return 'exception-applies';
  return 'no-prohibition-found';
}

function aggregateService(snapshot, evaluations) {
  if (!['maintenance', 'repair'].includes(snapshot.plannedActivity)) return 'not-applicable';
  const relevant = activeEvaluations(evaluations, 'service');
  const exceptionMatched = relevant.some(entry => entry.status === 'matched' && entry.rule.effect === 'service-exception');
  const prohibitionMatched = relevant.some(entry => entry.status === 'matched' && entry.rule.effect === 'service-prohibited');
  if (exceptionMatched) return 'allowed-under-exception';
  if (prohibitionMatched) return 'prohibited';
  if (relevant.some(entry => ['unresolved', 'matched-with-unresolved-exception', 'manual-review'].includes(entry.status))) return 'incomplete';
  return 'no-prohibition-found';
}

function aggregateCertification(snapshot, evaluations) {
  const relevant = activeEvaluations(evaluations, 'certification');
  if (!relevant.length) return 'not-applicable';
  const personRequired = relevant.some(entry => ['matched', 'matched-with-unresolved-exception'].includes(entry.status) && ['FG-050', 'FG-053', 'FG-054'].includes(entry.rule.id));
  const companyRequired = relevant.some(entry => ['matched', 'matched-with-unresolved-exception'].includes(entry.status) && entry.rule.id === 'FG-051');
  if (personRequired && snapshot.personCertificationStatus === 'not-verified') return 'required-not-verified';
  if (companyRequired && snapshot.companyCertificationStatus === 'not-verified') return 'required-not-verified';
  if (personRequired && !snapshot.personCertificationStatus) return 'incomplete';
  if (companyRequired && !snapshot.companyCertificationStatus) return 'incomplete';
  if ((personRequired && snapshot.personCertificationStatus === 'verified') || (companyRequired && snapshot.companyCertificationStatus === 'verified')) return 'verified';
  return 'not-applicable';
}

export function calculate(snapshot = {}) {
  const refrigerant = getRefrigerant(snapshot.refrigerantId);
  const gwp = getGwp(snapshot.refrigerantId);
  const chargeKg = finiteNumber(snapshot.chargeKg);
  const dataStatus = getDataStatus();
  const dataVersions = getDataVersions();
  const canCalculateCo2Equivalent = chargeKg != null && gwp != null;
  const regulatoryContext = createRegulatoryContext(snapshot);
  const regulationEvaluation = evaluateRegulations(regulatoryContext);

  return Object.freeze({
    status: canCalculateCo2Equivalent ? 'calculated' : 'not-specified',
    refrigerant,
    gwp,
    chargeKg,
    co2EquivalentTonnes: canCalculateCo2Equivalent ? (chargeKg * gwp) / 1000 : null,
    regulatoryContext,
    regulationEvaluation,
    applicableRegulations: regulationEvaluation
      .filter(entry => ['matched', 'exception-applies', 'matched-with-unresolved-exception', 'manual-review'].includes(entry.status))
      .map(entry => entry.rule),
    dataStatus,
    dataVersions,
    checks: Object.freeze({
      placingOnMarket: aggregatePlacingOnMarket(snapshot, regulationEvaluation),
      service: aggregateService(snapshot, regulationEvaluation),
      leakCheck: 'not-specified',
      documentation: 'not-specified',
      certification: aggregateCertification(snapshot, regulationEvaluation),
      operatorDuties: 'not-specified'
    })
  });
}

export default calculate;
