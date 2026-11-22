export const EN_378_INSTALLATION_REQUIREMENTS_VERSION = 1;

export const REQUIREMENT_STATUS = Object.freeze({
  REQUIRED: 'required',
  PASSED: 'passed',
  FAILED: 'failed',
  NOT_APPLICABLE: 'not-applicable',
  NOT_ASSESSED: 'not-assessed'
});

const SOURCE = Object.freeze({
  arrangement: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '4' }),
  outdoorArrangement: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '4.2' }),
  machineryRoom: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5' }),
  machineryRoomVentilation: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13' }),
  alternativePrecautions: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '6' }),
  dilutionOpenings: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '6.3.2' }),
  mechanicalVentilation: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '6.3.3' }),
  shutoffValves: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '6.4' }),
  electricalEquipment: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '7.3' }),
  alarms: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '8' }),
  detectors: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '9' }),
  warnings: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '10' }),
  r717: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.14.3 / 8.4 / 9.3.3' })
});

const numberOrNull = value => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const yes = value => value === true || value === 'yes';
const no = value => value === false || value === 'no';
const hasAnswer = value => value === true || value === false || value === 'yes' || value === 'no';
const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const isFlammable = flammabilityClass => ['2L', '2', '3'].includes(flammabilityClass);
const isDetectorClass93_2 = safetyData => ['A2L', 'A2', 'B2L', 'B2', 'A3', 'B3'].includes(`${safetyData?.toxicityClass || ''}${safetyData?.flammabilityClass || ''}`);
const isR717 = safetyData => safetyData?.standardNumber === '717' || safetyData?.refrigerantId === 'R-717';

function freezeRequirement(requirement) {
  return Object.freeze({
    ...requirement,
    source: Object.freeze(requirement.source || {}),
    missingInputs: Object.freeze(requirement.missingInputs || []),
    measures: Object.freeze(requirement.measures || [])
  });
}

function required({ id, category, title, requirement, measure, source, priority = 'required', missingInputs = [], status = REQUIREMENT_STATUS.REQUIRED, details = {} }) {
  return freezeRequirement({ id, category, title, requirement, measure, source, priority, status, missingInputs, details });
}

function checkBoolean({ id, category, title, requirement, measure, source, value, priority = 'required', missingInputs = [id], noStatus = REQUIREMENT_STATUS.FAILED }) {
  if (!hasAnswer(value)) {
    return required({ id, category, title, requirement, measure, source, priority, status: REQUIREMENT_STATUS.NOT_ASSESSED, missingInputs });
  }
  return required({
    id,
    category,
    title,
    requirement,
    measure,
    source,
    priority,
    status: yes(value) ? REQUIREMENT_STATUS.PASSED : noStatus
  });
}

import { calculateDilutionOpeningArea, calculateAlternativeMechanicalVentilationFlow } from './ventilationMeasures.js';
import { assessC3Applicability } from './chargeLimitCalculation.js';
export { calculateDilutionOpeningArea, calculateAlternativeMechanicalVentilationFlow } from './ventilationMeasures.js';

export function calculateDetectorPreset({ safetyData } = {}) {
  const lfl = numberOrNull(safetyData?.lflKgM3);
  const atelOdl = numberOrNull(safetyData?.atelOdlKgM3);
  const candidates = [];
  if (lfl != null && lfl > 0) candidates.push(0.25 * lfl);
  if (atelOdl != null && atelOdl > 0) candidates.push(0.5 * atelOdl);
  if (!candidates.length) return null;
  return round(Math.min(...candidates), 5);
}

function evidenceReferenceRequirement({ id, title, value, source, measure }) {
  if (String(value ?? '').trim()) return null;
  return required({
    id, category: 'safetyMeasures', title,
    requirement: 'Der externe Nachweis muss eindeutig referenziert und für die Anlagenakte nachvollziehbar sein.',
    measure, source, status: REQUIREMENT_STATUS.NOT_ASSESSED,
    missingInputs: [id]
  });
}

function buildOutdoorEN3782Requirements(state, safetyData) {
  const source = Object.freeze({ sourcePart: 'EN 378-2:2016', sourceSection: '6.2.14' });
  const requirements = [];
  const applicability = state.outdoorEN3782_6_2_14EN60335Applicable;

  requirements.push(required({
    id: 'outdoor.en378-2-6-2-14.en60335',
    category: 'safetyMeasures',
    title: 'Anwendbarkeit der EN-60335-Normenreihe feststellen',
    requirement: 'Anlagen im Anwendungsbereich der EN-60335-Normenreihe, die mit diesen Normen übereinstimmen, gelten als Erfüllung der Anforderungen dieses Abschnitts.',
    measure: 'Anwendbarkeit der EN-60335-Normenreihe anhand des Anwendungsbereichs der Anlage feststellen.',
    source,
    status: hasAnswer(applicability) ? (yes(applicability) ? REQUIREMENT_STATUS.PASSED : REQUIREMENT_STATUS.NOT_APPLICABLE) : REQUIREMENT_STATUS.NOT_ASSESSED,
    missingInputs: hasAnswer(applicability) ? [] : ['outdoorEN3782_6_2_14EN60335Applicable']
  }));

  if (!hasAnswer(applicability)) return requirements;
  if (yes(applicability)) {
    requirements.push(required({
      id: 'outdoor.en378-2-6-2-14.en60335-compliance',
      category: 'safetyMeasures',
      title: 'Konformität mit den anwendbaren EN-60335-Anforderungen feststellen',
      requirement: 'Die Ausnahme greift nur, wenn die Anlage im Anwendungsbereich der EN-60335-Normenreihe liegt und mit den anwendbaren Normen übereinstimmt.',
      measure: 'Konformität der Anlage mit den anwendbaren EN-60335-Anforderungen nachweisen.',
      source,
      status: hasAnswer(state.outdoorEN3782_6_2_14EN60335Compliant) ? (yes(state.outdoorEN3782_6_2_14EN60335Compliant) ? REQUIREMENT_STATUS.PASSED : REQUIREMENT_STATUS.NOT_APPLICABLE) : REQUIREMENT_STATUS.NOT_ASSESSED,
      missingInputs: hasAnswer(state.outdoorEN3782_6_2_14EN60335Compliant) ? [] : ['outdoorEN3782_6_2_14EN60335Compliant']
    }));
    if (!hasAnswer(state.outdoorEN3782_6_2_14EN60335Compliant)) return requirements;
    if (yes(state.outdoorEN3782_6_2_14EN60335Compliant)) {
      const missingEvidence = evidenceReferenceRequirement({
        id: 'outdoorEN3782_6_2_14EN60335EvidenceReference',
        title: 'Nachweisreferenz zur EN-60335-Konformität fehlt',
        value: state.outdoorEN3782_6_2_14EN60335EvidenceReference,
        source,
        measure: 'Dokumentbezeichnung oder Dokumentnummer des EN-60335-Konformitätsnachweises erfassen.'
      });
      if (missingEvidence) requirements.push(missingEvidence);
      if (!String(state.outdoorEN3782_6_2_14EN60335EvidenceReference ?? '').trim()) return requirements;
      return requirements;
    }
  }

  const addEvidenceBackedCheck = ({ id, title, requirement, measure, value, referenceKey, referenceTitle }) => {
    requirements.push(checkBoolean({ id, category: 'safetyMeasures', title, requirement, measure, source, value }));
    if (yes(value)) {
      const missingReference = evidenceReferenceRequirement({
        id: referenceKey, title: referenceTitle, value: state[referenceKey], source,
        measure: 'Dokumentbezeichnung oder Dokumentnummer des externen Nachweises erfassen.'
      });
      if (missingReference) requirements.push(missingReference);
    }
  };

  addEvidenceBackedCheck({
    id: 'outdoor.en378-2-6-2-14.hazardous-area',
    title: 'Potenziell entflammbaren Bereich extern ermitteln',
    requirement: 'Der potenziell entflammbare Bereich ist anhand eines geeigneten externen Verfahrens zu ermitteln. Die App führt diese Berechnung nicht selbst durch.',
    measure: 'Potenziell entflammbaren Bereich extern ermitteln und die verwendete Beurteilung in der Anlagenakte referenzieren.',
    value: state.outdoorEN3782_6_2_14HazardousAreaConfirmed,
    referenceKey: 'outdoorEN3782_6_2_14HazardousAreaEvidenceReference',
    referenceTitle: 'Dokumentreferenz der Gefahrenbereichsermittlung fehlt'
  });
  if (!yes(state.outdoorEN3782_6_2_14HazardousAreaConfirmed) || !String(state.outdoorEN3782_6_2_14HazardousAreaEvidenceReference ?? '').trim()) return requirements;
  addEvidenceBackedCheck({
    id: 'outdoor.en378-2-6-2-14.components',
    title: 'Relevante Komponenten extern bewerten',
    requirement: 'Für relevante Komponenten und Geräte ist extern zu beurteilen, ob sie innerhalb des potenziell entflammbaren Bereichs liegen oder durch mindestens eine der normativen Schutzbedingungen abgesichert sind. Steckverbindungen sowie im Normalbetrieb zu erwartende Öffnungen von Gehäusen sind dabei zu berücksichtigen.',
    measure: 'Komponentenbewertung einschließlich relevanter Steckverbindungen und bestimmungsgemäß geöffneter Gehäuse extern durchführen und dokumentieren.',
    value: state.outdoorEN3782_6_2_14ComponentAssessmentConfirmed,
    referenceKey: 'outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference',
    referenceTitle: 'Dokumentreferenz der Komponentenbewertung fehlt'
  });
  if (!yes(state.outdoorEN3782_6_2_14ComponentAssessmentConfirmed) || !String(state.outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference ?? '').trim()) return requirements;
  addEvidenceBackedCheck({
    id: 'outdoor.en378-2-6-2-14.protection',
    title: 'Normative Schutzbedingungen nachweisen',
    requirement: 'Für jede relevante Komponente muss mindestens eine zutreffende Schutzbedingung erfüllt sein: Lage außerhalb des potenziell entflammbaren Bereichs; ausreichender Luftstrom mit höchstens 50 % LFL an der Zündquelle; geeigneter Geräteschutz für Zone 2, 1 oder 0; oder eine maximal mögliche Funken-/Lichtbogenenergie, die das Kältemittel nicht entzünden kann. Die Bewertung erfolgt extern; die App nimmt keine Einzelkomponentenprüfung vor.',
    measure: 'Für jede relevante Komponente mindestens eine der zutreffenden Schutzbedingungen – außerhalb des Bereichs, Luftstromschutz, geeigneter Geräteschutz oder Begrenzung der Zündenergie – extern nachweisen und den Nachweis referenzieren.',
    value: state.outdoorEN3782_6_2_14ProtectionConditionsConfirmed,
    referenceKey: 'outdoorEN3782_6_2_14ProtectionEvidenceReference',
    referenceTitle: 'Dokumentreferenz der Schutzbedingungen fehlt'
  });
  if (!yes(state.outdoorEN3782_6_2_14ProtectionConditionsConfirmed) || !String(state.outdoorEN3782_6_2_14ProtectionEvidenceReference ?? '').trim()) return requirements;

  requirements.push(checkBoolean({
    id: 'outdoor.en378-2-6-2-14.airflow-applicability',
    category: 'safetyMeasures',
    title: 'Luftstromabhängigen Schutz als verwendet oder nicht verwendet festlegen',
    requirement: 'Die zusätzlichen Anforderungen an dauerhafte Luftstromverfügbarkeit und Verriegelung gelten, wenn der Luftstrom als Schutzbedingung herangezogen wird.',
    measure: 'Festlegen und dokumentieren, ob der Nachweis auf einem luftstromabhängigen Schutz beruht.',
    source,
    value: state.outdoorEN3782_6_2_14AirflowProtectionUsed
  }));
  if (yes(state.outdoorEN3782_6_2_14AirflowProtectionUsed)) {
    requirements.push(checkBoolean({
      id: 'outdoor.en378-2-6-2-14.airflow-availability',
      category: 'safetyMeasures',
      title: 'Dauerhafte Verfügbarkeit des erforderlichen Luftstroms',
      requirement: 'Die Verfügbarkeit des erforderlichen Luftstroms muss über die Lebensdauer der Einrichtung sichergestellt sein.',
      measure: 'Dauerhafte Verfügbarkeit des erforderlichen Luftstroms über die Gerätelebensdauer sicherstellen und nachweisen.',
      source,
      value: state.outdoorEN3782_6_2_14AirflowAvailabilityConfirmed
    }));
    requirements.push(checkBoolean({
      id: 'outdoor.en378-2-6-2-14.airflow-interlock',
      category: 'safetyMeasures',
      title: 'Verriegelung bei unzureichendem Luftstrom',
      requirement: 'Regeleinrichtungen müssen das Einschalten verhindern, wenn der erforderliche Luftstrom nicht erreicht wird.',
      measure: 'Einschalten der betreffenden Komponenten bei unzureichendem Luftstrom durch eine geeignete Verriegelung verhindern.',
      source,
      value: state.outdoorEN3782_6_2_14AirflowInterlockConfirmed
    }));
  }

  const surfaceTemperatureClasses = ['A2', 'A2L', 'B2L', 'A3', 'B2', 'B3'];
  const refrigerantGroup = `${safetyData?.toxicityClass || ''}${safetyData?.flammabilityClass || ''}`;
  if (surfaceTemperatureClasses.includes(refrigerantGroup)) {
    requirements.push(checkBoolean({
      id: 'outdoor.en378-2-6-2-14.surface-temperature',
      category: 'safetyMeasures',
      title: 'Oberflächentemperaturen begrenzen',
      requirement: 'Für die Kältemittelgruppen A2, A2L, B2L, A3, B2 und B3 darf die Oberflächentemperatur die Selbstentzündungstemperatur des Kältemittels abzüglich 100 K nicht überschreiten.',
      measure: 'Zulässige Oberflächentemperatur anhand der Selbstentzündungstemperatur nachweisen und einhalten.',
      source,
      value: state.outdoorEN3782_6_2_14SurfaceTemperatureConfirmed
    }));
  }

  const exceedsEquipment = state.outdoorEN3782_6_2_14HazardousAreaExceedsEquipment;
  requirements.push(required({
    id: 'outdoor.en378-2-6-2-14.documentation-applicability',
    category: 'safetyMeasures',
    title: 'Ausdehnung des entflammbaren Bereichs gegenüber den Geräteabmessungen bewerten',
    requirement: 'Es ist festzustellen, ob der potenziell entflammbare Bereich über die Geräteabmessungen hinausgeht.',
    measure: 'Ausdehnung des extern ermittelten entflammbaren Bereichs mit den Geräteabmessungen vergleichen.',
    source,
    status: !hasAnswer(exceedsEquipment)
      ? REQUIREMENT_STATUS.NOT_ASSESSED
      : yes(exceedsEquipment) ? REQUIREMENT_STATUS.REQUIRED : REQUIREMENT_STATUS.PASSED,
    missingInputs: hasAnswer(exceedsEquipment) ? [] : ['outdoorEN3782_6_2_14HazardousAreaExceedsEquipment']
  }));
  if (yes(state.outdoorEN3782_6_2_14HazardousAreaExceedsEquipment)) {
    requirements.push(checkBoolean({
      id: 'outdoor.en378-2-6-2-14.documentation',
      category: 'guidance',
      title: 'Erweiterten entflammbaren Bereich in der Gerätedokumentation angeben',
      requirement: 'Wenn der entflammbare Bereich über die Geräteabmessungen hinausgeht, muss dies in der Gerätedokumentation angegeben werden.',
      measure: 'Ausdehnung des entflammbaren Bereichs in der Gerätedokumentation angeben.',
      source,
      value: state.outdoorEN3782_6_2_14EquipmentDocumentationUpdated
    }));
  }
  return requirements;
}

