import { getEN378SafetyData } from '../../utils/refrigerants/index.js';

export const EN_378_CHARGE_LIMIT_MODEL_VERSION = 1;

export const CHARGE_LIMIT_STATUS = Object.freeze({
  PASSED: 'passed',
  FAILED: 'failed',
  NOT_APPLICABLE: 'not-applicable',
  NOT_ASSESSED: 'not-assessed'
});

const SOURCE_EN_378_1_C1 = Object.freeze({ sourcePart: 'EN 378-1', sourceSection: 'C.1 / Tabelle C.1' });
const SOURCE_EN_378_1_C2 = Object.freeze({ sourcePart: 'EN 378-1', sourceSection: 'C.1 / Tabelle C.2' });
const SOURCE_EN_378_1_C3 = Object.freeze({ sourcePart: 'EN 378-1', sourceSection: 'C.3 / Tabellen C.3 und C.4' });

const numberOrNull = value => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const yes = value => value === true || value === 'yes';
const no = value => value === false || value === 'no';
const finiteOrNull = value => Number.isFinite(value) ? value : null;

const C3_LIMITS_BY_STANDARD_NUMBER = Object.freeze({
  '32': Object.freeze({ rclKgM3: 0.061, qlmvKgM3: 0.063, qlavKgM3: 0.15 }),
  '134a': Object.freeze({ rclKgM3: 0.21, qlmvKgM3: 0.28, qlavKgM3: 0.58 }),
  '407C': Object.freeze({ rclKgM3: 0.27, qlmvKgM3: 0.44, qlavKgM3: 0.49 }),
  '410A': Object.freeze({ rclKgM3: 0.39, qlmvKgM3: 0.42, qlavKgM3: 0.42 }),
  '744': Object.freeze({ rclKgM3: 0.072, qlmvKgM3: 0.074, qlavKgM3: 0.18 }),
  '1234yf': Object.freeze({ rclKgM3: 0.058, qlmvKgM3: 0.060, qlavKgM3: 0.14 }),
  '1234ze(E)': Object.freeze({ rclKgM3: 0.061, qlmvKgM3: 0.063, qlavKgM3: 0.15 })
});

const H0_BY_MOUNTING_TYPE = Object.freeze({
  floor: 0.6,
  wall: 1.8,
  window: 1.0,
  ceiling: 2.2
});

function freezeResult(result) {
  return Object.freeze({
    ...result,
    missingInputs: Object.freeze(result.missingInputs || []),
    requirements: Object.freeze(result.requirements || []),
    measures: Object.freeze(result.measures || []),
    details: Object.freeze(result.details || {})
  });
}

function notAssessed(id, category, reason, source, missingInputs = [], details = {}) {
  return freezeResult({
    id,
    category,
    status: CHARGE_LIMIT_STATUS.NOT_ASSESSED,
    reason,
    source,
    maximumChargeKg: null,
    concentrationKgM3: null,
    missingInputs,
    details
  });
}

function notApplicable(id, category, reason, source) {
  return freezeResult({
    id,
    category,
    status: CHARGE_LIMIT_STATUS.NOT_APPLICABLE,
    reason,
    source,
    maximumChargeKg: null,
    concentrationKgM3: null
  });
}

function assessedLimit({ id, category, chargeKg, maximumChargeKg, rule, source, requirements = [], measures = [], details = {} }) {
  const limit = finiteOrNull(maximumChargeKg);
  const status = limit == null || chargeKg <= limit ? CHARGE_LIMIT_STATUS.PASSED : CHARGE_LIMIT_STATUS.FAILED;
  return freezeResult({
    id,
    category,
    status,
    rule,
    source,
    maximumChargeKg: limit,
    requirements,
    measures,
    details
  });
}

function noLimit(id, category, rule, source) {
  return freezeResult({
    id,
    category,
    status: CHARGE_LIMIT_STATUS.PASSED,
    rule,
    source,
    maximumChargeKg: null,
    noLimit: true
  });
}

