import { createRegulatoryContext, evaluateRegulations, getDataStatus, getDataVersions, getGwp, getRefrigerant } from '../../utils/refrigerants/index.js';

const finiteNumber = value => {
  if (value == null || String(value).trim() === '') return null;
  const number = Number(typeof value === 'string' ? value.replace(',', '.') : value);
  return Number.isFinite(number) ? number : null;
};
const active = (evaluations, category) => evaluations.filter(entry => entry.rule.categories?.includes(category) && !['inactive', 'not-matched'].includes(entry.status));

function aggregatePlacingOnMarket(snapshot, evaluations) {
  if (!snapshot.productCategory) return 'not-specified';
  const relevant = active(evaluations, 'annex-iv');
  if (relevant.some(entry => entry.status === 'manual-review')) return 'manual-review';
  if (relevant.some(entry => entry.status === 'matched' && entry.rule.effect === 'placing-on-market-prohibited')) return 'prohibited';
  if (relevant.some(entry => ['matched-with-unresolved-exception', 'unresolved'].includes(entry.status))) return 'incomplete';
  if (relevant.some(entry => entry.status === 'exception-applies')) return 'exception-applies';
  return 'no-prohibition-found';
}
function aggregateService(snapshot, evaluations) {
  if (!['maintenance', 'repair'].includes(snapshot.plannedActivity)) return 'not-applicable';
  const relevant = active(evaluations, 'service');
  if (relevant.some(entry => entry.status === 'matched' && entry.rule.effect === 'service-exception')) return 'allowed-under-exception';
  if (relevant.some(entry => entry.status === 'matched' && entry.rule.effect === 'service-prohibited')) return 'prohibited';
  if (relevant.some(entry => ['unresolved', 'matched-with-unresolved-exception', 'manual-review'].includes(entry.status))) return 'incomplete';
  return 'no-prohibition-found';
}
function aggregateCertification(snapshot, evaluations) {
  const relevant = active(evaluations, 'certification');
  if (!relevant.length) return 'not-applicable';
  const personRequired = relevant.some(entry => ['matched', 'matched-with-unresolved-exception'].includes(entry.status) && ['FG-050', 'FG-053', 'FG-054'].includes(entry.rule.id));
  const companyRequired = relevant.some(entry => ['matched', 'matched-with-unresolved-exception'].includes(entry.status) && entry.rule.id === 'FG-051');
  if ((personRequired && snapshot.personCertificationStatus === 'not-verified') || (companyRequired && snapshot.companyCertificationStatus === 'not-verified')) return 'required-not-verified';
  if ((personRequired && !snapshot.personCertificationStatus) || (companyRequired && !snapshot.companyCertificationStatus)) return 'incomplete';
  if ((!personRequired || snapshot.personCertificationStatus === 'verified') && (!companyRequired || snapshot.companyCertificationStatus === 'verified')) return 'verified';
  return 'not-applicable';
}
function germanyLossLimit(context) {
  if (context.installationType !== 'stationary' || !['refrigeration', 'air-conditioning', 'heat-pump'].includes(context.applicationType)) return null;
  if (!context.gasScope.includes('annex-i') && !context.gasScope.includes('annex-ii-group-1')) return null;
  if (context.hermeticallySealedStatus === 'yes' && context.hermeticallySealedLabelStatus === 'yes') return { status: 'exception-applies', maximumPercent: null };
  const charge = finiteNumber(context.chargeKg);
  if (charge == null) return { status: 'incomplete', maximumPercent: null };
  if (context.applicationType === 'refrigeration' && context.constructionType === 'self-contained' && charge >= 3) return { status: 'applies', maximumPercent: 1 };
  const installed = Date.parse(`${context.installedAtSiteDate || ''}T00:00:00Z`);
  if (!Number.isFinite(installed)) return { status: 'incomplete', maximumPercent: null };
  const band = charge < 10 ? 0 : charge <= 100 ? 1 : 2;
  if (installed > Date.parse('2008-06-30T00:00:00Z')) return { status: 'applies', maximumPercent: [3, 2, 1][band] };
  if (installed > Date.parse('2005-06-30T00:00:00Z')) return { status: 'applies', maximumPercent: [6, 4, 2][band] };
  return { status: 'applies', maximumPercent: [8, 6, 4][band] };
}
function aggregateLeakCheck(context) {
  return { status: context.leakCheckStatus, required: context.leakCheckRequired, intervalMonths: context.leakCheckIntervalMonths, leakDetectionRequired: context.leakDetectionRequired };
}
function aggregateDocumentation(context, evaluations) {
  const obligations = [];
  if (context.leakCheckRequired === true) obligations.push({ id: 'FG-020', type: 'leak-check-records', retentionYears: 5 });
  for (const entry of evaluations.filter(entry => ['matched', 'matched-with-unresolved-exception'].includes(entry.status))) {
    if (entry.rule.id === 'FG-045') obligations.push({ id: 'FG-045', type: 'pre-ban-proof', retentionYears: null, applicableBanDate: context.applicableAnnexIvBanDate, requiredFrom: context.annexIvProofRequiredFrom });
    if (entry.rule.id === 'FG-046') obligations.push({ id: 'FG-046', type: 'german-pre-ban-declaration', retentionYears: null, applicableBanDate: context.applicableAnnexIvBanDate });
  }
  const unresolved = evaluations.some(entry => entry.rule.categories?.includes('documentation') && entry.status === 'unresolved');
  return { status: obligations.length ? 'required' : unresolved ? 'incomplete' : 'not-required', obligations };
}
function aggregateOperatorDuties(snapshot, context, evaluations) {
  const obligations = [];
  let nonCompliant = false;
  let incomplete = false;
  const lossLimit = germanyLossLimit(context);
  if (lossLimit) {
    obligations.push({ id: 'FG-060', type: 'specific-refrigerant-loss', maximumPercent: lossLimit.maximumPercent, status: lossLimit.status });
    if (lossLimit.status === 'applies') {
      const actual = finiteNumber(snapshot.specificRefrigerantLossPercent);
      if (actual == null) incomplete = true;
      else if (actual > lossLimit.maximumPercent) nonCompliant = true;
    } else if (lossLimit.status === 'incomplete') incomplete = true;
  }
  if (context.installationType === 'stationary' && ['refrigeration', 'air-conditioning', 'heat-pump'].includes(context.applicationType) && (context.gasScope.includes('annex-i') || context.gasScope.includes('annex-ii-group-1'))) obligations.push({ id: 'FG-063', type: 'access-to-detachable-connections', status: 'required-if-technically-possible-and-reasonable' });
  const matchedIds = new Set(evaluations.filter(entry => entry.status === 'matched').map(entry => entry.rule.id));
  if (matchedIds.has('FG-052')) obligations.push({ id: 'FG-052', type: 'contractor-certification' });
  if (matchedIds.has('FG-053')) obligations.push({ id: 'FG-053', type: 'certified-person-for-leak-check' });
  if (matchedIds.has('FG-054')) obligations.push({ id: 'FG-054', type: 'certified-person-for-recovery' });
  if ((matchedIds.has('FG-053') || matchedIds.has('FG-054')) && snapshot.personCertificationStatus === 'not-verified') nonCompliant = true;
  if ((matchedIds.has('FG-053') || matchedIds.has('FG-054')) && !snapshot.personCertificationStatus) incomplete = true;
  if (matchedIds.has('FG-052') && snapshot.companyCertificationStatus === 'not-verified' && snapshot.personCertificationStatus === 'not-verified') nonCompliant = true;
  return { status: nonCompliant ? 'non-compliant' : incomplete ? 'incomplete' : obligations.length ? 'requirements-identified' : 'not-applicable', obligations };
}

