import REFRIGERANT_DATASET from './refrigerants.js';
import GWP_DATASET from './gwp.js';
import SAFETY_CLASS_DATASET from './safety-classes.js';
import REGULATION_DATASET from './regulations.js';

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const normalizeIdentifier = value => String(value ?? '').trim().toLowerCase();
const UNKNOWN = Symbol('unknown');
function finiteNumber(value) {
  if (value == null || String(value).trim() === '') return null;
  const number = Number(typeof value === 'string' ? value.replace(',', '.') : value);
  return Number.isFinite(number) ? number : null;
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}
function addYears(dateString, years) {
  const timestamp = validDate(dateString);
  if (timestamp == null) return null;
  const date = new Date(timestamp);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString().slice(0, 10);
}
function findRefrigerant(identifier) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return null;
  return REFRIGERANT_DATASET.items.find(entry => normalizeIdentifier(entry.id) === normalized || normalizeIdentifier(entry.name) === normalized || entry.aliases?.some(alias => normalizeIdentifier(alias) === normalized)) ?? null;
}
function matchesScalarOrList(actual, expected) { return Array.isArray(actual) ? actual.includes(expected) : actual === expected; }
function deriveGasScope(regulatory = {}) {
  const tags = [];
  if (regulatory.fluorinatedGreenhouseGas) tags.push('fluorinated-greenhouse-gas');
  if (regulatory.annexIGroup1Content) tags.push('annex-i', 'annex-i-group-1');
  if (regulatory.annexIIGroup1Content) tags.push('annex-ii-group-1');
  if (regulatory.fluorinatedGreenhouseGas && !regulatory.hfc) tags.push('other-fluorinated-greenhouse-gas');
  return Object.freeze(tags);
}
function deriveGasType(refrigerant) {
  const types = [];
  if (refrigerant?.regulatory?.hfc) types.push('hfc');
  if (refrigerant?.group === 'FKW') types.push('pfc');
  return Object.freeze(types);
}
function evaluateException(exception, context) {
  const booleanStatus = field => context[field] === '' || context[field] == null ? UNKNOWN : context[field] === 'yes';
  switch (exception) {
    case 'site-safety': return booleanStatus('siteSafetyRestrictionStatus');
    case 'national-safety-standard': return booleanStatus('nationalSafetyStandardRestrictionStatus');
    case 'cooling-below-minus-50': return booleanStatus('coolingBelowMinus50Status');
    case 'cascade-primary-circuit-below-1500': {
      const active = booleanStatus('cascadePrimaryCircuitStatus'); if (active !== true) return active;
      const gwp = finiteNumber(context.gwp); return gwp == null ? UNKNOWN : gwp < 1500;
    }
    case 'site-safety-max-gwp-750': {
      const active = booleanStatus('siteSafetyRestrictionStatus'); if (active !== true) return active;
      const gwp = finiteNumber(context.gwp); return gwp == null ? UNKNOWN : gwp <= 750;
    }
    case 'military-equipment':
    case 'medical-use': return UNKNOWN;
    default: return UNKNOWN;
  }
}
function evaluateCondition(condition, context) {
  const actual = context[condition.field];
  const expected = condition.value;
  switch (condition.operator) {
    case 'present': return actual !== undefined && actual !== null && actual !== '';
    case 'eq': return actual === undefined || actual === null || actual === '' ? UNKNOWN : matchesScalarOrList(actual, expected);
    case 'in':
      if (actual === undefined || actual === null || actual === '' || !Array.isArray(expected)) return UNKNOWN;
      return Array.isArray(actual) ? actual.some(value => expected.includes(value)) : expected.includes(actual);
    case 'lt': case 'lte': case 'gt': case 'gte': {
      const numeric = finiteNumber(actual); if (numeric == null) return UNKNOWN;
      if (condition.operator === 'lt') return numeric < expected;
      if (condition.operator === 'lte') return numeric <= expected;
      if (condition.operator === 'gt') return numeric > expected;
      return numeric >= expected;
    }
    case 'before-applicable-ban-date': {
      const date = validDate(actual); const ban = validDate(context.applicableAnnexIvBanDate);
      if (context.applicableAnnexIvBanDateStatus === 'none') return false;
      if (date == null || ban == null) return UNKNOWN;
      return date < ban;
    }
    case 'on-or-after-one-year-after-applicable-ban-date': {
      const assessment = validDate(actual); const proofFrom = validDate(context.annexIvProofRequiredFrom);
      if (context.applicableAnnexIvBanDateStatus === 'none') return false;
      if (assessment == null || proofFrom == null) return UNKNOWN;
      return assessment >= proofFrom;
    }
    case 'source-wording-only': return UNKNOWN;
    default: return UNKNOWN;
  }
}
function evaluateRuleDate(rule, assessmentDate) {
  const assessment = validDate(assessmentDate); if (assessment == null) return UNKNOWN;
  const from = validDate(rule.validFrom); const until = validDate(rule.validUntil);
  if (from != null && assessment < from) return false;
  if (until != null && assessment > until) return false;
  return true;
}
function deriveLeakCheck(context) {
  const isAnnexI = context.gasScope.includes('annex-i');
  const isAnnexII = context.gasScope.includes('annex-ii-group-1');
  if (!isAnnexI && !isAnnexII) return Object.freeze({ required: false, intervalMonths: null, leakDetectionRequired: false, status: 'not-applicable' });
  let scopeApplies = false;
  if (context.installationType === 'stationary') scopeApplies = ['refrigeration', 'air-conditioning', 'heat-pump'].includes(context.applicationType);
  if (context.installationType === 'mobile') {
    if (context.mobileEquipmentType === 'refrigerated-truck-trailer') scopeApplies = true;
    if (['light-refrigerated-intermodal-rail', 'mobile-ac-heat-pump-heavy-etc'].includes(context.mobileEquipmentType)) {
      const assessment = validDate(context.assessmentDate);
      scopeApplies = assessment != null && assessment >= validDate('2027-03-13');
    }
  }
  if (!scopeApplies) return Object.freeze({ required: false, intervalMonths: null, leakDetectionRequired: false, status: context.installationType ? 'not-applicable' : 'incomplete' });
  const co2 = finiteNumber(context.co2EquivalentTonnes);
  const kg = finiteNumber(context.chargeKg);
  if ((isAnnexI && co2 == null) || (isAnnexII && kg == null)) return Object.freeze({ required: null, intervalMonths: null, leakDetectionRequired: null, status: 'incomplete' });
  const thresholdReached = (isAnnexI && co2 >= 5) || (isAnnexII && kg >= 1);
  if (!thresholdReached) return Object.freeze({ required: false, intervalMonths: null, leakDetectionRequired: false, status: 'not-required' });
  const hermetic = context.hermeticallySealedStatus === 'yes' && context.hermeticallySealedLabelStatus === 'yes';
  const hermeticExempt = hermetic && ((isAnnexI && co2 < 10) || (isAnnexII && kg < 2));
  if (hermeticExempt) return Object.freeze({ required: false, intervalMonths: null, leakDetectionRequired: false, status: 'exception-applies' });
  const intervals = [];
  if (isAnnexI) intervals.push(co2 >= 500 ? 3 : co2 >= 50 ? 6 : 12);
  if (isAnnexII) intervals.push(kg >= 100 ? 3 : kg >= 10 ? 6 : 12);
  let intervalMonths = Math.min(...intervals);
  if (context.leakDetectionSystemStatus === 'yes') intervalMonths *= 2;
  const leakDetectionRequired = context.installationType === 'stationary' && ((isAnnexI && co2 >= 500) || (isAnnexII && kg >= 100));
  return Object.freeze({ required: true, intervalMonths, leakDetectionRequired, status: 'required' });
}
function deriveApplicableAnnexIvBan(context) {
  const candidates = [];
  const unresolved = [];
  for (const rule of REGULATION_DATASET.rules.filter(rule => rule.categories?.includes('annex-iv') && !rule.categories?.includes('platform-only'))) {
    const results = rule.conditions.map(condition => evaluateCondition(condition, context));
    if (results.some(result => result === false)) continue;
    const date = rule.validFrom;
    if (results.some(result => result === UNKNOWN) || rule.automationStatus === 'manual-review') { unresolved.push({ date, ruleId: rule.id }); continue; }
    const exceptions = (rule.exceptions || []).map(exception => evaluateException(exception, context));
    if (exceptions.some(result => result === true)) continue;
    if (exceptions.some(result => result === UNKNOWN)) { unresolved.push({ date, ruleId: rule.id }); continue; }
    candidates.push({ date, ruleId: rule.id });
  }
  candidates.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  unresolved.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const confirmed = candidates[0] || null;
  const uncertain = unresolved[0] || null;
  if (uncertain && (!confirmed || uncertain.date <= confirmed.date)) return Object.freeze({ status: 'unresolved', date: null, ruleId: uncertain.ruleId });
  if (!confirmed) return Object.freeze({ status: 'none', date: null, ruleId: null });
  return Object.freeze({ status: 'resolved', date: confirmed.date, ruleId: confirmed.ruleId });
}
export function createRegulatoryContext(snapshot = {}) {
  const refrigerant = findRefrigerant(snapshot.refrigerantId);
  const gwp = getGwp(snapshot.refrigerantId);
  const chargeKg = finiteNumber(snapshot.chargeKg);
  const base = {
    ...clone(snapshot), refrigerantId: refrigerant?.id || snapshot.refrigerantId || '', refrigerant, gwp, chargeKg,
    co2EquivalentTonnes: chargeKg != null && gwp != null ? (chargeKg * gwp) / 1000 : null,
    gasScope: deriveGasScope(refrigerant?.regulatory), gasType: deriveGasType(refrigerant)
  };
  const ban = deriveApplicableAnnexIvBan(base);
  const withBan = {
    ...base,
    applicableAnnexIvBanDateStatus: ban.status,
    applicableAnnexIvBanDate: ban.date,
    applicableAnnexIvRuleId: ban.ruleId,
    annexIvProofRequiredFrom: ban.date ? addYears(ban.date, 1) : null
  };
  const placed = validDate(withBan.placedOnMarketDate);
  const banDate = validDate(withBan.applicableAnnexIvBanDate);
  withBan.annexIvCompliance = ban.status === 'none'
    ? 'compliant'
    : ban.status === 'resolved' && placed != null && banDate != null
      ? (placed >= banDate ? 'non-compliant' : 'compliant')
      : '';
  const leakCheck = deriveLeakCheck(withBan);
  withBan.leakCheckRequired = leakCheck.required;
  withBan.leakCheckIntervalMonths = leakCheck.intervalMonths;
  withBan.leakDetectionRequired = leakCheck.leakDetectionRequired;
  withBan.leakCheckStatus = leakCheck.status;
  return Object.freeze(withBan);
}
export function evaluateRegulations(context = {}) {
  return REGULATION_DATASET.rules.map(rule => {
    const dateStatus = evaluateRuleDate(rule, context.assessmentDate);
    if (dateStatus === false) return Object.freeze({ rule: clone(rule), status: 'inactive', reasons: Object.freeze([]) });
    if (dateStatus === UNKNOWN) return Object.freeze({ rule: clone(rule), status: 'unresolved', reasons: Object.freeze(['assessment-date']) });
    const results = rule.conditions.map(condition => ({ condition, result: evaluateCondition(condition, context) }));
    if (results.some(entry => entry.result === false)) return Object.freeze({ rule: clone(rule), status: 'not-matched', reasons: Object.freeze([]) });
    const unknown = results.filter(entry => entry.result === UNKNOWN);
    if (rule.automationStatus === 'manual-review' && unknown.every(entry => entry.condition.operator === 'source-wording-only')) return Object.freeze({ rule: clone(rule), status: 'manual-review', reasons: Object.freeze(['source-wording-only']) });
    if (unknown.length) return Object.freeze({ rule: clone(rule), status: 'unresolved', reasons: Object.freeze(unknown.map(entry => entry.condition.field)) });
    const exceptions = (rule.exceptions || []).map(exception => ({ exception, result: evaluateException(exception, context) }));
    if (exceptions.some(entry => entry.result === true)) return Object.freeze({ rule: clone(rule), status: 'exception-applies', reasons: Object.freeze(exceptions.filter(entry => entry.result === true).map(entry => entry.exception)) });
    const unresolvedExceptions = exceptions.filter(entry => entry.result === UNKNOWN);
    if (unresolvedExceptions.length) return Object.freeze({ rule: clone(rule), status: 'matched-with-unresolved-exception', reasons: Object.freeze(unresolvedExceptions.map(entry => entry.exception)) });
    return Object.freeze({ rule: clone(rule), status: 'matched', reasons: Object.freeze([]) });
  });
}
export function getDataVersions() { return Object.freeze({ refrigerants: REFRIGERANT_DATASET.version, gwp: GWP_DATASET.version, regulations: REGULATION_DATASET.version, safetyClasses: SAFETY_CLASS_DATASET.version }); }
export function getDataStatus() { return Object.freeze({ refrigerants: REFRIGERANT_DATASET.status, gwp: GWP_DATASET.status, regulations: REGULATION_DATASET.status, safetyClasses: SAFETY_CLASS_DATASET.status }); }
export function listRefrigerants() { return clone(REFRIGERANT_DATASET.items) ?? []; }
export function getRefrigerant(refrigerantId) { return clone(findRefrigerant(refrigerantId)); }
export function getGwp(refrigerantId) {
  const refrigerant = findRefrigerant(refrigerantId); const canonicalId = refrigerant?.gwpRef || refrigerant?.id || refrigerantId;
  if (!canonicalId) return null;
  return GWP_DATASET.items.find(item => item.refrigerantId === canonicalId || item.id === canonicalId)?.value ?? null;
}
export function listSafetyClasses() { return clone(SAFETY_CLASS_DATASET.items) ?? []; }
export function getSafetyClass(id) { return clone(SAFETY_CLASS_DATASET.items.find(entry => entry.id === id) ?? null); }
export function listRegulations() { return clone(REGULATION_DATASET.rules) ?? []; }
export function getApplicableRegulations(context = {}) {
  if (!context || Object.keys(context).length === 0) return listRegulations();
  return evaluateRegulations(context).filter(entry => ['matched', 'exception-applies', 'matched-with-unresolved-exception', 'manual-review'].includes(entry.status)).map(entry => clone(entry.rule));
}
export default Object.freeze({ getDataVersions, getDataStatus, listRefrigerants, getRefrigerant, getGwp, listSafetyClasses, getSafetyClass, listRegulations, createRegulatoryContext, evaluateRegulations, getApplicableRegulations });