export function calculateFlammabilityMassLimits(lflKgM3) {
  const lfl = numberOrNull(lflKgM3);
  if (lfl == null || lfl <= 0) {
    return Object.freeze({ m1Kg: null, m2Kg: null, m3Kg: null });
  }

  return Object.freeze({
    m1Kg: 4 * lfl,
    m2Kg: 26 * lfl,
    m3Kg: 130 * lfl
  });
}

export function calculateComfortChargeLimit({ lflKgM3, floorAreaM2, mountingType } = {}) {
  const lfl = numberOrNull(lflKgM3);
  const area = numberOrNull(floorAreaM2);
  const h0 = H0_BY_MOUNTING_TYPE[mountingType];

  if (lfl == null || lfl <= 0 || area == null || area <= 0 || h0 == null) return null;
  return 2.5 * (lfl ** 1.25) * h0 * Math.sqrt(area);
}

export function calculateMinimumComfortFloorArea({ chargeKg, lflKgM3, mountingType } = {}) {
  const charge = numberOrNull(chargeKg);
  const lfl = numberOrNull(lflKgM3);
  const h0 = H0_BY_MOUNTING_TYPE[mountingType];

  if (charge == null || charge <= 0 || lfl == null || lfl <= 0 || h0 == null) return null;
  return (charge / (2.5 * (lfl ** 1.25) * h0)) ** 2;
}

export function calculateFactorySealedChargeLimit({ lflKgM3, floorAreaM2 } = {}) {
  const lfl = numberOrNull(lflKgM3);
  const area = numberOrNull(floorAreaM2);

  if (lfl == null || lfl <= 0 || area == null || area <= 0) return null;
  return 0.25 * area * lfl * 2.2;
}

export function calculateMinimumFactorySealedFloorArea({ chargeKg, lflKgM3 } = {}) {
  const charge = numberOrNull(chargeKg);
  const lfl = numberOrNull(lflKgM3);
  if (charge == null || charge <= 0 || lfl == null || lfl <= 0) return null;
  return charge / (0.25 * lfl * 2.2);
}

export function calculateRefrigerantConcentration(chargeKg, roomVolumeM3) {
  const charge = numberOrNull(chargeKg);
  const volume = numberOrNull(roomVolumeM3);
  if (charge == null || charge <= 0 || volume == null || volume <= 0) return null;
  return charge / volume;
}

export function getToxicityConcentrationLimit(safetyData = {}) {
  const practicalLimit = numberOrNull(safetyData.practicalLimitKgM3);
  const atelOdl = numberOrNull(safetyData.atelOdlKgM3);
  const values = [practicalLimit, atelOdl].filter(value => value != null && value > 0);
  return values.length ? Math.max(...values) : null;
}

function getC3Limits(safetyData = {}) {
  return C3_LIMITS_BY_STANDARD_NUMBER[safetyData.standardNumber] || null;
}

function c3Details(limits, concentration, firstThreshold, firstThresholdLabel) {
  return Object.freeze({
    rclKgM3: limits?.rclKgM3 ?? null,
    qlmvKgM3: limits?.qlmvKgM3 ?? null,
    qlavKgM3: limits?.qlavKgM3 ?? null,
    concentrationKgM3: concentration ?? null,
    firstThresholdKgM3: firstThreshold ?? null,
    firstThresholdLabel: firstThresholdLabel || ''
  });
}