function buildArrangementRequirements(state, safetyData, chargeLimitAssessment) {
  const requirements = [];
  const flammable = isFlammable(safetyData?.flammabilityClass);
  if (state.installationLocation === 'outdoor') {
    requirements.push(checkBoolean({ id: 'outdoor.definition-confirmed', category: 'location', title: 'Definition „im Freien“ bestätigt', requirement: 'Die bauliche Situation muss die normative Definition einer Aufstellung im Freien erfüllen.', measure: 'Erfüllung der Definition „im Freien“ anhand der baulichen Situation planerisch prüfen und bestätigen.', source: SOURCE.outdoorArrangement, value: state.isOutdoorDefinitionConfirmed, missingInputs: ['isOutdoorDefinitionConfirmed'] }));
    if (yes(state.isOutdoorDefinitionConfirmed)) {
      requirements.push(checkBoolean({ id: 'outdoor.safe-arrangement', category: 'location', title: 'Sichere Anordnung der Außenaufstellung', requirement: 'Die Außenaufstellung muss so angeordnet sein, dass austretendes Kältemittel bei einer Leckage Personen und Sachwerte nicht gefährden kann.', measure: 'Aufstellort und mögliche Ausbreitungswege planerisch bewerten und eine sichere Anordnung nachweisen.', source: SOURCE.outdoorArrangement, value: state.outdoorSafeArrangement }));
      requirements.push(checkBoolean({ id: 'outdoor.prevent-refrigerant-entry', category: 'location', title: 'Eindringen in Gebäudeöffnungen verhindern', requirement: 'Austretendes Kältemittel darf nicht in Frischluftöffnungen, Türöffnungen, Bodenklappen oder ähnliche Gebäudeöffnungen eindringen können.', measure: 'Gebäudeöffnungen und Luftführung planerisch bewerten; Eindringen von Kältemittel sicher ausschließen.', source: SOURCE.outdoorArrangement, value: state.outdoorPreventBuildingEntry }));
      if (yes(state.hasOutdoorProtectiveCover)) {
        requirements.push(checkBoolean({ id: 'outdoor.cover-ventilation', category: 'location', title: 'Belüftung der Schutzabdeckung', requirement: 'Eine Schutzabdeckung für im Freien aufgestellte kältetechnische Komponenten muss eine natürliche oder mechanische Lüftung aufweisen.', measure: 'Ausreichende natürliche oder mechanische Belüftung der Schutzabdeckung sicherstellen.', source: SOURCE.outdoorArrangement, value: state.outdoorCoverVentilated }));
      } else if (!hasAnswer(state.hasOutdoorProtectiveCover)) {
        requirements.push(required({ id: 'hasOutdoorProtectiveCover', category: 'location', title: 'Vorhandensein einer Schutzabdeckung bewerten', requirement: 'Es ist festzustellen, ob eine Schutzabdeckung für die im Freien aufgestellten kältetechnischen Komponenten vorhanden ist.', measure: 'Vorhandensein einer Schutzabdeckung mit Ja oder Nein dokumentieren.', source: SOURCE.outdoorArrangement, status: REQUIREMENT_STATUS.NOT_ASSESSED, missingInputs: ['hasOutdoorProtectiveCover'] }));
      }
    }
    const baseRequirementsPassed = requirements.every(item => [REQUIREMENT_STATUS.PASSED, REQUIREMENT_STATUS.NOT_APPLICABLE].includes(item.status));
    if (baseRequirementsPassed) {
      requirements.push(checkBoolean({ id: 'outdoor.refrigerant-accumulation', category: 'location', title: 'Kältemittelansammlung möglich', requirement: 'Der Planer muss örtlich beurteilen, ob sich austretendes Kältemittel am Aufstellort ansammeln kann.', measure: 'Örtliche Situation planerisch beurteilen und Ja oder Nein dokumentieren. Diese Entscheidung wird nicht automatisch aus anderen Eingaben abgeleitet.', source: SOURCE.outdoorArrangement, value: state.outdoorRefrigerantAccumulationPossible, noStatus: REQUIREMENT_STATUS.PASSED }));
    }
    if (baseRequirementsPassed && yes(state.outdoorRefrigerantAccumulationPossible)) {
      requirements.push(...buildOutdoorVentilationRequirements(state));
    }
    if (baseRequirementsPassed && yes(state.outdoorRefrigerantAccumulationPossible) && flammable) {
      requirements.push(...buildOutdoorEN3782Requirements(state, safetyData));
    }
    return requirements;
  }
  if (state.installationLocation === 'occupied-space') {
    // Normativer Auslöser für Detektion/Alarmierung (EN 378-3, 9.1: Konzentration kann den
    // praktischen Grenzwert überschreiten; oder Gaswarnanlage vorhanden). Nur bei Auslöser
    // erscheint der Eintrag mit Status required; ohne Auslöser informativ (not-applicable,
    // EN 378-3 4.4 i. V. m. EN 378-1 Anhang C) - dann darf der Wortlaut "erforderlich" nicht erscheinen.
    const detectionAlarmTriggered =
      buildDetectorRequirements(state, safetyData, chargeLimitAssessment).length > 0 ||
      buildAlarmRequirements(state, safetyData, chargeLimitAssessment).length > 0;
    if (detectionAlarmTriggered) {
      requirements.push(required({
        id: 'occupied-space.sections-8-9',
        category: 'location',
        title: 'Personen-Aufenthaltsbereich nach Abschnitten 8 und 9 bewerten',
        requirement: 'Bei Aufstellung im Personen-Aufenthaltsbereich sind die Anforderungen an Alarmierung und Detektion zu berücksichtigen, sofern Warnung bei Leckage erforderlich ist.',
        measure: 'Detektion und Alarmierung nach EN 378-3 Abschnitt 8 und 9 in die Planung aufnehmen.',
        source: SOURCE.arrangement
      }));
    } else {
      requirements.push(required({
        id: 'occupied-space.sections-8-9',
        category: 'location',
        title: 'Detektion und Alarmierung im Personen-Aufenthaltsbereich',
        requirement: 'Für diese Konstellation (Füllmengengrenzen nach EN 378-1 Anhang C eingehalten und Konzentration unterhalb des praktischen Grenzwerts) ist nach EN 378-3 Abschnitt 4.4 in Verbindung mit EN 378-1 Anhang C keine Detektion und keine Alarmierung nach EN 378-3 Abschnitt 8 und 9 notwendig.',
        measure: 'Keine Maßnahme zu Detektion oder Alarmierung in die Planung aufnehmen.',
        source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '4.4 i. V. m. EN 378-1 Anhang C' }),
        status: REQUIREMENT_STATUS.NOT_APPLICABLE,
        priority: 'information'
      }));
    }
    // Ableitung Gaswarnsystem (EN 378-3, Abschnitte 8 und 9): Bei hasGasWarningSystem 'yes'
    // müssen die Detailfragen zu Detektor und Alarm beantwortet sein, bevor der Leitfaden
    // als belastbar gilt. Bei 'no' bleiben die normativen Detektorprüfungen nach Abschnitt 9
    // unverändert über den Konzentrationsträger (praktischer Grenzwert) ausgelöst.
    if (yes(state.hasGasWarningSystem)) {
      const missingGasWarningDetails = ['hasDetector', 'hasAlarm'].filter(field => !hasAnswer(state[field]));
      if (missingGasWarningDetails.length) {
        requirements.push(required({
          id: 'occupied-space.gas-warning-details',
          category: 'detection',
          title: 'Detailfragen zum Gaswarnsystem beantworten',
          requirement: 'Ist ein Gaswarnsystem vorhanden, müssen die Detailfragen zu Detektor und Alarmierung beantwortet sein, bevor der Leitfaden als belastbar gilt.',
          measure: 'Detailfragen zu Detektor und Alarmierung beantworten.',
          source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '8 / 9' }),
          status: REQUIREMENT_STATUS.NOT_ASSESSED,
          missingInputs: missingGasWarningDetails
        }));
      }
    }
  }
  return requirements;
}

