import REFRIGERANT_DATASET from './refrigerants.js';
import GWP_DATASET from './gwp.js';
import SAFETY_CLASS_DATASET from './safety-classes.js';
import REGULATION_DATASET from './regulations.js';

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const normalizeIdentifier = value => String(value ?? '').trim().toLowerCase();
const UNKNOWN = Symbol('unknown');

function finiteNumber(value) {
  if (value == null || String(value).trim() === '') return null;
  const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function findRefrigerant(identifier) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return null;
  return REFRIGERANT_DATASET.items.find(entry => {
    if (normalizeIdentifier(entry.id) === normalized || normalizeIdentifier(entry.name) === normalized) return true;
    return Array.isArray(entry.aliases) && entry.aliases.some(alias => normalizeIdentifier(alias) === normalized);
  }) ?? null;
}

function matchesScalarOrList(actual, expected) {
  if (Array.isArray(actual)) return actual.includes(expected);
  return actual === expected;
}

function evaluateCondition(condition, context) {
  const actual = context[condition.field];
  const expected = condition.value;

  switch (condition.operator) {
    case 'present':
      return actual !== undefined && actual !== null && actual !== '';
    case 'eq':
      if (actual === undefined || actual === null || actual === '') return UNKNOWN;
      return matchesScalarOrList(actual, expected);
    case 'in':
      if (actual === undefined || actual === null || actual === '') return UNKNOWN;
      if (!Array.isArray(expected)) return UNKNOWN;
      if (Array.isArray(actual)) return actual.some(value => expected.includes(value));
      return expected.includes(actual);
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte': {
      const numeric = finiteNumber(actual);
      if (numeric == null) return UNKNOWN;
      if (condition.operator === 'lt') return numeric < expected;
      if (condition.operator === 'lte') return numeric <= expected;
      if (condition.operator === 'gt') return numeric > expected;
      return numeric >= expected;
    }
    case 'source-wording-only':
    case 'before-applicable-ban-date':
      return UNKNOWN;
    default:
      return UNKNOWN;
  }
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return null;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function evaluateRuleDate(rule, assessmentDate) {
  const assessment = validDate(assessmentDate);
  if (assessment == null) return UNKNOWN;
  const validFrom = validDate(rule.validFrom);
  const validUntil = validDate(rule.validUntil);
  if (validFrom != null && assessment < validFrom) return false;
  if (validUntil != null && assessment > validUntil) return false;
  return true;
}

function evaluateException(exception, context) {
  switch (exception) {
    case 'site-safety':
      return context.siteSafetyRestrictionStatus === '' || context.siteSafetyRestrictionStatus == null
        ? UNKNOWN
        : context.siteSafetyRestrictionStatus === 'yes';
    case 'national-safety-standard':
      return context.nationalSafetyStandardRestrictionStatus === '' || context.nationalSafetyStandardRestrictionStatus == null
        ? UNKNOWN
        : context.nationalSafetyStandardRestrictionStatus === 'yes';
    case 'cooling-below-minus-50':
      return context.coolingBelowMinus50Status === '' || context.coolingBelowMinus50Status == null
        ? UNKNOWN
        : context.coolingBelowMinus50Status === 'yes';
    case 'cascade-primary-circuit-below-1500': {
      if (context.cascadePrimaryCircuitStatus === '' || context.cascadePrimaryCircuitStatus == null) return UNKNOWN;
      if (context.cascadePrimaryCircuitStatus !== 'yes') return false;
      const gwp = finiteNumber(context.gwp);
      return gwp == null ? UNKNOWN : gwp < 1500;
    }
    case 'site-safety-max-gwp-750': {
      if (context.siteSafetyRestrictionStatus === '' || context.siteSafetyRestrictionStatus == null) return UNKNOWN;
      if (context.siteSafetyRestrictionStatus !== 'yes') return false;
      const gwp = finiteNumber(context.gwp);
      return gwp == null ? UNKNOWN : gwp <= 750;
    }
    case 'military-equipment':
    case 'medical-use':
      return UNKNOWN;
    default:
      return UNKNOWN;
  }
}

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

export function createRegulatoryContext(snapshot = {}) {
  const refrigerant = findRefrigerant(snapshot.refrigerantId);
  const gwp = getGwp(snapshot.refrigerantId);
  const chargeKg = finiteNumber(snapshot.chargeKg);
  return Object.freeze({
    ...clone(snapshot),
    refrigerantId: refrigerant?.id || snapshot.refrigerantId || '',
    refrigerant,
    gwp,
    chargeKg,
    co2EquivalentTonnes: chargeKg != null && gwp != null ? (chargeKg * gwp) / 1000 : null,
    gasScope: deriveGasScope(refrigerant?.regulatory),
    gasType: deriveGasType(refrigerant)
  });
}