function toxicityLimitByTableC1({ safetyData, chargeKg, roomVolumeM3, accessCategory, installationClass, locationLevel, occupantDensityBelowOnePer10m2, hasEmergencyExits, isPermanentlySealedSorptionSystem }) {
  const toxicityClass = safetyData?.toxicityClass;
  const concentrationLimit = getToxicityConcentrationLimit(safetyData);

  if (!['A', 'B'].includes(toxicityClass)) {
    return notAssessed('charge-limit.toxicity', 'chargeLimit', 'Toxizitätsklasse fehlt.', SOURCE_EN_378_1_C1, ['toxicityClass']);
  }
  if (!['a', 'b', 'c'].includes(accessCategory)) {
    return notAssessed('charge-limit.toxicity', 'chargeLimit', 'Kategorie des Zugangsbereichs fehlt.', SOURCE_EN_378_1_C1, ['accessCategory']);
  }
  if (!['I', 'II', 'III', 'IV'].includes(installationClass)) {
    return notAssessed('charge-limit.toxicity', 'chargeLimit', 'Aufstellungsort-Klassifikation fehlt.', SOURCE_EN_378_1_C1, ['installationClass']);
  }
  if (installationClass === 'IV') {
    return notAssessed('charge-limit.toxicity', 'chargeLimit', 'Toxizitätsanforderungen bei Klasse IV sind abhängig vom Ort des belüfteten Gehäuses zu bewerten.', SOURCE_EN_378_1_C1, ['ventilatedEnclosureLocation']);
  }
  if (installationClass === 'III' || (toxicityClass === 'A' && installationClass === 'II')) {
    return noLimit('charge-limit.toxicity', 'chargeLimit', 'Tabelle C.1: keine Begrenzung der Füllmenge.', SOURCE_EN_378_1_C1);
  }
  if (concentrationLimit == null) {
    return notAssessed('charge-limit.toxicity', 'chargeLimit', 'Toxizitätsgrenze konnte nicht bestimmt werden.', SOURCE_EN_378_1_C1, ['practicalLimitKgM3', 'atelOdlKgM3']);
  }
  if (roomVolumeM3 == null || roomVolumeM3 <= 0) {
    return notAssessed('charge-limit.toxicity', 'chargeLimit', 'Raumvolumen fehlt.', SOURCE_EN_378_1_C1, ['roomVolumeM3']);
  }

  const concentrationBasedLimit = concentrationLimit * roomVolumeM3;
  const upperOrBasement = locationLevel === 'upper-no-emergency-exit-or-basement';
  const densityLow = yes(occupantDensityBelowOnePer10m2);

  if (toxicityClass === 'A') {
    if (accessCategory === 'a' || upperOrBasement) {
      return assessedLimit({ id: 'charge-limit.toxicity', category: 'chargeLimit', chargeKg, maximumChargeKg: concentrationBasedLimit, rule: 'toxicity-limit-times-room-volume-or-c3', source: SOURCE_EN_378_1_C1, requirements: ['Toxizitätsgrenze × Raumvolumen einhalten oder alternative Vorkehrungen nach C.3 bewerten.'] });
    }
    return noLimit('charge-limit.toxicity', 'chargeLimit', 'Tabelle C.1: keine Begrenzung der Füllmenge.', SOURCE_EN_378_1_C1);
  }

  if (accessCategory === 'a') {
    if (yes(isPermanentlySealedSorptionSystem)) {
      return assessedLimit({ id: 'charge-limit.toxicity', category: 'chargeLimit', chargeKg, maximumChargeKg: Math.min(concentrationBasedLimit, 2.5), rule: 'sorption-system-toxicity-limit-and-2_5kg-cap', source: SOURCE_EN_378_1_C1 });
    }
    return assessedLimit({ id: 'charge-limit.toxicity', category: 'chargeLimit', chargeKg, maximumChargeKg: concentrationBasedLimit, rule: 'toxicity-limit-times-room-volume', source: SOURCE_EN_378_1_C1 });
  }

  if (accessCategory === 'b') {
    if (installationClass === 'I' && upperOrBasement) {
      return assessedLimit({ id: 'charge-limit.toxicity', category: 'chargeLimit', chargeKg, maximumChargeKg: concentrationBasedLimit, rule: 'toxicity-limit-times-room-volume', source: SOURCE_EN_378_1_C1 });
    }
    if (installationClass === 'I') {
      return assessedLimit({ id: 'charge-limit.toxicity', category: 'chargeLimit', chargeKg, maximumChargeKg: 10, rule: 'fixed-limit-10kg', source: SOURCE_EN_378_1_C1 });
    }
    if (installationClass === 'II' && densityLow) return noLimit('charge-limit.toxicity', 'chargeLimit', 'Tabelle C.1: keine Begrenzung der Füllmenge.', SOURCE_EN_378_1_C1);
    if (installationClass === 'II') {
      return assessedLimit({ id: 'charge-limit.toxicity', category: 'chargeLimit', chargeKg, maximumChargeKg: 25, rule: 'fixed-limit-25kg', source: SOURCE_EN_378_1_C1 });
    }
  }

  if (accessCategory === 'c') {
    if (installationClass === 'I' && densityLow && yes(hasEmergencyExits)) {
      return assessedLimit({ id: 'charge-limit.toxicity', category: 'chargeLimit', chargeKg, maximumChargeKg: 50, rule: 'fixed-limit-50kg-with-emergency-exits', source: SOURCE_EN_378_1_C1 });
    }
    if (installationClass === 'I' && densityLow && !yes(hasEmergencyExits)) {
      return notAssessed('charge-limit.toxicity', 'chargeLimit', 'Für die 50-kg-Grenze müssen vorhandene Notausgänge bestätigt werden.', SOURCE_EN_378_1_C1, ['hasEmergencyExits']);
    }
    if (installationClass === 'I') {
      return assessedLimit({ id: 'charge-limit.toxicity', category: 'chargeLimit', chargeKg, maximumChargeKg: 10, rule: 'fixed-limit-10kg', source: SOURCE_EN_378_1_C1 });
    }
    if (installationClass === 'II' && densityLow) return noLimit('charge-limit.toxicity', 'chargeLimit', 'Tabelle C.1: keine Begrenzung der Füllmenge.', SOURCE_EN_378_1_C1);
    if (installationClass === 'II') {
      return assessedLimit({ id: 'charge-limit.toxicity', category: 'chargeLimit', chargeKg, maximumChargeKg: 25, rule: 'fixed-limit-25kg', source: SOURCE_EN_378_1_C1 });
    }
  }

  return notAssessed('charge-limit.toxicity', 'chargeLimit', 'Diese Tabellenkombination ist noch nicht abgebildet.', SOURCE_EN_378_1_C1);
}