// EN 378-3:2020-12, Abschnitt 4.5: Raum ohne Personenaufenthalt, der nicht als Maschinenraum
// ausgewiesen ist (installationLocation 'technical-room').
// M1 (4.5 Abs. 1): Umleitung auf den Pfad 4.4 bei nicht abgeschlossenem Raum.
// M2 (4.5 Abs. 2): Verdichter/Druckbehälter im abgeschlossenen Raum -> Behandlung wie
// Maschinenraum nach Abschnitt 5, unmittelbar ohne Risikoanalyse-Gate (4.3).
// M3/M4 (4.5 Abs. 3 i. V. m. 5.13, Anmerkung 1): Abzugshaube neben der Komponente mit
// Luftwechselrate > 0,05 m³/s je Ventilator (bzw. > 0,5 m³/s bei ungünstigen Bedingungen).
// M5 (4.5 Abs. 4 i. V. m. Abschnitt 9): Detektoren aktivieren die Lüftung bei kleinerem Wert
// aus 50 % ATEL/ODL und 25 % LFL (bei charakteristischem Geruch unterhalb ATEL/ODL, z. B.
// R-717, nur 25 % LFL). M7 (EN 378-1 Anhang C als Bindeglied zu 5.13): Konzentration vs.
// praktischer Grenzwert. M6: Detektor-/Alarmprüfungen nach Abschnitt 9 bzw. 8 laufen über die
// bestehenden Ketten (buildDetectorRequirements/buildAlarmRequirements) mit.
function buildTechnicalRoomRequirements(state, safetyData, chargeLimitAssessment) {
  const requirements = [];
  const SOURCE_45 = Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '4.5' });
  const separated = state.technicalRoomSeparatedFromOccupiedSpaces;

  if (!hasAnswer(separated)) {
    requirements.push(required({
      id: 'technical-room.separated-from-occupied-spaces',
      category: 'technicalRoom',
      title: 'Raumabschluss gegenüber Personen-Aufenthaltsbereichen klären',
      requirement: 'Es ist anzugeben, ob der Raum ohne Personenaufenthalt gegenüber jeglichem Personen-Aufenthaltsbereich abgeschlossen ist (EN 378-3, 4.5).',
      measure: 'Raumabschluss gegenüber Personen-Aufenthaltsbereichen mit Ja oder Nein angeben.',
      source: SOURCE_45,
      status: REQUIREMENT_STATUS.NOT_ASSESSED,
      missingInputs: ['technicalRoomSeparatedFromOccupiedSpaces']
    }));
    return requirements;
  }

  if (!yes(separated)) {
    // M1: nicht abgeschlossen -> Komponenten als im Personen-Aufenthaltsbereich befindlich
    // anzusehen; Bewertung nach Abschnitt 4.4 (die 4.4-Ketten laufen in derselben Bewertung mit).
    requirements.push(required({
      id: 'technical-room.treated-as-occupied-space',
      category: 'technicalRoom',
      title: 'Nicht abgeschlossener Raum - Behandlung wie Personen-Aufenthaltsbereich',
      requirement: 'Kann der Bereich nicht gegenüber jeglichem Personen-Aufenthaltsbereich abgeschlossen werden, sind die kältetechnischen Komponenten als im Personen-Aufenthaltsbereich befindlich anzusehen; es gelten die Anforderungen nach EN 378-3 Abschnitt 4.4.',
      measure: 'Bewertung nach EN 378-3 Abschnitt 4.4 durchführen: Füllmengengrenzen nach EN 378-1 Anhang C sowie die Abschnitte 6, 8 und 9 anwenden.',
      source: SOURCE_45
    }));
    return requirements;
  }

  // Raum abgeschlossen (4.5 Abs. 2/3)
  const compressor = state.technicalRoomContainsCompressorOrPressureVessel;
  if (!hasAnswer(compressor)) {
    requirements.push(required({
      id: 'technical-room.compressor-or-pressure-vessel',
      category: 'technicalRoom',
      title: 'Verdichter oder Druckbehälter im Raum klären',
      requirement: 'Es ist anzugeben, ob sich Verdichter oder Druckbehälter in dem abgeschlossenen Raum ohne Personenaufenthalt befinden (EN 378-3, 4.5 Abs. 2).',
      measure: 'Vorhandensein von Verdichtern oder Druckbehältern mit Ja oder Nein angeben.',
      source: SOURCE_45,
      status: REQUIREMENT_STATUS.NOT_ASSESSED,
      missingInputs: ['technicalRoomContainsCompressorOrPressureVessel']
    }));
    return requirements;
  }

  if (yes(compressor)) {
    // M2: Aufstellungsort wie Maschinenraum nach Abschnitt 5 behandeln - unmittelbar, ohne
    // Risikoanalyse-Gate; Abschnitt-5-Quellen werden zusätzlich als "4.5 i. V. m. ..." geführt.
    requirements.push(required({
      id: 'technical-room.machinery-room-treatment',
      category: 'technicalRoom',
      title: 'Verdichter/Druckbehälter im abgeschlossenen Raum - Maschinenraum-Behandlung nach Abschnitt 5',
      requirement: 'Befinden sich Verdichter oder Druckbehälter in einem Raum ohne Personenaufenthalt, der gegenüber jeglichem Personen-Aufenthaltsbereich abgeschlossen ist, muss der Aufstellungsort als Maschinenraum nach EN 378-3 Abschnitt 5 behandelt werden (4.5 Abs. 2, unmittelbar ohne Risikoanalyse nach 4.3).',
      measure: 'Anforderungen nach EN 378-3 Abschnitt 5 (5.1 bis 5.14) auf den Aufstellort anwenden.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '4.5 i. V. m. Abschnitt 5' })
    }));
    for (const item of machineryRoomSectionFiveRequirements(state, safetyData, chargeLimitAssessment)) {
      const section = String(item.source?.sourceSection || '');
      const remapped = item.source?.sourcePart === 'EN 378-3' && section.startsWith('5')
        ? Object.freeze({ sourcePart: 'EN 378-3', sourceSection: `4.5 i. V. m. ${section}` })
        : item.source;
      requirements.push(freezeRequirement({ ...item, source: remapped }));
    }
    return requirements;
  }

  // 4.5 Abs. 3: andere Komponenten mit lösbaren Verbindungen im abgeschlossenen Raum
  const detachable = state.technicalRoomComponentsHaveDetachableJoints;
  if (!hasAnswer(detachable)) {
    requirements.push(required({
      id: 'technical-room.detachable-joints',
      category: 'technicalRoom',
      title: 'Lösbare Verbindungen im Raum klären',
      requirement: 'Es ist anzugeben, ob sich Komponenten mit lösbaren Verbindungen in dem abgeschlossenen Raum ohne Personenaufenthalt befinden (EN 378-3, 4.5 Abs. 3).',
      measure: 'Vorhandensein lösbarer Verbindungen mit Ja oder Nein angeben.',
      source: SOURCE_45,
      status: REQUIREMENT_STATUS.NOT_ASSESSED,
      missingInputs: ['technicalRoomComponentsHaveDetachableJoints']
    }));
  }

  // M7: Konzentration (Füllmenge/Raumvolumen) vs. praktischer Grenzwert (EN 378-1 Anhang C)
  // als Bindeglied zu EN 378-3, 5.13 (ob mechanische Lüftung/Gasnachweis erforderlich sind).
  const chargeKg = numberOrNull(state.chargeKg);
  const roomVolume = numberOrNull(state.roomVolumeM3);
  const concentration = chargeKg != null && roomVolume != null && roomVolume > 0 ? chargeKg / roomVolume : null;
  const practicalLimit = numberOrNull(safetyData?.practicalLimitKgM3);
  if (!safetyData || practicalLimit == null) {
    requirements.push(required({
      id: 'technical-room.concentration-limit',
      category: 'technicalRoom',
      title: 'Konzentration gegenüber praktischem Grenzwert bewerten',
      requirement: 'Ob mechanische Lüftung und Gasnachweis nach EN 378-3, 5.13 erforderlich sind, richtet sich unter anderem nach der Konzentration gegenüber dem praktischen Grenzwert nach EN 378-1, Anhang C.',
      measure: 'Kältemitteldaten sowie Angaben zu Füllmenge und Raumvolumen vervollständigen.',
      source: Object.freeze({ sourcePart: 'EN 378-1', sourceSection: 'Anhang C i. V. m. EN 378-3, 5.13' }),
      status: REQUIREMENT_STATUS.NOT_ASSESSED,
      missingInputs: ['refrigerantId']
    }));
  } else {
    const exceeds = concentration != null && concentration > practicalLimit;
    requirements.push(required({
      id: 'technical-room.concentration-limit',
      category: 'technicalRoom',
      title: 'Konzentration gegenüber praktischem Grenzwert',
      requirement: 'Die Konzentration (Füllmenge/Raumvolumen) ist dem praktischen Grenzwert nach EN 378-1, Anhang C, gegenüberzustellen; sie bestimmt mit, ob mechanische Lüftung und Gasnachweis nach EN 378-3, 5.13 erforderlich sind.',
      measure: exceeds
        ? `Konzentration ${round(concentration, 5)} kg/m³ übersteigt den praktischen Grenzwert ${practicalLimit} kg/m³: mechanische Lüftung und Gasnachweis nach EN 378-3, 5.13 erforderlich.`
        : `Konzentration ${round(concentration, 5)} kg/m³ liegt unterhalb des praktischen Grenzwerts ${practicalLimit} kg/m³.`,
      source: Object.freeze({ sourcePart: 'EN 378-1', sourceSection: 'Anhang C i. V. m. EN 378-3, 5.13' }),
      status: exceeds ? REQUIREMENT_STATUS.REQUIRED : REQUIREMENT_STATUS.PASSED,
      details: Object.freeze({ concentrationKgM3: concentration != null ? round(concentration, 6) : null, practicalLimitKgM3: practicalLimit })
    }));
  }

  if (yes(detachable)) {
    // M3/M4 (4.5 Abs. 3 i. V. m. 5.13, Anmerkung 1): Abzugshaube neben der Komponente.
    // Strikte Ungleichung: PASSED nur bei Wert > Schwelle; Wert <= Schwelle ist FAILED.
    const adverseValue = String(state.technicalRoomAdverseConditions || '').trim();
    const adverse = Boolean(adverseValue) && adverseValue !== 'none';
    const threshold = adverse ? 0.5 : 0.05;
    const flow = numberOrNull(state.technicalRoomExhaustHoodFlowRateM3s);
    const flowStatus = flow == null ? REQUIREMENT_STATUS.NOT_ASSESSED : (flow > threshold ? REQUIREMENT_STATUS.PASSED : REQUIREMENT_STATUS.FAILED);
    requirements.push(required({
      id: 'technical-room.exhaust-hood-flow-rate',
      category: 'technicalRoom',
      title: adverse ? 'Abzugshaube bei ungünstigen Bedingungen - Luftwechselrate über 0,5 m³/s je Abzugshaube' : 'Abzugshaube neben der Komponente - Luftwechselrate über 0,05 m³/s je Ventilator',
      requirement: adverse
        ? 'Bei ungünstigen Bedingungen (z. B. starke Schwingungen oder korrosive Atmosphäre) muss die Luftwechselrate der Abzugshaube mehr als 0,5 m³/s je Abzugshaube betragen (EN 378-3, 4.5 Abs. 3 mit Anmerkung 1).'
        : 'Die mechanische Lüftung erfolgt durch eine neben der Komponente angeordnete Abzugshaube; die Luftwechselrate muss mehr als 0,05 m³/s je Ventilator betragen (EN 378-3, 4.5 Abs. 3 i. V. m. 5.13). Die Rate von 0,05 m³/s gilt als ausreichend für die Lüftung eines Volumens von 18 m³.',
      measure: flow == null
        ? `Luftwechselrate der Abzugshaube angeben (Schwelle: mehr als ${threshold} m³/s).`
        : `Luftwechselrate ${flow} m³/s ${flow > threshold ? 'übersteigt' : 'erreicht nicht'} die Schwelle von mehr als ${threshold} m³/s.`,
      source: SOURCE_45,
      status: flowStatus,
      missingInputs: flow == null ? ['technicalRoomExhaustHoodFlowRateM3s'] : [],
      details: Object.freeze({ thresholdM3s: threshold, adverseConditions: adverseValue || 'none', flowRateM3s: flow })
    }));

    // M5 (4.5 Abs. 4 i. V. m. Abschnitt 9): Kältemittel-Detektoren aktivieren die Lüftung.
    // Auslöseschwelle: kleinerer Wert aus 50 % ATEL/ODL und 25 % LFL; bei Kältemitteln mit
    // charakteristischem Geruch unterhalb ATEL/ODL (z. B. R-717) nur 25 % LFL.
    // Gilt nur für den 4.5-Pfad; die Detektorschwellen der Pfade 4.2/4.3 bleiben unberührt.
    const lfl = numberOrNull(safetyData?.lflKgM3);
    const atel = numberOrNull(safetyData?.atelOdlKgM3);
    const odorDetectable = isR717(safetyData);
    const dataMissing = [];
    if (lfl == null) dataMissing.push('lflKgM3');
    if (!odorDetectable && atel == null) dataMissing.push('atelOdlKgM3');
    const activationThreshold = odorDetectable
      ? (lfl != null ? round(0.25 * lfl, 6) : null)
      : (lfl != null && atel != null ? round(Math.min(0.5 * atel, 0.25 * lfl), 6) : null);
    const activationAnswer = state.technicalRoomVentilationActivatesDetector;
    const activationStatus = !hasAnswer(activationAnswer) || dataMissing.length
      ? REQUIREMENT_STATUS.NOT_ASSESSED
      : (yes(activationAnswer) ? REQUIREMENT_STATUS.PASSED : REQUIREMENT_STATUS.FAILED);
    requirements.push(required({
      id: 'technical-room.detector-activated-ventilation',
      category: 'technicalRoom',
      title: 'Detektorbetätigte Aktivierung der Lüftung',
      requirement: odorDetectable
        ? 'Ist eine mechanische Lüftung erforderlich, müssen Kältemittel-Detektoren die Lüftung aktivieren; bei Kältemitteln mit charakteristischem Geruch unterhalb des ATEL/ODL (z. B. R-717) gilt die Schwelle 25 % der LFL (EN 378-3, 4.5 Abs. 4 i. V. m. Abschnitt 9).'
        : 'Ist eine mechanische Lüftung erforderlich, müssen Kältemittel-Detektoren die Lüftung bei 50 % des ATEL/ODL oder 25 % der LFL aktivieren, je nachdem, welcher Wert geringer ist (EN 378-3, 4.5 Abs. 4 i. V. m. Abschnitt 9).',
      measure: activationThreshold != null
        ? `Detektorbetätigte Lüftungsaktivierung vorsehen; Auslöseschwelle: ${activationThreshold} kg/m³ (${odorDetectable ? '25 % LFL' : 'Minimum aus 50 % ATEL/ODL und 25 % LFL'}).`
        : 'Detektorbetätigte Lüftungsaktivierung vorsehen; Auslöseschwelle ist aus den Kältemitteldaten nicht bestimmbar.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '4.5 i. V. m. Abschnitt 9' }),
      status: activationStatus,
      missingInputs: [...(hasAnswer(activationAnswer) ? [] : ['technicalRoomVentilationActivatesDetector']), ...dataMissing],
      details: Object.freeze({ activationThresholdKgM3: activationThreshold, odorCharacteristicRefrigerant: odorDetectable })
    }));
  }

  return requirements;
}

