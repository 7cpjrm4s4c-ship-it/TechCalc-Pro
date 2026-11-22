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
const hasAnswer = value => value === true || value === false || value === 'yes' || value === 'no';
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

function consistencyRequirement({ id, title, requirement, measure, status = STATE_CONSISTENCY_STATUS.FAILED, missingInputs = [], source = SOURCE }) {
  return freezeRequirement({
    id,
    category: 'guidance',
    title,
    requirement,
    measure,
    source,
    status,
    priority: 'required',
    missingInputs
  });
}

function isMachineryRoom(state = {}) {
  return text(state.installationLocation) === 'machinery-room';
}

function isOutdoor(state = {}) {
  return text(state.installationLocation) === 'outdoor';
}

function isTechnicalRoom(state = {}) {
  return text(state.installationLocation) === 'technical-room';
}

function isOccupiedSpace(state = {}) {
  return text(state.installationLocation) === 'occupied-space';
}

function isVentilatedEnclosure(state = {}) {
  return text(state.installationLocation) === 'ventilated-enclosure';
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

  // Klasse II richtet sich nach dem Standort der Verdichter und Druckbehälter (EN 378-1,
  // 5.3 c): Maschinenraum oder im Freien. Ein abgeschlossener Raum ohne Personenaufenthalt
  // mit Verdichter/Druckbehälter wird nach EN 378-3, 4.5 wie ein Maschinenraum behandelt -
  // daher ist Klasse II auch für den Aufstellort "Technischer Raum" zulässig (z. B.
  // Split-Anlage mit Verdichter/Außengerät im Freien und Innengerät in einem Raum
  // ohne Personenaufenthalt). Ebenso ist Klasse II im Personen-Aufenthaltsbereich nach
  // EN 378-1, 5.3 c und 5.3 d zulässig, sofern alle Verdichter und Druckbehälter im
  // Maschinenraum oder im Freien stehen (Rohrschlangen/Rohrleitungen mit Ventilen dürfen
  // sich im Personen-Aufenthaltsbereich befinden) - das wird über das Feld
  // classIiCompressorsOutsideOrMachineryRoom bestätigt.
  const SOURCE_CLASS_II = Object.freeze({ sourcePart: 'EN 378-1', sourceSection: '5.3 c und 5.3 d' });
  if (installationClass === 'II' && !isMachineryRoom(currentState) && !isOutdoor(currentState) && !isTechnicalRoom(currentState)) {
    if (isOccupiedSpace(currentState)) {
      const classIiConfirmed = currentState.classIiCompressorsOutsideOrMachineryRoom;
      if (yes(classIiConfirmed)) {
        // Voraussetzung bestätigt (EN 378-1, 5.3 c/d): Klasse II im Personen-Aufenthaltsbereich zulässig, kein Konflikt.
      } else if (hasAnswer(classIiConfirmed)) {
        requirements.push(consistencyRequirement({
          id: 'state-consistency.class-ii-location',
          title: 'Klasse II mit Aufstellort abgleichen',
          requirement: 'Klasse II setzt voraus, dass sich alle Verdichter und Druckbehälter im Maschinenraum oder im Freien befinden (EN 378-1, 5.3 c und 5.3 d). Andernfalls ist die Aufstellungsort-Klassifikation zu korrigieren (in der Regel Klasse I).',
          measure: 'Aufstellort auf Maschinenraum oder Außenaufstellung ändern oder eine andere Aufstellungsort-Klassifikation wählen; Voraussetzung für Klasse II im Personen-Aufenthaltsbereich prüfen (EN 378-1, 5.3 c und 5.3 d).',
          source: SOURCE_CLASS_II
        }));
      } else {
        requirements.push(consistencyRequirement({
          id: 'state-consistency.class-ii-location',
          title: 'Klasse II mit Aufstellort abgleichen',
          requirement: 'Klasse II im Personen-Aufenthaltsbereich setzt voraus, dass sich alle Verdichter und Druckbehälter im Maschinenraum oder im Freien befinden (EN 378-1, 5.3 c und 5.3 d); Rohrschlangen und Rohrleitungen mit Ventilen dürfen sich im Personen-Aufenthaltsbereich befinden.',
          measure: 'Bestätigen, dass alle Verdichter und Druckbehälter im Maschinenraum oder im Freien angeordnet sind (EN 378-1, 5.3 c und 5.3 d).',
          status: 'not-assessed',
          missingInputs: ['classIiCompressorsOutsideOrMachineryRoom'],
          source: SOURCE_CLASS_II
        }));
      }
    } else {
      requirements.push(consistencyRequirement({
        id: 'state-consistency.class-ii-location',
        title: 'Klasse II mit Aufstellort abgleichen',
        requirement: 'Klasse II beschreibt Verdichter und Druckbehälter im Maschinenraum oder im Freien (EN 378-1, 5.3 c); ein abgeschlossener Raum ohne Personenaufenthalt mit Verdichter oder Druckbehälter gilt nach EN 378-3, 4.5 als Maschinenraum.',
        measure: 'Aufstellort auf Maschinenraum oder Außenaufstellung ändern oder eine andere Aufstellungsort-Klassifikation wählen; bei Verdichter/Druckbehälter im abgeschlossenen Raum ohne Personenaufenthalt ist der Aufstellort nach EN 378-3, 4.5 wie ein Maschinenraum zu behandeln (EN 378-1, 5.3 c).'
      }));
    }
  }

  // EN 378-3, 4.5 (Abs. 2, M2): Ein abgeschlossener Raum ohne Personenaufenthalt mit
  // Verdichter oder Druckbehälter wird wie ein Maschinenraum behandelt. Daher ist
  // Klasse III (vollständige Aufstellung in Maschinenraum oder im Freien, EN 378-1,
  // 5.3 b) auch für den Aufstellort "Technischer Raum" zulässig, wenn der Raumabschluss
  // bestätigt ist und Verdichter/Druckbehälter vorhanden sind (analog zur
  // Klasse-II-Korrektur in Commit 6454c3f).
  const SOURCE_CLASS_III = Object.freeze({ sourcePart: 'EN 378-1 / EN 378-3', sourceSection: '5.3 b / 4.5' });
  const technicalRoomMachineryRoomCase = isTechnicalRoom(currentState)
    && text(currentState.technicalRoomSeparatedFromOccupiedSpaces) === 'yes'
    && text(currentState.technicalRoomContainsCompressorOrPressureVessel) === 'yes';
  if (installationClass === 'III' && !isMachineryRoom(currentState) && !isOutdoor(currentState) && !technicalRoomMachineryRoomCase) {
    requirements.push(consistencyRequirement({
      id: 'state-consistency.class-iii-location',
      title: 'Klasse III mit Aufstellort abgleichen',
      requirement: 'Klasse III setzt voraus, dass alle kältemittelführenden Teile im Maschinenraum oder im Freien angeordnet sind (EN 378-1, 5.3 b). Ein abgeschlossener Raum ohne Personenaufenthalt mit Verdichter oder Druckbehälter gilt nach EN 378-3, 4.5, als Maschinenraum.',
      measure: 'Aufstellort, Maschinenraum-Angabe oder Aufstellungsort-Klassifikation fachlich angleichen.',
      source: SOURCE_CLASS_III
    }));
  }

  // EN 378-1, 5.3 a): Aufstellort "belüftetes Gehäuse" erfordert Klasse IV (alle
  // kältemittelführenden Teile im belüfteten Gehäuse, das EN 378-2 und EN 378-3 erfüllt).
  if (isVentilatedEnclosure(currentState) && installationClass && installationClass !== 'IV') {
    requirements.push(consistencyRequirement({
      id: 'state-consistency.class-iv-required',
      title: 'Klasse IV für belüftetes Gehäuse erforderlich',
      requirement: 'Klasse IV (belüftetes Gehäuse) setzt voraus, dass sich alle kältemittelführenden Teile in einem belüfteten Gehäuse befinden, das die Anforderungen nach EN 378-2 und EN 378-3 erfüllt (EN 378-1, 5.3 a).',
      measure: 'Aufstellungsort-Klassifikation auf Klasse IV setzen oder einen anderen Aufstellort wählen.'
    }));
  }

  // Klasse IV (belüftetes Gehäuse) ist nur im Personen-Aufenthaltsbereich zulässig;
  // der Aufstellort "belüftetes Gehäuse" ist die explizite Angabe dieser Kombination.
  if (installationClass === 'IV' && !isOccupiedSpace(currentState) && !isVentilatedEnclosure(currentState)) {
    requirements.push(consistencyRequirement({
      id: 'state-consistency.class-iv-location',
      title: 'Klasse IV mit Personen-Aufenthaltsbereich abgleichen',
      requirement: 'Klasse IV beschreibt ein belüftetes Gehäuse im Personen-Aufenthaltsbereich.',
      measure: 'Aufstellort auf Personen-Aufenthaltsbereich oder belüftetes Gehäuse ändern oder eine passende Aufstellungsort-Klassifikation wählen.'
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

  // EN 378-3, 4.5 (M1): Ist der technische Raum nicht abgeschlossen, werden die Komponenten
  // wie im Personen-Aufenthaltsbereich (4.4) behandelt; ausgefüllte 4.5-Detailfelder sind in
  // diesem Umleitungsfall nicht relevant und ein Konflikt.
  if (text(currentState.installationLocation) === 'technical-room' &&
      text(currentState.technicalRoomSeparatedFromOccupiedSpaces) === 'no') {
    const answeredDetails = [
      hasAnswer(currentState.technicalRoomContainsCompressorOrPressureVessel),
      hasAnswer(currentState.technicalRoomComponentsHaveDetachableJoints),
      hasAnswer(currentState.technicalRoomVentilationActivatesDetector),
      Boolean(text(currentState.technicalRoomExhaustHoodFlowRateM3s)),
      ['vibrations', 'corrosive-atmosphere', 'vibrations-and-corrosive'].includes(text(currentState.technicalRoomAdverseConditions))
    ];
    if (answeredDetails.some(Boolean)) {
      requirements.push(consistencyRequirement({
        id: 'state-consistency.technical-room-details-in-redirect',
        title: '4.5-Detailangaben im Umleitungsfall 4.4',
        requirement: 'Ist der Raum nicht gegenüber Personen-Aufenthaltsbereichen abgeschlossen, erfolgt die Bewertung nach EN 378-3 Abschnitt 4.4; Detailangaben zu Abzugshaube, Verdichter/Druckbehälter oder lösbaren Verbindungen sind dann nicht relevant.',
        measure: 'Detailfelder zum technischen Raum (4.5) nur ausfüllen, wenn der Raum abgeschlossen ist, oder den Raumabschluss auf „Ja“ setzen.'
      }));
    }
  }

  // EN 378-3 Abschnitte 8 und 9: Alarmierung ohne Gaswarnanlage und ohne Detektor ist
  // unplausibel - ohne Auslösehardware kann der Alarm nicht ausgelöst werden.
  if ((yes(currentState.hasAlarm) || yes(currentState.hasIndependentAlarmPower)) &&
      text(currentState.hasGasWarningSystem) === 'no' && text(currentState.hasDetector) === 'no') {
    requirements.push(consistencyRequirement({
      id: 'state-consistency.alarm-without-trigger-hardware',
      title: 'Alarmierung ohne Gaswarnanlage und ohne Detektor',
      requirement: 'Eine Alarmierung nach EN 378-3 Abschnitt 8 muss durch ein Gaswarnsystem (Detektor nach Abschnitt 9) ausgelöst werden; ohne Gaswarnanlage und ohne Detektor ist keine Auslösehardware vorhanden.',
      measure: 'Gaswarnanlage oder Kältemitteldetektor vorsehen oder Alarmierung und unabhängige Alarmstromversorgung auf „Nein“ setzen.'
    }));
  }

  return Object.freeze({
    status: requirements.some(item => item.status === STATE_CONSISTENCY_STATUS.FAILED)
      ? STATE_CONSISTENCY_STATUS.FAILED
      : requirements.some(item => item.status === 'not-assessed') ? 'not-assessed' : STATE_CONSISTENCY_STATUS.PASSED,
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