function limitByMode({ c2Limit, c3Limit, usesAlternativeRiskManagement }) {
  if (yes(usesAlternativeRiskManagement)) return c3Limit;
  if (no(usesAlternativeRiskManagement)) return c2Limit;
  return Math.min(c2Limit, c3Limit);
}

function flammabilityLimitByTableC2(context) {
  const { safetyData, chargeKg, roomVolumeM3, accessCategory, installationClass, applicationType, locationLevel, occupantDensityBelowOnePer10m2, usesAlternativeRiskManagement, floorAreaM2, mountingType, isFactorySealed } = context;
  const flammabilityClass = safetyData?.flammabilityClass;
  const lfl = numberOrNull(safetyData?.lflKgM3);

  if (flammabilityClass === '1') return notApplicable('charge-limit.flammability', 'chargeLimit', 'Brennbarkeitsklasse 1: keine brennbarkeitsbezogene Begrenzung nach Tabelle C.2.', SOURCE_EN_378_1_C2);
  if (!['2L', '2', '3'].includes(flammabilityClass)) return notAssessed('charge-limit.flammability', 'chargeLimit', 'Brennbarkeitsklasse fehlt.', SOURCE_EN_378_1_C2, ['flammabilityClass']);
  if (lfl == null || lfl <= 0) return notAssessed('charge-limit.flammability', 'chargeLimit', 'LFL-Wert fehlt.', SOURCE_EN_378_1_C2, ['lflKgM3']);
  if (!['a', 'b', 'c'].includes(accessCategory)) return notAssessed('charge-limit.flammability', 'chargeLimit', 'Kategorie des Zugangsbereichs fehlt.', SOURCE_EN_378_1_C2, ['accessCategory']);
  if (!['I', 'II', 'III', 'IV'].includes(installationClass)) return notAssessed('charge-limit.flammability', 'chargeLimit', 'Aufstellungsort-Klassifikation fehlt.', SOURCE_EN_378_1_C2, ['installationClass']);

  const { m1Kg, m2Kg, m3Kg } = calculateFlammabilityMassLimits(lfl);
  const volumeLimit = roomVolumeM3 != null && roomVolumeM3 > 0 ? 0.2 * lfl * roomVolumeM3 : null;

  if (installationClass === 'IV') {
    const multiplier = flammabilityClass === '2L' ? 1.5 : 1;
    return assessedLimit({ id: 'charge-limit.flammability', category: 'chargeLimit', chargeKg, maximumChargeKg: m3Kg * multiplier, rule: `limit-m3-times-${multiplier}`, source: SOURCE_EN_378_1_C2 });
  }

  if (flammabilityClass === '2L' && installationClass === 'III') {
    return noLimit('charge-limit.flammability', 'chargeLimit', 'Tabelle C.2: keine Begrenzung der Füllmenge.', SOURCE_EN_378_1_C2);
  }

  if (flammabilityClass === '2L') {
    const c3Limit = m3Kg * 1.5;
    if (applicationType === 'human-comfort') {
      const comfortLimit = yes(isFactorySealed)
        ? calculateFactorySealedChargeLimit({ lflKgM3: lfl, floorAreaM2 })
        : calculateComfortChargeLimit({ lflKgM3: lfl, floorAreaM2, mountingType });
      if (comfortLimit == null && !yes(usesAlternativeRiskManagement)) {
        return notAssessed('charge-limit.flammability', 'chargeLimit', 'Für den Komfortgerätepfad nach C.2 fehlen Raumfläche oder Montageart.', SOURCE_EN_378_1_C2, ['floorAreaM2', 'mountingType']);
      }
      const c2Limit = comfortLimit == null ? Number.POSITIVE_INFINITY : Math.min(comfortLimit, m2Kg * 1.5);
      return assessedLimit({ id: 'charge-limit.flammability', category: 'chargeLimit', chargeKg, maximumChargeKg: limitByMode({ c2Limit, c3Limit, usesAlternativeRiskManagement }), rule: 'comfort-application-c2-or-c3', source: SOURCE_EN_378_1_C2 });
    }

    if (volumeLimit == null) return notAssessed('charge-limit.flammability', 'chargeLimit', 'Raumvolumen fehlt.', SOURCE_EN_378_1_C2, ['roomVolumeM3']);
    if (installationClass === 'II' && accessCategory === 'c' && yes(occupantDensityBelowOnePer10m2)) return noLimit('charge-limit.flammability', 'chargeLimit', 'Tabelle C.2: keine Begrenzung der Füllmenge.', SOURCE_EN_378_1_C2);
    const fixedCap = installationClass === 'II' && ['b', 'c'].includes(accessCategory) ? 25 : null;
    const c2Cap = fixedCap == null ? m2Kg * 1.5 : fixedCap;
    const c2Limit = Math.min(volumeLimit, c2Cap);
    return assessedLimit({ id: 'charge-limit.flammability', category: 'chargeLimit', chargeKg, maximumChargeKg: limitByMode({ c2Limit, c3Limit, usesAlternativeRiskManagement }), rule: 'twenty-percent-lfl-room-volume-c2-or-c3', source: SOURCE_EN_378_1_C2 });
  }

  if (flammabilityClass === '2') {
    if (installationClass === 'III') return noLimit('charge-limit.flammability', 'chargeLimit', 'Tabelle C.2: keine Begrenzung der Füllmenge.', SOURCE_EN_378_1_C2);
    if (volumeLimit == null) return notAssessed('charge-limit.flammability', 'chargeLimit', 'Raumvolumen fehlt.', SOURCE_EN_378_1_C2, ['roomVolumeM3']);
    if (installationClass === 'II' && accessCategory === 'c' && yes(occupantDensityBelowOnePer10m2)) return noLimit('charge-limit.flammability', 'chargeLimit', 'Tabelle C.2: keine Begrenzung der Füllmenge.', SOURCE_EN_378_1_C2);
    const cap = installationClass === 'II' && ['b', 'c'].includes(accessCategory) ? 25 : m2Kg;
    return assessedLimit({ id: 'charge-limit.flammability', category: 'chargeLimit', chargeKg, maximumChargeKg: Math.min(volumeLimit, cap), rule: 'twenty-percent-lfl-room-volume', source: SOURCE_EN_378_1_C2 });
  }

  if (flammabilityClass === '3') {
    if (installationClass === 'III') {
      const limitByAccess = accessCategory === 'a' ? 5 : accessCategory === 'b' ? 10 : null;
      if (limitByAccess == null) return noLimit('charge-limit.flammability', 'chargeLimit', 'Tabelle C.2: keine Begrenzung der Füllmenge.', SOURCE_EN_378_1_C2);
      return assessedLimit({ id: 'charge-limit.flammability', category: 'chargeLimit', chargeKg, maximumChargeKg: limitByAccess, rule: `fixed-limit-${limitByAccess}kg`, source: SOURCE_EN_378_1_C2 });
    }
    if (volumeLimit == null) return notAssessed('charge-limit.flammability', 'chargeLimit', 'Raumvolumen fehlt.', SOURCE_EN_378_1_C2, ['roomVolumeM3']);
    const underground = locationLevel === 'underground' || locationLevel === 'deepest-underground';
    const accessAndLocationCap = accessCategory === 'a'
      ? (underground ? 1 : 1.5)
      : accessCategory === 'b'
        ? (underground ? 1 : 2.5)
        : (underground ? 1.5 : 10);
    return assessedLimit({ id: 'charge-limit.flammability', category: 'chargeLimit', chargeKg, maximumChargeKg: Math.min(volumeLimit, accessAndLocationCap), rule: 'class-3-volume-and-fixed-cap', source: SOURCE_EN_378_1_C2 });
  }

  return notAssessed('charge-limit.flammability', 'chargeLimit', 'Diese Tabellenkombination ist noch nicht abgebildet.', SOURCE_EN_378_1_C2);
}