// EN 378-3:2020-12, Abschnitt 4.6: belüftetes Gehäuse im Personen-Aufenthaltsbereich
// (Aufstellungsort-Klasse IV nach EN 378-1, 5.3 a). M1: Lüftungskanal nach
// Herstellerfestlegungen (i. V. m. EN 378-2, 6.2.15). M2: Raumvolumen mindestens das
// 10-Fache des Gehäusevolumens. M3: ausreichende Frischluftversorgung. M4: Belüftung des
// Gehäuses führt ins Freie. Die Füllmengengrenzen der Tabellen C.1/C.2, Spalte IV, werden
// in chargeLimitCalculation.js bewertet (M6/M7).
function buildVentilatedEnclosureRequirements(state, safetyData, chargeLimitAssessment) {
  const requirements = [];
  const SOURCE_46 = Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '4.6' });

  // M1 (4.6, Satz 1 i. V. m. EN 378-2, 6.2.15): Lüftungskanal nach Herstellerfestlegungen
  requirements.push(checkBoolean({
    id: 'ventilated-enclosure.duct-per-manufacturer',
    category: 'ventilatedEnclosure',
    title: 'Lüftungskanal nach Herstellerfestlegungen ausgeführt',
    requirement: 'Ein belüftetes Gehäuse, das eine Kälteanlage enthält, muss mit einem Lüftungskanal nach den Festlegungen des Herstellers versehen sein; der Lüftungskanal muss den Anforderungen des Herstellers entsprechen (EN 378-3, 4.6 i. V. m. EN 378-2, 6.2.15).',
    measure: 'Lüftungskanal nach Herstellerangaben ausführen und die Anforderungen des Herstellers an den Kanal nachweisen.',
    source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '4.6 i. V. m. EN 378-2, 6.2.15' }),
    value: state.ventilatedEnclosureDuctPerManufacturerInstructions,
    missingInputs: ['ventilatedEnclosureDuctPerManufacturerInstructions']
  }));

  // M2 (4.6, Satz 2): V_Raum >= 10 x V_Gehäuse (feste normative Konstante 10)
  const roomVolume = numberOrNull(state.roomVolumeM3);
  const enclosureVolume = numberOrNull(state.enclosureVolumeM3);
  const ratioComplete = roomVolume != null && roomVolume > 0 && enclosureVolume != null && enclosureVolume > 0;
  const ratioOk = ratioComplete && roomVolume >= 10 * enclosureVolume;
  requirements.push(required({
    id: 'ventilated-enclosure.room-volume-ratio',
    category: 'ventilatedEnclosure',
    title: 'Raumvolumen mindestens das 10-Fache des Gehäusevolumens',
    requirement: 'Der Raum, in dem das belüftete Gehäuse aufgestellt wird, muss ein Volumen von mindestens dem 10-Fachen des Gehäusevolumens aufweisen (EN 378-3, 4.6).',
    measure: ratioComplete
      ? `V_Raum ${roomVolume} m³ ${ratioOk ? '≥' : '<'} 10 × V_Gehäuse ${enclosureVolume} m³ = ${round(10 * enclosureVolume, 3)} m³.`
      : 'Gehäusevolumen und Raumvolumen angeben; Verhältnis V_Raum ≥ 10 × V_Gehäuse nachweisen.',
    source: SOURCE_46,
    status: ratioComplete ? (ratioOk ? REQUIREMENT_STATUS.PASSED : REQUIREMENT_STATUS.FAILED) : REQUIREMENT_STATUS.NOT_ASSESSED,
    missingInputs: ratioComplete ? [] : [
      ...(enclosureVolume == null || enclosureVolume <= 0 ? ['enclosureVolumeM3'] : []),
      ...(roomVolume == null || roomVolume <= 0 ? ['roomVolumeM3'] : [])
    ],
    details: Object.freeze({
      factor: 10,
      roomVolumeM3: roomVolume,
      enclosureVolumeM3: enclosureVolume,
      requiredRoomVolumeM3: enclosureVolume != null && enclosureVolume > 0 ? round(10 * enclosureVolume, 3) : null
    })
  }));

  // M3 (4.6, Satz 2): ausreichende Frischluftversorgung, verbrauchte Luft wird vollständig ersetzt
  requirements.push(checkBoolean({
    id: 'ventilated-enclosure.fresh-air-sufficient',
    category: 'ventilatedEnclosure',
    title: 'Ausreichende Frischluftversorgung des Raums',
    requirement: 'Der Raum, in dem das belüftete Gehäuse aufgestellt wird, muss mit ausreichend Frischluft versorgt werden, um verbrauchte Luft vollständig zu ersetzen (EN 378-3, 4.6).',
    measure: 'Frischluftversorgung des Aufstellraums so auslegen, dass verbrauchte Luft vollständig ersetzt wird.',
    source: SOURCE_46,
    value: state.ventilatedEnclosureFreshAirSufficient,
    missingInputs: ['ventilatedEnclosureFreshAirSufficient']
  }));

  // M4 (4.6, Satz 3): Belüftung des Gehäuses führt ins Freie
  requirements.push(checkBoolean({
    id: 'ventilated-enclosure.duct-to-outdoor',
    category: 'ventilatedEnclosure',
    title: 'Belüftung des Gehäuses führt ins Freie',
    requirement: 'Die Belüftung des Gehäuses muss ins Freie führen (EN 378-3, 4.6).',
    measure: 'Lüftungskanal ins Freie führen und gegen Witterungseinflüsse sichern.',
    source: SOURCE_46,
    value: state.ventilatedEnclosureDuctToOutdoor,
    missingInputs: ['ventilatedEnclosureDuctToOutdoor']
  }));

  // Hinweis: Gehäuseeigenschaften nach EN 378-2 (Druckfestigkeit, Konstruktion) prüft die App nicht
  requirements.push(required({
    id: 'ventilated-enclosure.en378-2-hint',
    category: 'ventilatedEnclosure',
    title: 'Gehäuseeigenschaften nach EN 378-2 über Herstellerangaben nachweisen',
    requirement: 'Sicherheitseigenschaften des Gehäuses selbst (z. B. Druckfestigkeit, Konstruktionsanforderungen nach EN 378-2, 6.2.15) werden von der App nicht geprüft; sie sind über die Herstellerangaben nachzuweisen.',
    measure: 'Herstellerunterlagen zum Gehäuse nach EN 378-2, 6.2.15 dokumentieren bzw. beilegen.',
    source: Object.freeze({ sourcePart: 'EN 378-2', sourceSection: '6.2.15' }),
    status: REQUIREMENT_STATUS.NOT_APPLICABLE,
    priority: 'information'
  }));

  return requirements;
}

function buildOutdoorVentilationRequirements(state) {
  const requirements = [];
  if (state.installationLocation !== 'outdoor' || !yes(state.outdoorRefrigerantAccumulationPossible)) return requirements;

  requirements.push(checkBoolean({
    id: 'outdoor.ventilation-general',
    category: 'ventilation',
    title: 'Lüftungsführung bei möglicher Kältemittelansammlung',
    requirement: 'Die für den Außenaufstellort relevante Lüftungsführung ist unter Berücksichtigung der örtlichen Situation nach EN 378-3, 5.13.1 zu bewerten. Maschinenraumspezifische Einzelanforderungen werden nicht pauschal auf die Außenaufstellung übertragen.',
    measure: 'Lüftungsführung und mögliche Kältemittelausbreitung am Außenaufstellort planerisch prüfen und dokumentieren.',
    source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.1' }),
    value: state.outdoorVentilationGeneralConfirmed
  }));
  requirements.push(checkBoolean({
    id: 'outdoor.ventilation-national-rules',
    category: 'ventilation',
    title: 'Nationale Lüftungsvorschriften einhalten',
    requirement: 'Die Lüftung muss den nationalen Vorschriften entsprechen. Der vierfache Luftwechsel wird nicht pauschal auf Außenaufstellungen übertragen.',
    measure: 'Einhaltung der für den konkreten Außenaufstellort geltenden nationalen Lüftungsvorschriften prüfen und dokumentieren.',
    source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.2' }),
    value: state.outdoorVentilationNationalRulesConfirmed
  }));

  if (state.ventilationType === 'mechanical') {
    requirements.push(checkBoolean({
      id: 'outdoor.mechanical-ventilation-openings',
      category: 'ventilation',
      title: 'Öffnungen für mechanische Lüftung',
      requirement: 'Öffnungen für mechanische Lüftung müssen geeignet angeordnet und ausreichend dimensioniert sein; Zu- und Abluftführung müssen die sichere Ableitung des Kältemittels gewährleisten.',
      measure: 'Anordnung, Größe und Luftführung der mechanischen Lüftungsöffnungen prüfen und den erforderlichen Luftstrom nachweisen.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.5' }),
      value: state.outdoorMechanicalVentilationOpeningsConfirmed
    }));
  }
  return requirements;
}

