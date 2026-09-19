export const EN_378_ALTERNATIVE_RISK_MEASURES_VERSION = 1;

export const ALTERNATIVE_RISK_MEASURE_STATUS = Object.freeze({
  PASSED: 'passed',
  FAILED: 'failed',
  NOT_ASSESSED: 'not-assessed',
  NOT_APPLICABLE: 'not-applicable',
  REQUIRED: 'required'
});

const SOURCE = Object.freeze({
  c3: Object.freeze({ sourcePart: 'EN 378-1', sourceSection: 'C.3.2' }),
  ventilationOpenings: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '6.3.2' }),
  mechanicalVentilation: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '6.3.3' }),
  shutoffValves: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '6.4' }),
  alarms: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '8' })
});

const ALTERNATIVE_REQUIREMENT_IDS = Object.freeze([
  'alternative-precautions.applicability',
  'hasVentilationOpenings',
  'hasMechanicalVentilation',
  'hasSafetyShutoffValves'
]);

const numberOrNull = value => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};
const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const yes = value => value === true || value === 'yes';
const hasAnswer = value => value === true || value === false || value === 'yes' || value === 'no';
const unique = values => [...new Set((values || []).filter(Boolean))];
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

function freezeRequirement(requirement) {
  return Object.freeze({
    ...requirement,
    source: Object.freeze(requirement.source || {}),
    missingInputs: Object.freeze(requirement.missingInputs || []),
    measures: Object.freeze(requirement.measures || []),
    details: Object.freeze(requirement.details || {})
  });
}

function buildRequirement({
  id,
  category = 'safetyMeasures',
  title,
  requirement,
  measure,
  source,
  status = ALTERNATIVE_RISK_MEASURE_STATUS.REQUIRED,
  priority = 'required',
  missingInputs = [],
  details = {}
}) {
  return freezeRequirement({ id, category, title, requirement, measure, source, status, priority, missingInputs, details });
}

export function calculateDilutionOpeningArea({ chargeKg, roomVolumeM3, qlmvKgM3 } = {}) {
  const charge = numberOrNull(chargeKg);
  const volume = numberOrNull(roomVolumeM3);
  const qlmv = numberOrNull(qlmvKgM3);
  if (charge == null || charge <= 0 || volume == null || volume <= 0 || qlmv == null || qlmv <= 0) return null;
  return round((0.0032 * charge) / (qlmv * volume), 5);
}

export function calculateSimplifiedMechanicalVentilationFlow({ rclKgM3 } = {}) {
  const rcl = numberOrNull(rclKgM3);
  if (rcl == null || rcl <= 0) return null;
  return round(10 / rcl, 1);
}

function getC3Check(chargeLimitAssessment = {}) {
  return (chargeLimitAssessment.checks || []).find(check => check.id === 'charge-limit.alternative-risk-management') || null;
}

function c3CanResolveChargeLimit(check = {}) {
  return ['between-qlmv-and-qlav', 'between-rcl-and-qlav', 'concentration-not-above-qlmv', 'concentration-not-above-rcl'].includes(check.rule);
}

function chargeCheckCanUseC3(check = {}) {
  return String(check.rule || '').includes('or-c3') || String(check.rule || '').includes('c2-or-c3');
}

function requiredMeasureCountForC3(check = {}) {
  if (!check) return null;
  if (check.status === 'passed' && c3CanResolveChargeLimit(check)) return 0;
  if (check.rule === 'between-rcl-and-qlav') return 2;
  if (check.rule === 'between-qlmv-and-qlav') return 1;
  if (check.rule === 'concentration-above-qlav') return null;
  if (check.status === 'failed') return 1;
  return null;
}

function maxChargeByQlav(c3Check = {}, state = {}) {
  const qlav = numberOrNull(c3Check.details?.qlavKgM3);
  const volume = numberOrNull(state.roomVolumeM3);
  if (qlav == null || qlav <= 0 || volume == null || volume <= 0) return null;
  return round(qlav * volume, 3);
}