export function assessAlternativeRiskManagementC3({ safetyData, chargeKg, roomVolumeM3, locationLevel } = {}) {
  const concentration = calculateRefrigerantConcentration(chargeKg, roomVolumeM3);
  const limits = getC3Limits(safetyData);
  if (concentration == null) return notAssessed('charge-limit.alternative-risk-management', 'safetyMeasures', 'Konzentration konnte nicht berechnet werden.', SOURCE_EN_378_1_C3, ['chargeKg', 'roomVolumeM3']);
  if (!limits) return notAssessed('charge-limit.alternative-risk-management', 'safetyMeasures', 'QLMV/QLAV-Werte liegen nur für ausgewählte Kältemittel aus Tabelle C.3 vor.', SOURCE_EN_378_1_C3, ['qlmvKgM3', 'qlavKgM3']);

  const deepest = locationLevel === 'deepest-underground';
  const firstThreshold = deepest ? limits.rclKgM3 : limits.qlmvKgM3;
  const firstThresholdLabel = deepest ? 'RCL' : 'QLMV';
  const details = c3Details(limits, concentration, firstThreshold, firstThresholdLabel);

  if (concentration <= firstThreshold) {
    return freezeResult({ id: 'charge-limit.alternative-risk-management', category: 'safetyMeasures', status: CHARGE_LIMIT_STATUS.PASSED, source: SOURCE_EN_378_1_C3, concentrationKgM3: concentration, rule: `concentration-not-above-${firstThresholdLabel.toLowerCase()}`, requirements: [`Konzentration liegt nicht über ${firstThresholdLabel}.`], details });
  }
  if (concentration <= limits.qlavKgM3) {
    const measureCount = deepest ? 2 : 1;
    return freezeResult({ id: 'charge-limit.alternative-risk-management', category: 'safetyMeasures', status: CHARGE_LIMIT_STATUS.FAILED, source: SOURCE_EN_378_1_C3, concentrationKgM3: concentration, rule: deepest ? 'between-rcl-and-qlav' : 'between-qlmv-and-qlav', requirements: [`Mindestens ${measureCount} zusätzliche Sicherheitsmaßnahme(n) nach C.3 / EN 378-3 erforderlich.`], measures: ['Alternative Vorkehrungen nach EN 378-1 C.3 und EN 378-3 Abschnitt 6 prüfen.'], details });
  }

  return freezeResult({ id: 'charge-limit.alternative-risk-management', category: 'safetyMeasures', status: CHARGE_LIMIT_STATUS.FAILED, source: SOURCE_EN_378_1_C3, concentrationKgM3: concentration, rule: 'concentration-above-qlav', requirements: ['Konzentration überschreitet QLAV; alternative Vorkehrungen reichen in diesem Pfad nicht aus.'], measures: ['Aufstellkonzept, Füllmenge oder Raumvolumen fachlich ändern.'], details });
}