export function calculate(snapshot = {}) {
  const refrigerant = getRefrigerant(snapshot.refrigerantId);
  const gwp = getGwp(snapshot.refrigerantId);
  const chargeKg = finiteNumber(snapshot.chargeKg);
  const context = createRegulatoryContext(snapshot);
  const evaluations = evaluateRegulations(context);
  const leakCheckDetails = aggregateLeakCheck(context);
  const documentationDetails = aggregateDocumentation(context, evaluations);
  const operatorDutyDetails = aggregateOperatorDuties(snapshot, context, evaluations);
  return Object.freeze({
    status: chargeKg != null && gwp != null ? 'calculated' : 'not-specified', refrigerant, gwp, chargeKg,
    co2EquivalentTonnes: context.co2EquivalentTonnes, regulatoryContext: context, regulationEvaluation: evaluations,
    applicableRegulations: evaluations.filter(entry => ['matched', 'exception-applies', 'matched-with-unresolved-exception', 'manual-review'].includes(entry.status)).map(entry => entry.rule),
    dataStatus: getDataStatus(), dataVersions: getDataVersions(), leakCheckDetails, documentationDetails, operatorDutyDetails,
    checks: Object.freeze({
      placingOnMarket: aggregatePlacingOnMarket(snapshot, evaluations), service: aggregateService(snapshot, evaluations),
      leakCheck: leakCheckDetails.status, documentation: documentationDetails.status,
      certification: aggregateCertification(snapshot, evaluations), operatorDuties: operatorDutyDetails.status
    })
  });
}

export default calculate;
