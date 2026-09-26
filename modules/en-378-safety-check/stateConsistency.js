export const EN_378_STATE_CONSISTENCY_VERSION = 1;

export const STATE_CONSISTENCY_STATUS = Object.freeze({
  PASSED: 'passed',
  FAILED: 'failed',
  NOT_APPLICABLE: 'not-applicable'
});

const SOURCE = Object.freeze({
  sourcePart: 'TechCalc Pro',
  sourceSection: 'Plausibilitätsprüfung EN 378'
});

const yes = value => value === true || value === 'yes';
const text = value => String(value ?? '').trim();
const unique = values => [...new Set((values || []).filter(Boolean))];
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

function freezeRequirement(requirement) {
  return Object.freeze({
    ...requirement,
    source: Object.freeze(requirement.source || SOURCE),
    missingInputs: Object.freeze(requirement.missingInputs || []),
    measures: Object.freeze(requirement.measures || []),
    details: Object.freeze(requirement.details || {})
  });
}

function consistencyRequirement({ id, title, requirement, measure, status = STATE_CONSISTENCY_STATUS.FAILED }) {
  return freezeRequirement({
    id,
    category: 'guidance',
    title,
    requirement,
    measure,
    source: SOURCE,
    status,
    priority: 'required'
  });
}

function isMachineryRoom(state = {}) {
  return text(state.installationLocation) === 'machinery-room' || yes(state.hasMachineryRoom);
}

function isOutdoor(state = {}) {
  return text(state.installationLocation) === 'outdoor';
}

function isOccupiedSpace(state = {}) {
  return text(state.installationLocation) === 'occupied-space';
}

export function assessStateConsistency(currentState = {}) {
  const requirements = [];
  const installationClass = text(currentState.installationClass);
  const installationLocation = text(currentState.installationLocation);
  const accessArea = text(currentState.accessArea);

  if (installationLocation === 'machinery-room' && accessArea && accessArea !== 'authorized-access') {
    requirements.push(consistencyRequirement({
      id: 'state-consistency.machinery-room-access',
      title: 'Maschinenraum-Zugang plausibilisieren',
      requirement: 'Ein Maschinenraum darf nicht wie ein allgemein zugänglicher Aufenthaltsbereich behandelt werden.',
      measure: 'Zugangsbereich auf Zugang nur für unterwiesene oder befugte Personen ändern oder Aufstellort neu bewerten.'
    }));
  }

  if (installationClass === 'II' && !isMachineryRoom(currentState) && !isOutdoor(currentState)) {
    requirements.push(consistencyRequirement({
      id: 'state-consistency.class-ii-location',
      title: 'Klasse II mit Aufstellort abgleichen',
      requirement: 'Klasse II beschreibt eine Aufstellung im Maschinenraum oder im Freien.',
      measure: 'Aufstellort auf Maschinenraum oder Außenaufstellung ändern oder eine andere Aufstellungsort-Klassifikation wählen.'
    }));
  }

  if (installationClass === 'III' && !isMachineryRoom(currentState) && !isOutdoor(currentState)) {
    requirements.push(consistencyRequirement({
      id: 'state-consistency.class-iii-location',
      title: 'Klasse III mit Aufstellort abgleichen',
      requirement: 'Klasse III setzt voraus, dass relevante Anlagenteile beziehungsweise der Verdichter im Maschinenraum oder im Freien angeordnet sind.',
      measure: 'Aufstellort, Maschinenraum-Angabe oder Aufstellungsort-Klassifikation fachlich angleichen.'
    }));
  }

  if (installationClass === 'IV' && !isOccupiedSpace(currentState)) {
    requirements.push(consistencyRequirement({
      id: 'state-consistency.class-iv-location',
      title: 'Klasse IV mit Personen-Aufenthaltsbereich abgleichen',
      requirement: 'Klasse IV beschreibt mechanische Geräte im Personen-Aufenthaltsbereich.',
      measure: 'Aufstellort auf Personen-Aufenthaltsbereich ändern oder eine passende Aufstellungsort-Klassifikation wählen.'
    }));
  }

  if (text(currentState.ventilationType) === 'none' && yes(currentState.hasMechanicalVentilation)) {
    requirements.push(consistencyRequirement({
      id: 'state-consistency.ventilation-contradiction',
      title: 'Lüftungsangaben angleichen',
      requirement: 'Die Angabe keine gesicherte Lüftung widerspricht einer gleichzeitig bestätigten mechanischen Lüftung.',
      measure: 'Lüftungsart und Angabe zur mechanischen Lüftung fachlich konsistent auswählen.'
    }));
  }

  return Object.freeze({
    status: requirements.length ? STATE_CONSISTENCY_STATUS.FAILED : STATE_CONSISTENCY_STATUS.PASSED,
    requirements: Object.freeze(requirements),
    requiredMeasures: Object.freeze(unique(requirements.map(item => item.measure))),
    missingInputs: Object.freeze([])
  });
}

export function mergeStateConsistencyAssessment(installationSafetyAssessment = {}, stateConsistencyAssessment = {}) {
  if (!stateConsistencyAssessment?.requirements?.length) return installationSafetyAssessment;
  const requirements = Object.freeze([...(installationSafetyAssessment.requirements || []), ...stateConsistencyAssessment.requirements]);
  const failed = requirements.filter(item => item.status === 'failed');
  const notAssessed = requirements.filter(item => item.status === 'not-assessed');
  const requiredMeasures = requirements
    .filter(item => ['required', 'failed', 'not-assessed'].includes(item.status))
    .map(item => item.measure)
    .filter(Boolean);
  const missingInputs = unique(notAssessed.flatMap(item => item.missingInputs || []));

  return Object.freeze({
    ...clone(installationSafetyAssessment),
    status: failed.length ? 'failed' : notAssessed.length ? 'not-assessed' : installationSafetyAssessment.status || 'passed',
    requirements,
    requiredMeasures: Object.freeze(unique(requiredMeasures)),
    missingInputs: Object.freeze(missingInputs),
    stateConsistency: Object.freeze(clone(stateConsistencyAssessment))
  });
}

export default assessStateConsistency;