export function evaluateRegulations(context = {}) {
  return REGULATION_DATASET.rules.map(rule => {
    const dateStatus = evaluateRuleDate(rule, context.assessmentDate);
    if (dateStatus === false) return Object.freeze({ rule: clone(rule), status: 'inactive', reasons: Object.freeze([]) });
    if (dateStatus === UNKNOWN) return Object.freeze({ rule: clone(rule), status: 'unresolved', reasons: Object.freeze(['assessment-date']) });

    const conditionResults = rule.conditions.map(condition => ({ condition, result: evaluateCondition(condition, context) }));
    const knownFalse = conditionResults.some(entry => entry.result === false);
    if (knownFalse) return Object.freeze({ rule: clone(rule), status: 'not-matched', reasons: Object.freeze([]) });

    const unresolvedConditions = conditionResults.filter(entry => entry.result === UNKNOWN);
    if (rule.automationStatus === 'manual-review') {
      const onlyManualSourceConstraint = unresolvedConditions.every(entry => entry.condition.operator === 'source-wording-only');
      if (onlyManualSourceConstraint) {
        return Object.freeze({ rule: clone(rule), status: 'manual-review', reasons: Object.freeze(['source-wording-only']) });
      }
    }

    if (unresolvedConditions.length) {
      return Object.freeze({
        rule: clone(rule),
        status: 'unresolved',
        reasons: Object.freeze(unresolvedConditions.map(entry => entry.condition.field))
      });
    }

    const exceptionResults = (rule.exceptions || []).map(exception => ({ exception, result: evaluateException(exception, context) }));
    if (exceptionResults.some(entry => entry.result === true)) {
      return Object.freeze({
        rule: clone(rule),
        status: 'exception-applies',
        reasons: Object.freeze(exceptionResults.filter(entry => entry.result === true).map(entry => entry.exception))
      });
    }
    const unresolvedExceptions = exceptionResults.filter(entry => entry.result === UNKNOWN);
    if (unresolvedExceptions.length) {
      return Object.freeze({
        rule: clone(rule),
        status: 'matched-with-unresolved-exception',
        reasons: Object.freeze(unresolvedExceptions.map(entry => entry.exception))
      });
    }

    return Object.freeze({ rule: clone(rule), status: 'matched', reasons: Object.freeze([]) });
  });
}

export function getDataVersions() {
  return Object.freeze({
    refrigerants: REFRIGERANT_DATASET.version,
    gwp: GWP_DATASET.version,
    regulations: REGULATION_DATASET.version,
    safetyClasses: SAFETY_CLASS_DATASET.version
  });
}

export function getDataStatus() {
  return Object.freeze({
    refrigerants: REFRIGERANT_DATASET.status,
    gwp: GWP_DATASET.status,
    regulations: REGULATION_DATASET.status,
    safetyClasses: SAFETY_CLASS_DATASET.status
  });
}

export function listRefrigerants() {
  return clone(REFRIGERANT_DATASET.items) ?? [];
}

export function getRefrigerant(refrigerantId) {
  return clone(findRefrigerant(refrigerantId));
}

export function getGwp(refrigerantId) {
  const refrigerant = findRefrigerant(refrigerantId);
  const canonicalId = refrigerant?.gwpRef || refrigerant?.id || refrigerantId;
  if (!canonicalId) return null;
  const entry = GWP_DATASET.items.find(item => item.refrigerantId === canonicalId || item.id === canonicalId);
  return entry?.value ?? null;
}

export function listSafetyClasses() {
  return clone(SAFETY_CLASS_DATASET.items) ?? [];
}

export function getSafetyClass(safetyClassId) {
  if (!safetyClassId) return null;
  const item = SAFETY_CLASS_DATASET.items.find(entry => entry.id === safetyClassId);
  return clone(item ?? null);
}

export function listRegulations() {
  return clone(REGULATION_DATASET.rules) ?? [];
}

export function getApplicableRegulations(context = {}) {
  if (!context || Object.keys(context).length === 0) return listRegulations();
  return evaluateRegulations(context)
    .filter(entry => ['matched', 'exception-applies', 'matched-with-unresolved-exception', 'manual-review'].includes(entry.status))
    .map(entry => clone(entry.rule));
}

export default Object.freeze({
  getDataVersions,
  getDataStatus,
  listRefrigerants,
  getRefrigerant,
  getGwp,
  listSafetyClasses,
  getSafetyClass,
  listRegulations,
  createRegulatoryContext,
  evaluateRegulations,
  getApplicableRegulations
});