function selectedMeasures(state = {}) {
  return [
    {
      field: 'hasVentilationOpenings',
      title: 'Verdünnungsöffnungen',
      selected: yes(state.hasVentilationOpenings),
      answered: hasAnswer(state.hasVentilationOpenings),
      source: SOURCE.ventilationOpenings
    },
    {
      field: 'hasMechanicalVentilation',
      title: 'mechanische Lüftung',
      selected: yes(state.hasMechanicalVentilation),
      answered: hasAnswer(state.hasMechanicalVentilation),
      source: SOURCE.mechanicalVentilation
    },
    {
      field: 'hasSafetyShutoffValves',
      title: 'Sicherheitsabsperrventile',
      selected: yes(state.hasSafetyShutoffValves),
      answered: hasAnswer(state.hasSafetyShutoffValves),
      source: SOURCE.shutoffValves
    },
    {
      field: 'hasAlarm',
      title: 'Alarmierung',
      selected: yes(state.hasAlarm),
      answered: hasAnswer(state.hasAlarm),
      source: SOURCE.alarms
    }
  ];
}

function selectedMeasureRequirements({ measures, details, state }) {
  const requirements = [];
  if (measures.some(item => item.field === 'hasVentilationOpenings' && item.selected)) {
    requirements.push(buildRequirement({
      id: 'alternative-precautions.ventilation-openings',
      category: 'ventilation',
      title: 'Verdünnungsöffnungen als alternative Vorkehrung',
      requirement: 'Verdünnungsöffnungen müssen hoch und niedrig angeordnet sein. Die untere Öffnung darf höchstens 0,2 m über dem Boden liegen; die obere Öffnung muss oberhalb der Türöffnung angeordnet werden.',
      measure: `Verdünnungsöffnungen mit mindestens ${details.openingAreaM2 ?? 'nicht bestimmbarer'} m² freier Öffnungsfläche und geeigneter Anordnung planen.`,
      source: SOURCE.ventilationOpenings,
      status: details.openingAreaM2 == null ? ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED : ALTERNATIVE_RISK_MEASURE_STATUS.PASSED,
      missingInputs: details.openingAreaM2 == null ? ['qlmvKgM3'] : [],
      details
    }));
  }
  if (measures.some(item => item.field === 'hasMechanicalVentilation' && item.selected)) {
    requirements.push(buildRequirement({
      id: 'alternative-precautions.mechanical-ventilation',
      category: 'ventilation',
      title: 'Mechanische Lüftung als alternative Vorkehrung',
      requirement: 'Mechanische Lüftung als Sicherheitsmaßnahme muss dauerhaft in Betrieb sein oder durch einen Detektor eingeschaltet werden.',
      measure: `Mechanische Lüftung mit mindestens ${details.mechanicalVentilationFlowM3h ?? 'nicht bestimmbarer'} m³/h nach vereinfachter Gleichung Q = 10 / RCL auslegen oder gleichwertig nachweisen.`,
      source: SOURCE.mechanicalVentilation,
      status: details.mechanicalVentilationFlowM3h == null ? ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED : ALTERNATIVE_RISK_MEASURE_STATUS.PASSED,
      missingInputs: details.mechanicalVentilationFlowM3h == null ? ['rclKgM3'] : [],
      details
    }));
  }
  if (measures.some(item => item.field === 'hasSafetyShutoffValves' && item.selected)) {
    requirements.push(buildRequirement({
      id: 'alternative-precautions.shutoff-valves',
      category: 'safetyMeasures',
      title: 'Sicherheitsabsperrventile als alternative Vorkehrung',
      requirement: 'Sicherheitsabsperrventile müssen den Kältemittelstrom im Leckagefall absperren, bei Stromausfall schließen und außerhalb des Personen-Aufenthaltsbereichs zugänglich angeordnet sein.',
      measure: yes(state.hasDetector)
        ? 'Absperrventile außerhalb des Personen-Aufenthaltsbereichs anordnen, detektorgesteuert aktivieren und Fail-Safe-Schließfunktion dokumentieren.'
        : 'Absperrventile außerhalb des Personen-Aufenthaltsbereichs anordnen und einen geeigneten Detektor zur Auslösung vorsehen.',
      source: SOURCE.shutoffValves,
      status: yes(state.hasDetector) ? ALTERNATIVE_RISK_MEASURE_STATUS.PASSED : ALTERNATIVE_RISK_MEASURE_STATUS.FAILED,
      missingInputs: yes(state.hasDetector) ? [] : ['hasDetector'],
      details
    }));
  }
  if (measures.some(item => item.field === 'hasAlarm' && item.selected)) {
    requirements.push(buildRequirement({
      id: 'alternative-precautions.alarm',
      category: 'alarm',
      title: 'Alarmierung als alternative Vorkehrung',
      requirement: 'Bei Nutzung der Alarmierung als Sicherheitsmaßnahme muss das Alarmsystem Personen warnen und befugte Personen alarmieren. Die Stromversorgung des Alarmsystems muss von der mechanischen Lüftung und der Kälteanlage unabhängig sein.',
      measure: yes(state.hasIndependentAlarmPower)
        ? 'Alarmierung mit unabhängiger Stromversorgung dokumentieren.'
        : 'Alarmierung mit unabhängiger Stromversorgung oder geeigneter Zusatzstromversorgung ausstatten.',
      source: SOURCE.alarms,
      status: yes(state.hasIndependentAlarmPower) ? ALTERNATIVE_RISK_MEASURE_STATUS.PASSED : ALTERNATIVE_RISK_MEASURE_STATUS.FAILED,
      missingInputs: yes(state.hasIndependentAlarmPower) ? [] : ['hasIndependentAlarmPower'],
      details
    }));
  }
  return requirements;
}

