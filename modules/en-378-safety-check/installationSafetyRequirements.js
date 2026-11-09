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

export function calculateMachineryRoomEmergencyVentilationFlow(chargeKg) {
  const charge = numberOrNull(chargeKg);
  if (charge == null || charge <= 0) return Object.freeze({ flowM3s: null, flowM3h: null });
  const flowM3s = 0.014 * (charge ** (2 / 3));
  return Object.freeze({ flowM3s: round(flowM3s, 4), flowM3h: round(flowM3s * 3600, 1) });
}

export function calculateDilutionOpeningArea({ chargeKg, roomVolumeM3, qlmvKgM3 } = {}) {
  const charge = numberOrNull(chargeKg);
  const volume = numberOrNull(roomVolumeM3);
  const qlmv = numberOrNull(qlmvKgM3);
  if (charge == null || charge <= 0 || volume == null || volume <= 0 || qlmv == null || qlmv <= 0) return null;
  return round((0.0032 * charge) / (qlmv * volume), 5);
}

export function calculateAlternativeMechanicalVentilationFlow({ rclKgM3 } = {}) {
  const rcl = numberOrNull(rclKgM3);
  if (rcl == null || rcl <= 0) return null;
  return round(10 / rcl, 1);
}

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
      requirements.push(evidenceReferenceRequirement({
        id: 'outdoorEN3782_6_2_14EN60335EvidenceReference',
        title: 'Nachweisreferenz zur EN-60335-Konformität fehlt',
        value: state.outdoorEN3782_6_2_14EN60335EvidenceReference,
        source,
        measure: 'Dokumentbezeichnung oder Dokumentnummer des EN-60335-Konformitätsnachweises erfassen.'
      }));
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

  requirements.push(checkBoolean({
    id: 'outdoor.en378-2-6-2-14.documentation-applicability',
    category: 'safetyMeasures',
    title: 'Ausdehnung des entflammbaren Bereichs gegenüber den Geräteabmessungen bewerten',
    requirement: 'Es ist festzustellen, ob der potenziell entflammbare Bereich über die Geräteabmessungen hinausgeht.',
    measure: 'Ausdehnung des extern ermittelten entflammbaren Bereichs mit den Geräteabmessungen vergleichen.',
    source,
    value: state.outdoorEN3782_6_2_14HazardousAreaExceedsEquipment
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

function buildArrangementRequirements(state, safetyData) {
  const requirements = [];
  const flammable = isFlammable(safetyData?.flammabilityClass);
  if (state.installationLocation === 'outdoor') {
    requirements.push(checkBoolean({ id: 'outdoor.definition-confirmed', category: 'location', title: 'Definition „im Freien“ bestätigt', requirement: 'Die bauliche Situation muss die normative Definition einer Aufstellung im Freien erfüllen.', measure: 'Erfüllung der Definition „im Freien“ anhand der baulichen Situation planerisch prüfen und bestätigen.', source: SOURCE.outdoorArrangement, value: state.isOutdoorDefinitionConfirmed, missingInputs: ['isOutdoorDefinitionConfirmed'] }));
    requirements.push(checkBoolean({ id: 'outdoor.safe-arrangement', category: 'location', title: 'Sichere Anordnung der Außenaufstellung', requirement: 'Die Außenaufstellung muss so angeordnet sein, dass austretendes Kältemittel bei einer Leckage Personen und Sachwerte nicht gefährden kann.', measure: 'Aufstellort und mögliche Ausbreitungswege planerisch bewerten und eine sichere Anordnung nachweisen.', source: SOURCE.outdoorArrangement, value: state.outdoorSafeArrangement }));
    requirements.push(checkBoolean({ id: 'outdoor.prevent-refrigerant-entry', category: 'location', title: 'Eindringen in Gebäudeöffnungen verhindern', requirement: 'Austretendes Kältemittel darf nicht in Frischluftöffnungen, Türöffnungen, Bodenklappen oder ähnliche Gebäudeöffnungen eindringen können.', measure: 'Gebäudeöffnungen und Luftführung planerisch bewerten; Eindringen von Kältemittel sicher ausschließen.', source: SOURCE.outdoorArrangement, value: state.outdoorPreventBuildingEntry }));
    if (yes(state.hasOutdoorProtectiveCover)) {
      requirements.push(checkBoolean({ id: 'outdoor.cover-ventilation', category: 'location', title: 'Belüftung der Schutzabdeckung', requirement: 'Eine Schutzabdeckung für im Freien aufgestellte kältetechnische Komponenten muss eine natürliche oder mechanische Lüftung aufweisen.', measure: 'Ausreichende natürliche oder mechanische Belüftung der Schutzabdeckung sicherstellen.', source: SOURCE.outdoorArrangement, value: state.outdoorCoverVentilated }));
    } else if (!hasAnswer(state.hasOutdoorProtectiveCover)) {
      requirements.push(required({ id: 'hasOutdoorProtectiveCover', category: 'location', title: 'Vorhandensein einer Schutzabdeckung bewerten', requirement: 'Es ist festzustellen, ob eine Schutzabdeckung für die im Freien aufgestellten kältetechnischen Komponenten vorhanden ist.', measure: 'Vorhandensein einer Schutzabdeckung mit Ja oder Nein dokumentieren.', source: SOURCE.outdoorArrangement, status: REQUIREMENT_STATUS.NOT_ASSESSED, missingInputs: ['hasOutdoorProtectiveCover'] }));
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
    requirements.push(required({
      id: 'occupied-space.sections-8-9',
      category: 'location',
      title: 'Personen-Aufenthaltsbereich nach Abschnitten 8 und 9 bewerten',
      requirement: 'Bei Aufstellung im Personen-Aufenthaltsbereich sind die Anforderungen an Alarmierung und Detektion zu berücksichtigen, sofern Warnung bei Leckage erforderlich ist.',
      measure: 'Detektion und Alarmierung nach EN 378-3 Abschnitt 8 und 9 in die Planung aufnehmen.',
      source: SOURCE.arrangement
    }));
  }
  if (state.installationLocation === 'technical-room' && !yes(state.hasMachineryRoom)) {
    requirements.push(required({
      id: 'non-occupied-room.isolated',
      category: 'location',
      title: 'Raum ohne Personenaufenthalt gegenüber Aufenthaltsbereichen trennen',
      requirement: 'Räume ohne Personenaufenthalt müssen gegenüber Personen-Aufenthaltsbereichen abgeschlossen sein; bei Komponenten mit lösbaren Verbindungen sind Lüftungsanforderungen zu bewerten.',
      measure: 'Raumtrennung, Lüftung und Detektion für angrenzende Aufenthaltsbereiche prüfen.',
      source: SOURCE.arrangement,
      priority: 'conditional'
    }));
  }

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

function buildMachineryRoomRequirements(state, safetyData, chargeLimitAssessment) {
  if (!yes(state.hasMachineryRoom) && state.installationLocation !== 'machinery-room') return [];
  const requirements = [];
  const flammable = isFlammable(safetyData?.flammabilityClass) || safetyData?.toxicityClass === 'B';
  const detectorRequired = buildDetectorRequirements(state, safetyData, chargeLimitAssessment).length > 0;
  const ventilationCharge = numberOrNull(state.machineryRoomLargestSystemChargeKg);
  const ventilation = calculateMachineryRoomEmergencyVentilationFlow(ventilationCharge);
  const fifteenAirChangesM3h = numberOrNull(state.roomVolumeM3) > 0 ? round(numberOrNull(state.roomVolumeM3) * 15, 1) : null;

  requirements.push(required({
    id: 'machinery-room.access-restricted',
    category: 'machineryRoom',
    title: 'Zugang auf befugte Personen beschränken',
    requirement: 'Maschinenräume dürfen nicht als Personen-Aufenthaltsbereiche genutzt werden und der Zugang muss auf befugte Personen beschränkt sein.',
    measure: 'Maschinenraum als getrennten Technikbereich mit Zugangsbeschränkung kennzeichnen und betreiben.',
    source: SOURCE.machineryRoom
  }));
  requirements.push(required({
    id: 'machinery-room.no-refrigerant-migration',
    category: 'machineryRoom',
    title: 'Kältemittelaustritt in angrenzende Bereiche verhindern',
    requirement: 'Kältemittel darf nicht in benachbarte Räume, Treppenräume, Höfe, Gänge oder Entwässerungssysteme gelangen; Abluft darf nicht in Personen-Aufenthaltsbereiche geführt werden.',
    measure: 'Abluftführung und Raumabdichtung so planen, dass kein Kältemittel in gefährdete Bereiche gelangt.',
    source: SOURCE.machineryRoom
  }));
  requirements.push(checkBoolean({
    id: 'hasEmergencyStopOutside',
    category: 'emergencyControl',
    title: 'Not-Aus außen vorhanden',
    requirement: 'Außerhalb des Maschinenraums und in Türnähe muss ein Fernschalter zum Abschalten der Anlage vorhanden sein.',
    measure: 'Externen Not-Aus-Schalter in Türnähe vorsehen.',
    source: SOURCE.machineryRoom,
    value: state.hasEmergencyStopOutside
  }));
  requirements.push(checkBoolean({
    id: 'hasEmergencyStopInside',
    category: 'emergencyControl',
    title: 'Not-Aus innen vorhanden',
    requirement: 'Ein vergleichbarer Schalter muss innen an geeigneter Stelle vorhanden sein.',
    measure: 'Internen Not-Aus-Schalter an geeigneter Stelle vorsehen.',
    source: SOURCE.machineryRoom,
    value: state.hasEmergencyStopInside
  }));
  requirements.push(checkBoolean({
    id: 'hasMachineryRoomVentilation',
    category: 'ventilation',
    title: 'Maschinenraumlüftung vorhanden',
    requirement: 'Maschinenräume müssen ausreichend belüftet werden; bei Personenaufenthalt ist mindestens vierfacher Luftwechsel je Stunde erforderlich.',
    measure: 'Normale Maschinenraumlüftung und Luftführung planen.',
    source: SOURCE.machineryRoomVentilation,
    value: state.hasMechanicalVentilation
  }));
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
    requirements.push(checkBoolean({
      id: 'machinery-room.emergency-ventilation-control-outside',
      category: 'emergencyControl',
      title: 'Notsteuerung der mechanischen Notlüftung außen vorhanden',
      requirement: 'Die mechanische Notlüftung muss mit einer Notsteuerung außerhalb des Maschinenraums ausgerüstet sein.',
      measure: 'Unabhängige Notsteuerung der mechanischen Notlüftung außerhalb des Maschinenraums vorsehen.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.3' }),
      value: state.hasEmergencyVentilationControlOutside
    }));
    requirements.push(checkBoolean({
      id: 'machinery-room.emergency-ventilation-control-inside',
      category: 'emergencyControl',
      title: 'Notsteuerung der mechanischen Notlüftung innen vorhanden',
      requirement: 'Die mechanische Notlüftung muss mit einer zweiten, von der äußeren Notsteuerung unabhängigen Notsteuerung innerhalb des Maschinenraums ausgerüstet sein.',
      measure: 'Zweite, unabhängige Notsteuerung der mechanischen Notlüftung innerhalb des Maschinenraums vorsehen.',
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.3' }),
      value: state.hasEmergencyVentilationControlInside
    }));
    requirements.push(required({
      id: 'machinery-room.emergency-ventilation-flow',
      category: 'ventilation',
      title: 'Mechanische Notlüftung dimensionieren',
      requirement: 'Der Luftstrom der mechanischen Notlüftung muss mindestens V = 0,014 × m^(2/3) betragen. Ein Luftwechsel von 15 h⁻¹ ist als ausreichende Auslegung angegeben.',
      measure: `Für die größte Kälteanlage mit einem Teil im Maschinenraum mindestens ${ventilation.flowM3s ?? 'nicht bestimmbar'} m³/s bzw. ${ventilation.flowM3h ?? 'nicht bestimmbar'} m³/h nach Gleichung (1) nachweisen. 15 Luftwechsel je Stunde entsprechen bei dem eingegebenen Raumvolumen ${fifteenAirChangesM3h ?? 'nicht bestimmbar'} m³/h.`,
      source: Object.freeze({ sourcePart: 'EN 378-3', sourceSection: '5.13.4' }),
      details: Object.freeze({ ...ventilation, largestSystemChargeKg: ventilationCharge, fifteenAirChangesPerHourM3h: fifteenAirChangesM3h }),
      missingInputs: ventilation.flowM3s == null ? ['machineryRoomLargestSystemChargeKg'] : []
    }));
  }
  requirements.push(checkBoolean({
    id: 'hasEmergencyLighting',
    category: 'machineryRoom',
    title: 'Notbeleuchtung vorhanden',
    requirement: 'Für Maschinenräume ist eine fest angebrachte oder tragbare Notbeleuchtung vorzusehen.',
    measure: 'Notbeleuchtung für sicheren Betrieb und Notfallzugang vorsehen.',
    source: SOURCE.machineryRoom,
    value: state.hasEmergencyLighting
  }));
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
  return requirements;
}

function buildAlternativePrecautionRequirements(state, safetyData, chargeLimitAssessment) {
  const requirements = [];
  const usesAlternative = yes(state.usesAlternativeRiskManagement) || (chargeLimitAssessment?.checks || []).some(check => check.id === 'charge-limit.alternative-risk-management' && check.status === 'failed');
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
      requirement: 'Für R-717 sind Voralarm bei 350 mg/m³ und Hauptalarm bei 21 200 mg/m³ zu berücksichtigen.',
      measure: 'R-717-Detektor auf Voralarm und Hauptalarm auslegen; bei Hauptalarm Anlage abschalten, Maschinenraum-Stromversorgung trennen und Lüftungsstrategie beachten.',
      source: SOURCE.r717,
      details: Object.freeze({ preAlarmMgM3: 350, mainAlarmMgM3: 21200 })
    }));
  }
  return requirements;
}

function buildAlarmRequirements(state, safetyData, chargeLimitAssessment) {
  const requirements = [];
  const detectorRequired = buildDetectorRequirements(state, safetyData, chargeLimitAssessment).length > 0;
  const alarmRequired = state.installationLocation === 'outdoor'
    ? detectorRequired || yes(state.hasAlarm)
    : detectorRequired || yes(state.hasGasWarningSystem) || yes(state.hasDetector) || isR717(safetyData);
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
  if (yes(state.hasMachineryRoom) || state.installationLocation === 'machinery-room') {
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
      requirement: 'Bei Personen-Aufenthaltsbereichen muss das Alarmsystem mindestens innerhalb des Personen-Aufenthaltsbereichs warnen.',
      measure: 'Alarm im betroffenen Personen-Aufenthaltsbereich vorsehen.',
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
  if (yes(state.hasMachineryRoom) || state.installationLocation === 'machinery-room') {
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
  const arrangementRequirements = buildArrangementRequirements(currentState, safetyData);
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