// Gemeinsame Prüflogik EN 378-3 Abschnitt 5 (5.1 bis 5.14). Wird vom Pfad 4.3 (mit
// Risikoanalyse-Gate, siehe buildMachineryRoomRequirements) und vom Fall M2 des Pfads 4.5
// (technical-room mit Verdichter/Druckbehälter, ohne Risikoanalyse-Gate) verwendet.
function machineryRoomSectionFiveRequirements(state, safetyData, chargeLimitAssessment) {
  const requirements = [];
  const flammable = isFlammable(safetyData?.flammabilityClass);
  const detectorRequired = buildDetectorRequirements(state, safetyData, chargeLimitAssessment).length > 0;
  const ventilationCharge = numberOrNull(state.machineryRoomLargestSystemChargeKg);
  const roomVolume = numberOrNull(state.roomVolumeM3);
  const ventilationFlowM3s = ventilationCharge != null && ventilationCharge > 0 ? 0.014 * (ventilationCharge ** (2 / 3)) : null;
  const ventilationFlowM3h = ventilationFlowM3s != null ? round(ventilationFlowM3s * 3600, 1) : null;
  const fifteenAirChangesM3h = roomVolume != null && roomVolume > 0 ? round(roomVolume * 15, 1) : null;
  const governingFlowM3h = ventilationFlowM3h != null && fifteenAirChangesM3h != null ? Math.min(ventilationFlowM3h, fifteenAirChangesM3h) : null;
  const isGoverningFormula = governingFlowM3h != null && ventilationFlowM3h != null && fifteenAirChangesM3h != null ? governingFlowM3h === ventilationFlowM3h : null;
  const missingVentilationInputs = [];
  if (ventilationFlowM3h == null && ventilationCharge == null) missingVentilationInputs.push('machineryRoomLargestSystemChargeKg');
  if (fifteenAirChangesM3h == null && roomVolume == null) missingVentilationInputs.push('roomVolumeM3');

  requirements.push(required({
    id: 'machinery-room.access-restricted',
    category: 'machineryRoom',
    title: 'Zugang auf befugte Personen beschränken',
    requirement: 'Maschinenräume dürfen nicht als Personen-Aufenthaltsbereiche genutzt werden und der Zugang muss auf befugte Personen beschränkt sein.',
    measure: 'Maschinenraum als getrennten Technikbereich mit Zugangsbeschränkung kennzeichnen und betreiben.',
    source: SOURCE.machineryRoom
  }));
  requirements.push(required({
    id: 'machinery-room.separated',
    category: 'machineryRoom',
    title: 'Raumtrennung des Maschinenraums',
    requirement: 'Der Maschinenraum muss durch Wände, Boden und Decke mit mindestens 1 Stunde Feuerbeständigkeit von anderen Bereichen getrennt sein.',
    measure: 'Raumtrennung des Maschinenraums mit 1 h Feuerbeständigkeit nach EN 1363-14 planen und nachweisen.',
    source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.12.3' })
  }));


  // 5.13.2: Ventilation requirements based on occupancy
  const machineryRoomOccupied = yes(state.machineryRoomOccupied);
  requirements.push(checkBoolean({
    id: 'hasMachineryRoomVentilation',
    category: 'ventilation',
    title: 'Maschinenraumlüftung vorhanden',
    requirement: machineryRoomOccupied
      ? 'Maschinenräume mit Personenaufenthalt müssen mindestens vierfachen Luftwechsel je Stunde aufweisen.'
      : 'Maschinenräume ohne Personenaufenthalt: Lüftungstechnische Bewertung nach nationalen Vorschriften genügt.',
    measure: machineryRoomOccupied
      ? 'Normale Maschinenraumlüftung mit mindestens vierfachem Luftwechsel je Stunde planen.'
      : 'Normale Maschinenraumlüftung und Luftführung nach nationalen Vorschriften planen.',
    source: SOURCE.machineryRoomVentilation,
    value: state.ventilationType === 'mechanical'
  }));

  // 5.13.2: Normale Maschinenraumlüftung - nationale Vorschriften; bei Personenaufenthalt mindestens viermaliger Luftaustausch je Stunde
  const normalVentilationSource = Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.2' });
  const fourAirChangesM3h = roomVolume != null && roomVolume > 0 ? round(roomVolume * 4, 1) : null;
  const normalVentilationBase = {
    id: 'machinery-room.normal-ventilation',
    category: 'ventilation',
    title: 'Normale Maschinenraumlüftung',
    requirement: 'Die Lüftung muss nationalen Vorschriften entsprechen, wobei bei einem Maschinenraum mit Personenaufenthalt mindestens ein viermaliger Luftaustausch je Stunde erfolgen muss.',
    source: normalVentilationSource
  };
  if (!hasAnswer(state.machineryRoomOccupied)) {
    requirements.push(required({
      ...normalVentilationBase,
      measure: 'Personenaufenthalt im Maschinenraum klären, um die Lüftungsanforderung bewerten zu können.',
      status: REQUIREMENT_STATUS.NOT_ASSESSED,
      missingInputs: ['machineryRoomOccupied']
    }));
  } else if (yes(state.machineryRoomOccupied)) {
    requirements.push(required({
      ...normalVentilationBase,
      measure: `Erforderliche Luftmenge für die mechanische Lüftung: 4-facher Luftwechsel, ${fourAirChangesM3h ?? 'nicht bestimmbar'} m³/h (EN 378-3, 5.13.2).`
    }));
  } else {
    requirements.push(required({
      ...normalVentilationBase,
      measure: 'Lüftung für übliche Betriebsbedingungen nach nationalen Vorschriften auslegen; der 4-fache Luftwechsel ist nur bei Personenaufenthalt erforderlich (EN 378-3, 5.13.2).'
    }));
  }
  
  // If ventilation cannot achieve required rate for occupied machinery room, alarm and shutdown required
  if (machineryRoomOccupied && state.machineryRoomRequiredAirChangeAchievable === 'no') {
    requirements.push(required({
      id: 'machinery-room.ventilation-rate-alarm',
      category: 'ventilation',
      title: 'Alarm bei unzureichendem Luftwechsel',
      requirement: 'Kann die erforderliche Luftwechselrate nicht erreicht werden, müssen ein akustischer und/oder visueller Alarm ausgelöst und, sofern zutreffend, die elektrische Stromversorgung abgeschaltet werden.',
      measure: 'Alarmierung und Stromabschaltung bei unzureichender Lüftung vorsehen.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.2' })
    }));
  }
  // 5.13.3: Emergency ventilation controls - always required for machinery rooms, independent of gas detection
  requirements.push(checkBoolean({
    id: 'machinery-room.emergency-ventilation-control-outside',
    category: 'emergencyControl',
    title: 'Notsteuerung der mechanischen Notlüftung außen vorhanden',
    requirement: 'Die mechanische Notlüftung muss mit einer Notsteuerung außerhalb des Maschinenraums ausgestattet sein.',
    measure: 'Unabhängige Notsteuerung der mechanischen Notlüftung außerhalb des Maschinenraums vorsehen.',
    source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.3' }),
    value: state.hasEmergencyVentilationControlOutside
  }));
  requirements.push(checkBoolean({
    id: 'machinery-room.emergency-ventilation-control-inside',
    category: 'emergencyControl',
    title: 'Notsteuerung der mechanischen Notlüftung innen vorhanden',
    requirement: 'Die mechanische Notlüftung muss mit einer zweiten, von der äußeren Notsteuerung unabhängigen Notsteuerung innerhalb des Maschinenraums ausgestattet sein.',
    measure: 'Zweite, unabhängige Notsteuerung der mechanischen Notlüftung innerhalb des Maschinenraums vorsehen.',
    source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.3' }),
    value: state.hasEmergencyVentilationControlInside
  }));
  
  // 5.13.4: Emergency ventilation flow dimensioning - always required for machinery rooms
  const governingFlowLabel = governingFlowM3h != null && isGoverningFormula !== null
    ? (isGoverningFormula ? 'Gleichung (1)' : '15 Luftwechsel/h')
    : null;
  requirements.push(required({
    id: 'machinery-room.emergency-ventilation-flow',
    category: 'ventilation',
    title: 'Mechanische Notlüftung dimensionieren',
    requirement: 'Der Luftstrom der mechanischen Notlüftung muss mindestens V = 0,014 × m^(2/3) betragen. 15 Luftwechsel/h sind als ausreichend angegeben. Maßgeblich ist der kleinere Wert.',
    measure: `Für die größte Kälteanlage: V_Formel = ${ventilationFlowM3h ?? 'nicht bestimmbar'} m³/h (Gleichung (1)), V_15 = ${fifteenAirChangesM3h ?? 'nicht bestimmbar'} m³/h (15 Luftwechsel/h). Maßgeblicher Wert: ${governingFlowM3h ?? 'nicht bestimmbar'} m³/h (${governingFlowLabel ?? 'nicht bestimmbar'}).`,
    source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.4' }),
    details: Object.freeze({
      ventilationFlowM3s: round(ventilationFlowM3s, 4),
      ventilationFlowM3h,
      fifteenAirChangesM3h,
      governingFlowM3h,
      isGoverningFormula,
      largestSystemChargeKg: ventilationCharge
    }),
    missingInputs: missingVentilationInputs
  }));
  
  // 5.13.3: Detector-activated emergency ventilation - only when gas detection is required
  if (detectorRequired) {
    requirements.push(checkBoolean({
      id: 'hasEmergencyVentilation',
      category: 'ventilation',
      title: 'Mechanische Notlüftung durch Detektoren aktiviert',
      requirement: 'Ist im Maschinenraum ein Gasnachweissystem erforderlich, muss die mechanische Notlüftung durch einen oder mehrere im Maschinenraum vorhandene Detektoren aktiviert werden. Die Detektoren müssen Abschnitt 9 entsprechen.',
      measure: 'Detektor(en) im Maschinenraum so in die Steuerung einbinden, dass sie die mechanische Notlüftung automatisch aktivieren.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.3' }),
      value: state.hasEmergencyVentilation
    }));
  }

  if (flammable) {
    requirements.push(required({
      id: 'machinery-room.hazardous-area-classification',
      category: 'machineryRoom',
      title: 'Gefahrenbereiche bei brennbaren/toxischen Kältemitteln bewerten',
      requirement: 'Maschinenräume für Kältemittel der Gruppen A2L, A2, B2L, B2, A3 und B3 sind hinsichtlich Brennbarkeit und Explosionsgefährdung zu beurteilen.',
      measure: 'Gefahrenbereichsklassifizierung und Auswahl geeigneter Betriebsmittel nach einschlägigen Anforderungen durchführen.',
      source: SOURCE.machineryRoom
    }));
    requirements.push(checkBoolean({
      id: 'hasExplosionProtectedElectricalEquipment',
      category: 'emergencyControl',
      title: 'Geeignete elektrische Betriebsmittel vorgesehen',
      requirement: 'Elektrische Betriebsmittel in relevanten Zonen müssen geeignet ausgewählt sein; Alarm, Gaswarnsysteme, Lüftungsventilatoren und Notbeleuchtung müssen für explosionsgefährdete Bereiche geeignet sein, wenn sie dort weiter betrieben werden.',
      measure: 'Elektrische Betriebsmittel für die klassifizierten Bereiche auswählen und dokumentieren.',
      source: SOURCE.electricalEquipment,
      value: state.hasExplosionProtectedElectricalEquipment
    }));
  }

  // 5.14: Additional requirements for flammable refrigerants (A2L, A2, A3, B2L, B2, B3)
  if (flammable) {
    // 5.14.2.2: Emergency fan suitability
    requirements.push(checkBoolean({
      id: 'machinery-room.emergency-fan-suitable',
      category: 'ventilation',
      title: 'Notentlüftungsventilator geeignet',
      requirement: 'Notentlüftungsventilator entweder mit Motor außerhalb des Luftstroms oder nach EN 378-2:2016, 6.2.14, für gefährdete Bereiche klassifiziert. Keine Druckbeaufschlagung der Entlüftungsleitungen; keine Funkenbildung bei Kontakt zwischen Ventilator und Leitungswerkstoff.',
      measure: 'Notentlüftungsventilator nach EN 378-2:2016, 6.2.14 auswählen. Austrittsöffnung nach nationalen Vorschriften unversperrt und gegen Unrat geschützt ausführen. Ablauf mit Auffangvorrichtung und Inspektionszugang am Boden steigender Außenleitungen vorsehen. Bei kommunizierenden Türen mit nicht erkennbarem Kältemittel: Aktivierung der Notlüftung bei Türöffnung über 60 s.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.14.2.2' }),
      value: state.machineryRoomEmergencyFanSuitable
    }));

    // 5.14.4: Maximum surface temperature
    const autoIgnitionTemp = numberOrNull(safetyData?.autoIgnitionTemperatureC);
    if (autoIgnitionTemp != null && autoIgnitionTemp > 0) {
      const eightyPercent = round(autoIgnitionTemp * 0.8, 1);
      const minus100K = round(autoIgnitionTemp - 100, 1);
      const maxSurfaceTemp = Math.max(eightyPercent, minus100K);
      requirements.push(required({
        id: 'machinery-room.max-surface-temperature',
        category: 'machineryRoom',
        title: 'Maximale Oberflächentemperatur einhalten',
        requirement: 'Die maximale Oberflächentemperatur von Betriebsmitteln im Maschinenraum muss höchstens 80 % der Selbstentzündungstemperatur oder 100 K darunter betragen, je nachdem, welcher Wert höher ist.',
        measure: `Maximale Oberflächentemperatur: ${maxSurfaceTemp} °C (maßgebend: ${eightyPercent >= minus100K ? '80 % der Selbstentzündungstemperatur' : '100 K unter der Selbstentzündungstemperatur'}). Selbstentzündungstemperatur: ${autoIgnitionTemp} °C.`,
        source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.14.4' }),
        details: Object.freeze({
          autoIgnitionTemperatureC: autoIgnitionTemp,
          eightyPercentOfAutoIgnition: eightyPercent,
          minus100K: minus100K,
          maxSurfaceTemperatureC: maxSurfaceTemp
        })
      }));
    } else {
      requirements.push(required({
        id: 'machinery-room.max-surface-temperature',
        category: 'machineryRoom',
        title: 'Maximale Oberflächentemperatur einhalten',
        requirement: 'Die maximale Oberflächentemperatur von Betriebsmitteln im Maschinenraum muss höchstens 80 % der Selbstentzündungstemperatur oder 100 K darunter betragen, je nachdem, welcher Wert höher ist.',
        measure: 'Maximale Oberflächentemperatur kann nicht bestimmt werden, da die Selbstentzündungstemperatur des Kältemittels nicht bekannt ist.',
        source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.14.4' }),
        status: REQUIREMENT_STATUS.NOT_ASSESSED,
        missingInputs: ['autoIgnitionTemperatureC']
      }));
    }
  }

  // 5.14.3: R-717 specific requirements
  if (isR717(safetyData)) {
    // 5.14.3.1: Containment system
    requirements.push(checkBoolean({
      id: 'machinery-room.r717-containment',
      category: 'machineryRoom',
      title: 'Auffangsystem für R-717',
      requirement: 'Auffangsystem gegen Eintrag in Oberflächenwasser; Boden so beschaffen, dass kein flüssiges R-717 auslaufen kann; Ablauf in der Regel verschlossen.',
      measure: 'Auffangsystem für R-717 planen und nachweisen. Boden abdichten und Ablauf verschließen.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.14.3.1' }),
      value: state.machineryRoomR717ContainmentProvided
    }));

    // 5.14.3.2: Eye wash (always required for R-717)
    requirements.push(checkBoolean({
      id: 'machinery-room.r717-eye-wash',
      category: 'machineryRoom',
      title: 'Augenspülung für R-717',
      requirement: 'Augenspülung leicht zugänglich bei allen R-717-Anlagen.',
      measure: 'Augenspülung in der Nähe der Anlage installieren und leicht zugänglich anordnen.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.14.3.2' }),
      value: state.machineryRoomR717EyeWashProvided
    }));

    // 5.14.3.2: Emergency shower (required for charge > 1000 kg)
    const chargeKg = numberOrNull(state.chargeKg);
    if (chargeKg != null && chargeKg > 1000) {
      requirements.push(checkBoolean({
        id: 'machinery-room.r717-emergency-shower',
        category: 'machineryRoom',
        title: 'Notdusche für R-717',
        requirement: 'Bei Füllmenge über 1000 kg: Notdusche mit mindestens 1 l/s, 25 bis 30 °C, außerhalb des Notausgangs.',
        measure: 'Notdusche mit mindestens 1 l/s Durchfluss, Wassertemperatur 25 bis 30 °C, außerhalb des Notausgangs installieren.',
        source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.14.3.2' }),
        value: state.machineryRoomR717EmergencyShowerProvided
      }));
    }

    // 5.14.3.3: Sprinkler system
    if (yes(state.machineryRoomR717SprinklerInstalled)) {
      requirements.push(checkBoolean({
        id: 'machinery-room.r717-sprinkler-conditions',
        category: 'machineryRoom',
        title: 'Sprinkleranlage-Bedingungen für R-717',
        requirement: 'Sprinkleranlagen: einzelauslösung ab 141 °C (EN 12845), keine manuelle Umgehung der Auslösung.',
        measure: 'Sprinkleranlage nach EN 12845 installieren. Einzelauslösung bei 141 °C oder höher sicherstellen. Keine manuelle Umgehung der Auslösung vorsehen.',
        source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.14.3.3' }),
        value: state.machineryRoomR717SprinklerConditionsConfirmed
      }));
    }

    // 5.14.3.4: Door to emergency exit (calculated condition)
    // Auslöser nach EN 378-3 5.14.3.4: Füllmenge > praktischer Grenzwert (kg/m³, EN 378-1 Anhang E,
    // Tabelle E.1) × Raumvolumen V. Nicht m2 = 26 m³ × LFL (EN 378-1 Tabelle C.2) verwenden -
    // m2 ist der brennbarkeitsbezogene Deckel und für diese Prüfung nicht maßgeblich.
    const roomVolume = numberOrNull(state.roomVolumeM3);
    const practicalLimitKgM3 = numberOrNull(safetyData?.practicalLimitKgM3);
    if (roomVolume != null && roomVolume > 0 && practicalLimitKgM3 != null && practicalLimitKgM3 > 0 && chargeKg != null && chargeKg > 0) {
      const doorThresholdKg = practicalLimitKgM3 * roomVolume;
      if (chargeKg > doorThresholdKg) {
        requirements.push(required({
          id: 'machinery-room.r717-door-to-emergency-exit',
          category: 'machineryRoom',
          title: 'Tür zu Notausgang ins Freie',
          requirement: 'Liegt die Gesamtfüllmenge über dem praktischen Grenzwert für den Rauminhalt (praktischer Grenzwert kg/m³ × Raumvolumen m³), ist eine Tür direkt oder über einen speziell vorgesehenen Vorraum mit selbstschließenden dichten Türen zu einem Notausgang ins Freie erforderlich (EN 378-3 5.14.3.4).',
          measure: `Tür direkt oder über Vorraum mit selbstschließenden dichten Türen zu einem Notausgang ins Freie vorsehen. Auslöser EN 378-3 5.14.3.4: Füllmenge ${chargeKg} kg > praktischer Grenzwert ${practicalLimitKgM3} kg/m³ × Raumvolumen ${roomVolume} m³ = ${round(doorThresholdKg, 4)} kg.`,
          source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.14.3.4' }),
          details: Object.freeze({
            practicalLimitKg: round(doorThresholdKg, 4),
            practicalLimitKgM3,
            chargeKg,
            roomVolumeM3: roomVolume
          })
        }));
      }
    }
  }

  return requirements;
}