export function assessAlternativeRiskMeasures(currentState = {}, chargeLimitAssessment = {}) {
  const c3Check = getC3Check(chargeLimitAssessment);
  const c3Requested = yes(currentState.usesAlternativeRiskManagement) || Boolean(c3Check);
  if (!c3Requested) {
    return Object.freeze({
      status: ALTERNATIVE_RISK_MEASURE_STATUS.NOT_APPLICABLE,
      requiredMeasureCount: 0,
      selectedMeasureCount: 0,
      maximumChargeKg: null,
      requirements: Object.freeze([]),
      requiredMeasures: Object.freeze([]),
      missingInputs: Object.freeze([]),
      details: Object.freeze({})
    });
  }
  if (!c3Check) {
    return Object.freeze({
      status: ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED,
      requiredMeasureCount: null,
      selectedMeasureCount: 0,
      maximumChargeKg: null,
      requirements: Object.freeze([buildRequirement({
        id: 'alternative-precautions.c3-assessment',
        title: 'Alternative Vorkehrungen bewerten',
        requirement: 'Für alternative Vorkehrungen muss zunächst die C.3-Konzentrationsbewertung vorliegen.',
        measure: 'Füllmenge, Raumvolumen und Kältemitteldaten ergänzen und C.3-Bewertung erneut durchführen.',
        source: SOURCE.c3,
        status: ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED,
        missingInputs: ['chargeKg', 'roomVolumeM3']
      })]),
      requiredMeasures: Object.freeze([]),
      missingInputs: Object.freeze(['chargeKg', 'roomVolumeM3']),
      details: Object.freeze({})
    });
  }
  if (c3Check.status === 'not-assessed') {
    const missingInputs = c3Check.missingInputs || [];
    return Object.freeze({
      status: ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED,
      requiredMeasureCount: null,
      selectedMeasureCount: 0,
      maximumChargeKg: null,
      requirements: Object.freeze([buildRequirement({
        id: 'alternative-precautions.c3-data',
        title: 'C.3-Grenzwerte ergänzen',
        requirement: c3Check.reason || 'Für die C.3-Bewertung fehlen Grenzwerte oder Eingaben.',
        measure: 'Fehlende Angaben ergänzen oder alternatives Aufstellkonzept wählen.',
        source: SOURCE.c3,
        status: ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED,
        missingInputs
      })]),
      requiredMeasures: Object.freeze(['Fehlende Angaben ergänzen oder alternatives Aufstellkonzept wählen.']),
      missingInputs: Object.freeze(missingInputs),
      details: Object.freeze({})
    });
  }
  if (c3Check.rule === 'concentration-above-qlav') {
    return Object.freeze({
      status: ALTERNATIVE_RISK_MEASURE_STATUS.FAILED,
      requiredMeasureCount: null,
      selectedMeasureCount: 0,
      maximumChargeKg: maxChargeByQlav(c3Check, currentState),
      requirements: Object.freeze([buildRequirement({
        id: 'alternative-precautions.qlav-exceeded',
        title: 'QLAV überschritten',
        requirement: 'Die Kältemittelkonzentration überschreitet QLAV. Der C.3-Pfad reicht in diesem Fall nicht aus.',
        measure: 'Füllmenge reduzieren, Raumvolumen vergrößern oder Aufstellkonzept ändern.',
        source: SOURCE.c3,
        status: ALTERNATIVE_RISK_MEASURE_STATUS.FAILED,
        details: c3Check.details || {}
      })]),
      requiredMeasures: Object.freeze(['Füllmenge reduzieren, Raumvolumen vergrößern oder Aufstellkonzept ändern.']),
      missingInputs: Object.freeze([]),
      details: Object.freeze(c3Check.details || {})
    });
  }

  const requiredMeasureCount = requiredMeasureCountForC3(c3Check) ?? 0;
  const measures = selectedMeasures(currentState);
  const selected = measures.filter(item => item.selected);
  const unanswered = measures.filter(item => !item.answered);
  const selectedMeasureCount = selected.length;
  const maximumChargeKg = maxChargeByQlav(c3Check, currentState);
  const details = Object.freeze({
    ...(c3Check.details || {}),
    requiredMeasureCount,
    selectedMeasureCount,
    maximumChargeKg,
    openingAreaM2: calculateDilutionOpeningArea({
      chargeKg: currentState.chargeKg,
      roomVolumeM3: currentState.roomVolumeM3,
      qlmvKgM3: c3Check.details?.qlmvKgM3
    }),
    mechanicalVentilationFlowM3h: calculateSimplifiedMechanicalVentilationFlow({
      rclKgM3: c3Check.details?.rclKgM3
    }),
    selectedMeasures: Object.freeze(selected.map(item => item.title))
  });

  const status = requiredMeasureCount === 0 || selectedMeasureCount >= requiredMeasureCount
    ? ALTERNATIVE_RISK_MEASURE_STATUS.PASSED
    : unanswered.length
      ? ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED
      : ALTERNATIVE_RISK_MEASURE_STATUS.FAILED;
  const missingCount = Math.max(0, requiredMeasureCount - selectedMeasureCount);
  const requirements = [buildRequirement({
    id: 'alternative-precautions.minimum-measures',
    title: 'Mindestanzahl alternativer Vorkehrungen erfüllen',
    requirement: requiredMeasureCount === 0
      ? 'Die C.3-Konzentrationsbewertung erfordert keine zusätzliche alternative Vorkehrung.'
      : `Mindestens ${requiredMeasureCount} alternative Vorkehrung(en) nach EN 378-1 C.3 und EN 378-3 Abschnitt 6 oder Abschnitt 8 sind erforderlich.`,
    measure: status === ALTERNATIVE_RISK_MEASURE_STATUS.PASSED
      ? 'Ausgewählte alternative Vorkehrungen dokumentieren und in die Planung übernehmen.'
      : `Mindestens ${missingCount} weitere alternative Vorkehrung(en) auswählen oder Aufstellkonzept ändern.`,
    source: SOURCE.c3,
    status,
    missingInputs: status === ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED ? unanswered.map(item => item.field) : [],
    details
  }), ...selectedMeasureRequirements({ measures: selected, details, state: currentState })];
  const failed = requirements.filter(item => item.status === ALTERNATIVE_RISK_MEASURE_STATUS.FAILED);
  const open = requirements.filter(item => item.status === ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED);
  const finalStatus = failed.length ? ALTERNATIVE_RISK_MEASURE_STATUS.FAILED : open.length ? ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED : status;
  const requiredMeasures = requirements
    .filter(item => [ALTERNATIVE_RISK_MEASURE_STATUS.REQUIRED, ALTERNATIVE_RISK_MEASURE_STATUS.FAILED, ALTERNATIVE_RISK_MEASURE_STATUS.NOT_ASSESSED].includes(item.status))
    .map(item => item.measure)
    .filter(Boolean);
  const missingInputs = unique(open.flatMap(item => item.missingInputs || []));

  return Object.freeze({
    status: finalStatus,
    requiredMeasureCount,
    selectedMeasureCount,
    maximumChargeKg,
    requirements: Object.freeze(requirements),
    requiredMeasures: Object.freeze(unique(requiredMeasures)),
    missingInputs: Object.freeze(missingInputs),
    details
  });
}