function shouldIncludeC3Assessment(currentState, toxicity, flammability) {
  return yes(currentState.usesAlternativeRiskManagement)
    || toxicity.status === CHARGE_LIMIT_STATUS.FAILED
    || flammability.status === CHARGE_LIMIT_STATUS.FAILED;
}

export function assessChargeLimit(currentState = {}) {
  const chargeKg = numberOrNull(currentState.chargeKg);
  const roomVolumeM3 = numberOrNull(currentState.roomVolumeM3);
  const safetyData = currentState.refrigerantId ? getEN378SafetyData(currentState.refrigerantId) : null;

  if (!safetyData) {
    return Object.freeze({
      status: CHARGE_LIMIT_STATUS.NOT_ASSESSED,
      maximumAllowedChargeKg: null,
      refrigerantSafetyData: null,
      checks: Object.freeze([notAssessed('charge-limit.refrigerant-data', 'refrigerant', 'EN-378-Sicherheitsdaten zum Kältemittel fehlen.', SOURCE_EN_378_1_C1, ['refrigerantId'])]),
      requiredMeasures: Object.freeze([]),
      missingInputs: Object.freeze(['refrigerantId'])
    });
  }
  if (chargeKg == null || chargeKg <= 0 || roomVolumeM3 == null || roomVolumeM3 <= 0) {
    return Object.freeze({
      status: CHARGE_LIMIT_STATUS.NOT_ASSESSED,
      maximumAllowedChargeKg: null,
      refrigerantSafetyData: safetyData,
      checks: Object.freeze([notAssessed('charge-limit.input', 'chargeLimit', 'Füllmenge oder Raumvolumen fehlen.', SOURCE_EN_378_1_C1, ['chargeKg', 'roomVolumeM3'])]),
      requiredMeasures: Object.freeze([]),
      missingInputs: Object.freeze(['chargeKg', 'roomVolumeM3'])
    });
  }

  const context = { ...currentState, safetyData, chargeKg, roomVolumeM3 };
  const toxicity = toxicityLimitByTableC1(context);
  const flammability = flammabilityLimitByTableC2(context);
  const checks = shouldIncludeC3Assessment(currentState, toxicity, flammability)
    ? [toxicity, flammability, assessAlternativeRiskManagementC3(context)]
    : [toxicity, flammability];
  const assessedLimits = checks
    .filter(check => check.status !== CHARGE_LIMIT_STATUS.NOT_ASSESSED && check.status !== CHARGE_LIMIT_STATUS.NOT_APPLICABLE && !check.noLimit)
    .map(check => check.maximumChargeKg)
    .filter(value => Number.isFinite(value));
  const maximumAllowedChargeKg = assessedLimits.length ? Math.min(...assessedLimits) : null;
  const hardLimitExceeded = maximumAllowedChargeKg != null && chargeKg > maximumAllowedChargeKg;
  const notAssessedChecks = checks.filter(check => check.status === CHARGE_LIMIT_STATUS.NOT_ASSESSED);
  const failedChecks = checks.filter(check => check.status === CHARGE_LIMIT_STATUS.FAILED);
  const requiredMeasures = failedChecks.flatMap(check => check.measures || []);
  const missingInputs = [...new Set(notAssessedChecks.flatMap(check => check.missingInputs || []))];

  return Object.freeze({
    status: hardLimitExceeded || failedChecks.length ? CHARGE_LIMIT_STATUS.FAILED : notAssessedChecks.length ? CHARGE_LIMIT_STATUS.NOT_ASSESSED : CHARGE_LIMIT_STATUS.PASSED,
    maximumAllowedChargeKg,
    refrigerantSafetyData: safetyData,
    concentrationKgM3: calculateRefrigerantConcentration(chargeKg, roomVolumeM3),
    flammabilityMassLimits: calculateFlammabilityMassLimits(safetyData.lflKgM3),
    checks: Object.freeze(checks),
    requiredMeasures: Object.freeze([...new Set(requiredMeasures)]),
    missingInputs: Object.freeze(missingInputs)
  });
}

export default assessChargeLimit;