function buildMachineryRoomRequirements(state, safetyData, chargeLimitAssessment) {
  // Only generate machinery room requirements from EN 378-3, Section 5 when
  // installationLocation is 'machinery-room' AND machineryRoomRiskAnalysisResult is 'yes'
  // Per spec: docs/contracts/en378/machinery-room-risk-analysis.md, section 3
  if (state.installationLocation !== 'machinery-room' || state.machineryRoomRiskAnalysisResult !== 'yes') return [];
  return machineryRoomSectionFiveRequirements(state, safetyData, chargeLimitAssessment);
}

function buildAlternativePrecautionRequirements(state, safetyData, chargeLimitAssessment) {
  const requirements = [];
  // C.3 nur, wenn normativ anwendbar (EN 378-1, C.3.1; EN 378-3, 6.1) - eine Quelle der
  // Wahrheit: assessC3Applicability (chargeLimitCalculation.js), nicht dupliziert.
  const c3Applicability = assessC3Applicability(state);
  const usesAlternative = (yes(state.usesAlternativeRiskManagement) && c3Applicability.usable)
    || (chargeLimitAssessment?.checks || []).some(check => check.id === 'charge-limit.alternative-risk-management' && check.status === 'failed');
  if (!usesAlternative) return requirements;

  const c3Check = (chargeLimitAssessment?.checks || []).find(check => check.id === 'charge-limit.alternative-risk-management');
  const qlmv = c3Check?.details?.qlmvKgM3 || null;
  const rcl = safetyData?.practicalLimitKgM3 || safetyData?.atelOdlKgM3 || null;
  const openingArea = calculateDilutionOpeningArea({ chargeKg: state.chargeKg, roomVolumeM3: state.roomVolumeM3, qlmvKgM3: qlmv });
  const ventilationFlow = calculateAlternativeMechanicalVentilationFlow({ rclKgM3: rcl });

  requirements.push(required({
    id: 'alternative-precautions.applicability',
    category: 'safetyMeasures',
    title: 'Alternative Vorkehrungen nach EN 378-1 C.3 anwenden',
    requirement: 'Alternative Vorkehrungen dürfen nur für die in EN 378-1 C.3 beschriebenen Anlagen angewendet werden.',
    measure: 'Anwendbarkeit der alternativen Vorkehrungen projektspezifisch bestätigen.',
    source: SOURCE.alternativePrecautions
  }));

  // C.3.1-Vorprüfungen als eigene Punkte mit Quellenangabe EN 378-1 C.3.1 (nicht stillschweigend).
  const SOURCE_C31 = Object.freeze({ sourcePart: 'EN 378-1', sourceSection: 'C.3.1' });
  const safetyClass = safetyData?.safetyClass || '';
  requirements.push(required({
    id: 'alternative-precautions.c3-1-refrigerant-class',
    category: 'safetyMeasures',
    title: 'C.3.1: Nur Kältemittel A1 oder A2L zulässig',
    requirement: 'Alternative Vorkehrungen nach C.3 dürfen nur für Kältemittel der Sicherheitsklassen A1 oder A2L angewendet werden.',
    measure: `Sicherheitsklasse ${safetyClass || 'unbekannt'} prüfen; bei anderen Klassen ist der C.3-Pfad nicht anwendbar.`,
    source: SOURCE_C31,
    status: c3Applicability.refrigerantClassOk === true ? REQUIREMENT_STATUS.PASSED : c3Applicability.refrigerantClassOk === false ? REQUIREMENT_STATUS.FAILED : REQUIREMENT_STATUS.REQUIRED,
    missingInputs: c3Applicability.refrigerantClassOk == null ? ['refrigerantId'] : []
  }));
  const c31Charge = c3Applicability.chargeKg;
  const c31CapKg = c3Applicability.chargeCapKg;
  requirements.push(required({
    id: 'alternative-precautions.c3-1-charge-cap',
    category: 'safetyMeasures',
    title: 'C.3.1: Füllmengen-Deckel einhalten',
    requirement: `Nach C.3.1 darf die Füllmenge höchstens 150 kg (A1) beziehungsweise 1,5 × m3 (A2L) betragen.`,
    measure: `Füllmenge ${c31Charge ?? 'unbekannt'} kg gegen die C.3.1-Grenze von ${c31CapKg != null ? round(c31CapKg, 2) : 'unbestimmt'} kg prüfen.`,
    source: SOURCE_C31,
    status: c3Applicability.chargeWithinCap === true ? REQUIREMENT_STATUS.PASSED : c3Applicability.chargeWithinCap === false ? REQUIREMENT_STATUS.FAILED : REQUIREMENT_STATUS.REQUIRED,
    missingInputs: c3Applicability.chargeWithinCap == null ? (c31Charge == null ? ['chargeKg'] : ['lflKgM3']) : [],
    details: Object.freeze({ maximumChargeKg: c31CapKg != null ? round(c31CapKg, 2) : null, chargeKg: c31Charge })
  }));
  const c31Class = String(state.installationClass || '');
  const c31Location = String(state.installationLocation || '');
  // C.3.1 verlangt Klasse II; im App-Modell steht dafür Klasse II bzw. ein Personen-Aufenthaltsbereich/belüftetes Gehäuse (Klasse I/IV).
  const c31ClassOk = c31Class === 'II' || ((c31Location === 'occupied-space' || c31Location === 'ventilated-enclosure') && (c31Class === 'I' || c31Class === 'IV'));
  requirements.push(required({
    id: 'alternative-precautions.c3-1-installation-class',
    category: 'safetyMeasures',
    title: 'C.3.1: Aufstellungsort-Klassifikation prüfen',
    requirement: 'Nach C.3.1 muss der Aufstellort der Klasse II entsprechen; im Personen-Aufenthaltsbereich ist das belüftete Gehäuse (Klasse IV) bzw. Klasse I mit entsprechender Aufstellung gemeint.',
    measure: `Klasse ${c31Class || 'unbekannt'} am Aufstellort ${c31Location || 'unbekannt'} gegen C.3.1 abgleichen.`,
    source: SOURCE_C31,
    status: !c31Class ? REQUIREMENT_STATUS.REQUIRED : c31ClassOk ? REQUIREMENT_STATUS.PASSED : REQUIREMENT_STATUS.FAILED,
    details: Object.freeze({ installationClass: c31Class, installationLocation: c31Location })
  }));
  const c31FieldChecks = [
    { field: 'c3FactoryBuiltConnections', id: 'alternative-precautions.c3-1-factory-connections', title: 'C.3.1: Fabrikmäßig zusammengebaute Verbindungsstücke', requirement: 'Alle Verzweigungen müssen aus fabrikmäßig zusammengebauten Verbindungsstücken bestehen.' },
    { field: 'c3NoValvesOrConsumerConnections', id: 'alternative-precautions.c3-1-valves-occupied-space', title: 'C.3.1: Keine Ventile oder Verbraucheranschlüsse im Personen-Aufenthaltsbereich', requirement: 'Im Personen-Aufenthaltsbereich dürfen außerhalb der fabrikmäßigen Einheiten keine Ventile oder Verbraucheranschlüsse vorhanden sein.' },
    { field: 'c3PipingProtected', id: 'alternative-precautions.c3-1-piping-protected', title: 'C.3.1: Rohrleitungen gegen Beschädigung geschützt', requirement: 'Rohrleitungen müssen gegen Beschädigung geschützt sein.' },
    { field: 'c3DoorsNotTightClosing', id: 'alternative-precautions.c3-1-doors-not-tight', title: 'C.3.1: Türen schließen nicht dicht', requirement: 'Türen dürfen nicht dicht schließen.' }
  ];
  for (const item of c31FieldChecks) {
    const value = state[item.field];
    requirements.push(required({
      id: item.id,
      category: 'safetyMeasures',
      title: item.title,
      requirement: item.requirement,
      measure: 'Vorbedingung nach EN 378-1 C.3.1 projektbezogen bestätigen.',
      source: SOURCE_C31,
      status: no(value) ? REQUIREMENT_STATUS.FAILED : REQUIREMENT_STATUS.REQUIRED,
      missingInputs: hasAnswer(value) ? [] : [item.field]
    }));
  }
  requirements.push(checkBoolean({
    id: 'hasVentilationOpenings',
    category: 'ventilation',
    title: 'Verdünnungsöffnungen vorhanden',
    requirement: 'Verdünnungsöffnungen müssen hoch und niedrig angeordnet sein; die untere Öffnung darf höchstens 0,2 m über Boden liegen, die obere mindestens oberhalb der Türöffnung.',
    measure: `Verdünnungsöffnungen mit erforderlicher Fläche ${openingArea ?? 'nicht bestimmbar'} m² und geeigneter Anordnung vorsehen oder alternative Maßnahme wählen.`,
    source: SOURCE.dilutionOpenings,
    value: state.hasVentilationOpenings
  }));
  requirements.push(checkBoolean({
    id: 'hasMechanicalVentilation',
    category: 'ventilation',
    title: 'Mechanische Lüftung als Sicherheitsmaßnahme vorhanden',
    requirement: 'Mechanische Lüftung muss dauerhaft in Betrieb sein oder durch Detektor eingeschaltet werden.',
    measure: `Mechanische Lüftung mit planerischem Luftstrom ${ventilationFlow ?? 'nicht bestimmbar'} m³/h nach vereinfachter Gleichung Q = 10 / RCL prüfen.`,
    source: SOURCE.mechanicalVentilation,
    value: state.hasMechanicalVentilation
  }));
  requirements.push(checkBoolean({
    id: 'hasSafetyShutoffValves',
    category: 'safetyMeasures',
    title: 'Sicherheitsabsperrventile vorhanden',
    requirement: 'Sicherheitsabsperrventile müssen den Kältemittelstrom im Leckagefall absperren und bei Stromausfall schließen.',
    measure: 'Absperrventile außerhalb des Personen-Aufenthaltsbereichs anordnen, zugänglich halten und Fail-Safe-Schließfunktion vorsehen.',
    source: SOURCE.shutoffValves,
    value: state.hasSafetyShutoffValves
  }));
  return requirements;
}