export function applyAlternativeRiskMeasuresToChargeLimitAssessment(chargeLimitAssessment = {}, alternativeRiskMeasuresAssessment = {}, currentState = {}) {
  if (alternativeRiskMeasuresAssessment.status !== ALTERNATIVE_RISK_MEASURE_STATUS.PASSED) return chargeLimitAssessment;
  const c3Check = getC3Check(chargeLimitAssessment);
  if (!c3Check || !c3CanResolveChargeLimit(c3Check)) return chargeLimitAssessment;
  const checks = (chargeLimitAssessment.checks || []).map(check => {
    if (check.id === 'charge-limit.alternative-risk-management') {
      return Object.freeze({
        ...clone(check),
        status: 'passed',
        maximumChargeKg: alternativeRiskMeasuresAssessment.maximumChargeKg,
        requirements: Object.freeze([...(check.requirements || []), 'Alternative Vorkehrungen erfüllen die erforderliche Mindestanzahl.']),
        measures: Object.freeze([]),
        details: Object.freeze({ ...(check.details || {}), alternativeRiskMeasuresStatus: 'passed' })
      });
    }
    if (check.status === 'failed' && chargeCheckCanUseC3(check)) {
      return Object.freeze({
        ...clone(check),
        status: 'passed',
        requirements: Object.freeze([...(check.requirements || []), 'Grenzwertüberschreitung wird über alternative Vorkehrungen nach EN 378-1 C.3 behandelt.']),
        measures: Object.freeze([]),
        details: Object.freeze({ ...(check.details || {}), resolvedByAlternativeRiskMeasures: true })
      });
    }
    return check;
  });
  const failedChecks = checks.filter(check => check.status === 'failed');
  const openChecks = checks.filter(check => check.status === 'not-assessed');
  const requiredMeasures = failedChecks.flatMap(check => check.measures || []);
  const missingInputs = unique(openChecks.flatMap(check => check.missingInputs || []));
  return Object.freeze({
    ...clone(chargeLimitAssessment),
    status: failedChecks.length ? 'failed' : openChecks.length ? 'not-assessed' : 'passed',
    maximumAllowedChargeKg: alternativeRiskMeasuresAssessment.maximumChargeKg ?? chargeLimitAssessment.maximumAllowedChargeKg ?? null,
    checks: Object.freeze(checks),
    requiredMeasures: Object.freeze(unique(requiredMeasures)),
    missingInputs: Object.freeze(missingInputs),
    alternativeRiskMeasuresApplied: true,
    alternativeRiskMeasures: Object.freeze(clone(alternativeRiskMeasuresAssessment))
  });
}

export function mergeAlternativeRiskMeasuresAssessment(installationSafetyAssessment = {}, alternativeRiskMeasuresAssessment = {}) {
  if (!alternativeRiskMeasuresAssessment?.requirements?.length) return installationSafetyAssessment;
  const preservedRequirements = (installationSafetyAssessment.requirements || [])
    .filter(item => !ALTERNATIVE_REQUIREMENT_IDS.includes(item.id));
  const requirements = Object.freeze([...preservedRequirements, ...alternativeRiskMeasuresAssessment.requirements]);
  const failed = requirements.filter(item => item.status === 'failed');
  const notAssessed = requirements.filter(item => item.status === 'not-assessed');
  const requiredMeasures = requirements
    .filter(item => ['required', 'failed', 'not-assessed'].includes(item.status))
    .map(item => item.measure)
    .filter(Boolean);
  const missingInputs = unique(notAssessed.flatMap(item => item.missingInputs || []));
  return Object.freeze({
    ...clone(installationSafetyAssessment),
    status: failed.length ? 'failed' : notAssessed.length ? 'not-assessed' : 'passed',
    requirements,
    requiredMeasures: Object.freeze(unique(requiredMeasures)),
    missingInputs: Object.freeze(missingInputs),
    alternativeRiskMeasures: Object.freeze(clone(alternativeRiskMeasuresAssessment))
  });
}

export default assessAlternativeRiskMeasures;