function buildDetectorRequirements(state, safetyData, chargeLimitAssessment) {
  const requirements = [];
  const concentration = numberOrNull(chargeLimitAssessment?.concentrationKgM3);
  const practicalLimit = numberOrNull(safetyData?.practicalLimitKgM3);
  const concentrationRisk = concentration != null && practicalLimit != null && concentration > practicalLimit;
  const detectorClass93_2 = isDetectorClass93_2(safetyData);
  const r717 = isR717(safetyData);
  const detectorPreset = calculateDetectorPreset({ safetyData });

  // EN 378-3:2016+A1:2020, 9.1 defines the detector trigger.
  // Sections 9.3.2 and 9.3.3 refine detector behavior; they do not replace 9.1.
  if (!concentrationRisk) return requirements;

  requirements.push(checkBoolean({
    id: 'hasDetector',
    category: 'detection',
    title: 'Kältemitteldetektor vorhanden',
    requirement: 'Wenn die Konzentration des Kältemittels den praktischen Grenzwert überschreiten kann, müssen Detektoren mindestens Alarm auslösen und im Maschinenraum die mechanische Notlüftung starten.',
    measure: 'Geeigneten Detektor für das Kältemittel vorsehen und an der Stelle anordnen, an der sich Kältemittel nach Leckage sammelt.',
    source: SOURCE.detectors,
    value: state.hasDetector
  }));
  requirements.push(required({
    id: 'detector.position',
    category: 'detection',
    title: 'Detektorposition nach Kältemitteldichte festlegen',
    requirement: 'Detektoren sind dort anzuordnen, wo sich das Kältemittel nach einer Leckage sammelt; höchste Stelle für leichtere und tiefste Stelle für schwerere Kältemittel.',
    measure: safetyData?.vaporDensity25C1013KpaKgM3 < 1.2 ? 'Detektorposition im oberen Raumbereich prüfen.' : 'Detektorposition im unteren Raumbereich prüfen.',
    source: SOURCE.detectors
  }));
  requirements.push(required({
    id: 'detector.preset',
    category: 'detection',
    title: 'Detektor-Voreinstellwert festlegen',
    requirement: 'Der Voreinstellwert darf höchstens 25 % der LFL oder 50 % der ATEL/ODL betragen, je nachdem welcher Wert geringer ist.',
    measure: `Detektor-Voreinstellwert höchstens ${detectorPreset ?? 'nicht bestimmbar'} kg/m³ ansetzen und Herstellertoleranz berücksichtigen.`,
    source: SOURCE.detectors,
    details: Object.freeze({ detectorPresetKgM3: detectorPreset }),
    missingInputs: detectorPreset == null ? ['lflKgM3', 'atelOdlKgM3'] : []
  }));
  // EN 378-3, Abschnitt 9: Ansprechzeit höchstens 30 s beim 1,6-fachen des Voreinstellwerts
  if (state.installationLocation === 'occupied-space') {
    requirements.push(required({
      id: 'detector.response-time',
      category: 'detection',
      title: 'Detektor-Ansprechzeit festlegen',
      requirement: 'Die Ansprechzeit des Detektors darf beim 1,6-fachen des Voreinstellwerts höchstens 30 s betragen.',
      measure: `Ansprechzeit ≤ 30 s bei ${detectorPreset != null ? round(detectorPreset * 1.6, 5) : 'nicht bestimmbar'} kg/m³ (1,6-facher Voreinstellwert) nachweisen.`,
      source: SOURCE.detectors,
      details: Object.freeze({ responseTimeMaxS: 30, testConcentrationKgM3: detectorPreset != null ? round(detectorPreset * 1.6, 5) : null })
    }));
  }
  if (detectorClass93_2 && !r717) {
    requirements.push(required({
      id: 'detector.flammable-classes',
      category: 'detection',
      title: 'Detektor für brennbare Kältemittel',
      requirement: 'Für Kältemittel der Klassen A2, A2L, B2L außer R-717, B2, A3 und B3 muss der Detektor bei maximal 25 % der LFL auslösen, Alarm auslösen, mechanische Lüftung starten und die Kälteanlage abschalten.',
      measure: 'Detektor mit Alarm-, Lüftungs- und Abschaltfunktion in die Steuerung einbinden.',
      source: SOURCE.detectors
    }));
  }
  if (r717) {
    requirements.push(required({
      id: 'detector.r717.thresholds',
      category: 'detection',
      title: 'R-717-Detektorschwellen berücksichtigen',
      requirement: 'Für R-717 gelten die Schwellen Voralarm 500×10⁻⁶ (≈ 350 mg/m³) und Hauptalarm 30 000×10⁻⁶ (≈ 21 200 mg/m³).',
      measure: 'R-717-Detektor auf Voralarm (500×10⁻⁶) und Hauptalarm (30 000×10⁻⁶) auslegen; bei Hauptalarm Anlage abschalten und Stromversorgung trennen, bei Voralarm Alarm und Lüftung auslösen.',
      source: SOURCE.r717,
      details: Object.freeze({ preAlarmPpm: 500, mainAlarmPpm: 30000, preAlarmMgM3: 350, mainAlarmMgM3: 21200 })
    }));
  }
  return requirements;
}

function buildAlarmRequirements(state, safetyData, chargeLimitAssessment) {
  const requirements = [];
  const detectorRequired = buildDetectorRequirements(state, safetyData, chargeLimitAssessment).length > 0;
  const alarmRequired = state.installationLocation === 'outdoor'
    ? detectorRequired || yes(state.hasAlarm)
    : detectorRequired || yes(state.hasGasWarningSystem) || yes(state.hasDetector) || yes(state.hasAlarm) || isR717(safetyData);
  if (!alarmRequired) return requirements;

  requirements.push(checkBoolean({
    id: 'hasAlarm',
    category: 'alarm',
    title: 'Alarmierung vorhanden',
    requirement: 'Wenn Warnung bei Leckage erforderlich ist, muss bei Leckage ein Alarm ausgelöst werden und befugte Personen müssen alarmiert werden.',
    measure: 'Hörbare und sichtbare Alarmierung vorsehen und befugte Personen in die Alarmkette aufnehmen.',
    source: SOURCE.alarms,
    value: state.hasAlarm
  }));
  requirements.push(checkBoolean({
    id: 'hasIndependentAlarmPower',
    category: 'alarm',
    title: 'Unabhängige Alarmstromversorgung vorhanden',
    requirement: 'Die Stromversorgung des Alarmsystems muss von mechanischer Lüftung und sonstiger Kälteanlage unabhängig sein.',
    measure: 'Unabhängige Alarmstromversorgung oder geeignete Zusatzstromversorgung vorsehen.',
    source: SOURCE.alarms,
    value: state.hasIndependentAlarmPower
  }));
  // EN 378-3 Abschnitte 8 und 9: Ein Alarm muss durch ein Gaswarnsystem (Detektor nach
  // Abschnitt 9) ausgelöst werden. Ohne Gaswarnanlage und ohne Detektor ist keine
  // Auslösehardware vorhanden - die Angabe "Alarmierung vorhanden" allein ist unplausibel.
  if (yes(state.hasAlarm) && !yes(state.hasGasWarningSystem) && !yes(state.hasDetector)) {
    requirements.push(required({
      id: 'alarm.trigger-hardware',
      category: 'alarm',
      title: 'Auslösehardware für die Alarmierung vorhanden',
      requirement: 'Ein Alarm nach EN 378-3 Abschnitt 8 muss durch ein Gaswarnsystem mit Detektor nach Abschnitt 9 ausgelöst werden. Ohne Gaswarnanlage und ohne Detektor ist keine Auslösehardware vorhanden.',
      measure: 'Gaswarnanlage oder Kältemitteldetektor vorsehen, der den Alarm auslöst, oder die Alarmierung auf „Nein“ setzen.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '8 und 9' }),
      status: REQUIREMENT_STATUS.FAILED,
      missingInputs: ['hasGasWarningSystem', 'hasDetector']
    }));
  }
  if (state.installationLocation === 'machinery-room' && state.machineryRoomRiskAnalysisResult === 'yes') {
    requirements.push(required({
      id: 'alarm.machinery-room-inside-outside',
      category: 'alarm',
      title: 'Alarm innen und außen am Maschinenraum',
      requirement: 'Bei Maschinenräumen muss das Alarmsystem innerhalb und außerhalb des Maschinenraums warnen.',
      measure: 'Innen- und Außenalarm am Maschinenraum vorsehen.',
      source: SOURCE.alarms
    }));
  }
  if (state.installationLocation === 'occupied-space') {
    requirements.push(required({
      id: 'alarm.occupied-space',
      category: 'alarm',
      title: 'Alarm im Personen-Aufenthaltsbereich',
      requirement: 'Bei Personen-Aufenthaltsbereichen muss das Alarmsystem mindestens innerhalb des Personen-Aufenthaltsbereichs hörbar und sichtbar warnen.',
      measure: 'Hör- und sichtbaren Alarm im betroffenen Personen-Aufenthaltsbereich vorsehen.',
      source: SOURCE.alarms
    }));
    requirements.push(required({
      id: 'alarm.limited-mobility',
      category: 'alarm',
      title: 'Alarm bei eingeschränkter Bewegungsfähigkeit nicht als einzige Maßnahme',
      requirement: 'Sind Personen mit eingeschränkter Bewegungsfähigkeit im Personen-Aufenthaltsbereich, darf der Alarm nicht die einzige Maßnahme sein.',
      measure: 'Bei eingeschränkter Bewegungsfähigkeit zusätzliche Maßnahmen (z. B. Detektion mit Abschaltung, zusätzliche Lüftung) planen.',
      source: SOURCE.alarms
    }));
  }
  if (state.accessCategory === 'a') {
    requirements.push(required({
      id: 'alarm.supervised-location',
      category: 'alarm',
      title: 'Alarm an überwachtem Ort bei Kategorie a',
      requirement: 'Bei Aufstellbereichen der Kategorie a muss zusätzlich an einem überwachten Ort alarmiert werden.',
      measure: 'Alarmweiterleitung an überwachten Ort, z. B. ständig besetzten Arbeitsplatz, vorsehen.',
      source: SOURCE.alarms
    }));
  }
  if (isR717(safetyData) && numberOrNull(state.chargeKg) > 3000) {
    requirements.push(required({
      id: 'alarm.r717.central-station',
      category: 'alarm',
      title: 'Zentrale Alarmstation und Einsatzbereitschaft bei R-717 über 3.000 kg',
      requirement: 'Bei R-717-Füllmengen über 3.000 kg muss eine zentrale Alarmstation ständig besetzt sein; speziell ausgebildetes Personal muss innerhalb von 60 Minuten vor Ort sein können.',
      measure: 'Ständig besetzte zentrale Alarmstation und Einsatzbereitschaft speziell ausgebildeten Personals mit einer Eintreffzeit von höchstens 60 Minuten organisatorisch sicherstellen.',
      source: SOURCE.r717
    }));
  }
  return requirements;
}

function buildWarningAndInspectionRequirements(state, safetyData) {
  const requirements = [];
  if (state.installationLocation === 'machinery-room' && state.machineryRoomRiskAnalysisResult === 'yes') {
    requirements.push(required({
      id: 'warning.machinery-room-entrance',
      category: 'guidance',
      title: 'Maschinenraum kennzeichnen',
      requirement: 'Maschinenräume müssen an den Eingängen deutlich gekennzeichnet sein; unbefugter Zutritt, Rauchen und offene Flammen sind zu untersagen.',
      measure: 'Warnhinweise an Eingängen anbringen und Zutrittsregeln dokumentieren.',
      source: SOURCE.warnings
    }));
  }
  if (state.installationLocation === 'outdoor' && ['3'].includes(safetyData?.flammabilityClass) && numberOrNull(state.chargeKg) > 10) {
    requirements.push(required({
      id: 'warning.outdoor-a3-b3-over-10kg',
      category: 'guidance',
      title: 'Außenanlage mit A3/B3 über 10 kg kennzeichnen',
      requirement: 'Kälteanlagen mit mehr als 10 kg Kältemittel der Klassen A3 und B3 im Freien müssen am Eingang zum beschränkten Bereich deutlich gekennzeichnet sein.',
      measure: 'Warnhinweise und Zugangsbeschränkung am beschränkten Bereich vorsehen.',
      source: SOURCE.warnings
    }));
  }
  requirements.push(required({
    id: 'handover.site-inspection',
    category: 'guidance',
    title: 'Sichtprüfung vor Übergabe durchführen',
    requirement: 'Vor Übergabe sind Flucht- und Zugangswege, Lüftungsöffnungen, mechanische Lüftung, Detektoren, Alarme, Notstromversorgung, Notbeleuchtung und persönliche Schutzausrüstung entsprechend Erfordernis zu prüfen.',
    measure: 'Sichtprüfung dokumentieren und offene Punkte vor Übergabe schließen.',
    source: SOURCE.warnings
  }));
  return requirements;
}

export function assessInstallationSafetyRequirements(currentState = {}, chargeLimitAssessment = {}) {
  const safetyData = chargeLimitAssessment.refrigerantSafetyData || null;
  if (!safetyData) {
    return Object.freeze({
      status: REQUIREMENT_STATUS.NOT_ASSESSED,
      requirements: Object.freeze([]),
      requiredMeasures: Object.freeze([]),
      missingInputs: Object.freeze(['refrigerantId'])
    });
  }

  const isOutdoor = currentState.installationLocation === 'outdoor';
  const arrangementRequirements = buildArrangementRequirements(currentState, safetyData, chargeLimitAssessment);
  const arrangementPrerequisites = isOutdoor
    ? arrangementRequirements.filter(item => ['outdoor.definition-confirmed', 'outdoor.safe-arrangement', 'outdoor.prevent-refrigerant-entry', 'outdoor.cover-ventilation', 'hasOutdoorProtectiveCover'].includes(item.id))
    : arrangementRequirements;
  const arrangementPassed = arrangementPrerequisites.every(item =>
    [REQUIREMENT_STATUS.PASSED, REQUIREMENT_STATUS.NOT_APPLICABLE].includes(item.status)
  );
  const accumulationPossible = yes(currentState.outdoorRefrigerantAccumulationPossible);
  const outdoorFollowUpsApplicable = isOutdoor && arrangementPassed && accumulationPossible;
  const requirements = [
    ...arrangementRequirements,
    ...(currentState.installationLocation === 'technical-room' ? buildTechnicalRoomRequirements(currentState, safetyData, chargeLimitAssessment) : []),
    ...(currentState.installationLocation === 'ventilated-enclosure' ? buildVentilatedEnclosureRequirements(currentState, safetyData, chargeLimitAssessment) : []),
    ...(isOutdoor ? [] : buildMachineryRoomRequirements(currentState, safetyData, chargeLimitAssessment)),
    ...(isOutdoor ? [] : buildAlternativePrecautionRequirements(currentState, safetyData, chargeLimitAssessment)),
    ...(outdoorFollowUpsApplicable ? buildDetectorRequirements(currentState, safetyData, chargeLimitAssessment) : (!isOutdoor ? buildDetectorRequirements(currentState, safetyData, chargeLimitAssessment) : [])),
    ...(outdoorFollowUpsApplicable ? buildAlarmRequirements(currentState, safetyData, chargeLimitAssessment) : (!isOutdoor ? buildAlarmRequirements(currentState, safetyData, chargeLimitAssessment) : [])),
    ...buildWarningAndInspectionRequirements(currentState, safetyData)
  ];

  const failed = requirements.filter(item => item.status === REQUIREMENT_STATUS.FAILED);
  const notAssessed = requirements.filter(item => item.status === REQUIREMENT_STATUS.NOT_ASSESSED);
  const requiredMeasures = requirements
    .filter(item => [REQUIREMENT_STATUS.REQUIRED, REQUIREMENT_STATUS.FAILED, REQUIREMENT_STATUS.NOT_ASSESSED].includes(item.status))
    .map(item => item.measure)
    .filter(Boolean);
  const missingInputs = [...new Set(notAssessed.flatMap(item => item.missingInputs || []))];

  return Object.freeze({
    status: failed.length ? REQUIREMENT_STATUS.FAILED : notAssessed.length ? REQUIREMENT_STATUS.NOT_ASSESSED : REQUIREMENT_STATUS.PASSED,
    requirements: Object.freeze(requirements),
    requiredMeasures: Object.freeze([...new Set(requiredMeasures)]),
    missingInputs: Object.freeze(missingInputs)
  });
}

export default assessInstallationSafetyRequirements;
