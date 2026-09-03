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

function checkBoolean({ id, category, title, requirement, measure, source, value, priority = 'required' }) {
  if (!hasAnswer(value)) {
    return required({ id, category, title, requirement, measure, source, priority, status: REQUIREMENT_STATUS.NOT_ASSESSED, missingInputs: [id] });
  }
  return required({
    id,
    category,
    title,
    requirement,
    measure,
    source,
    priority,
    status: yes(value) ? REQUIREMENT_STATUS.PASSED : REQUIREMENT_STATUS.FAILED
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

function buildArrangementRequirements(state, safetyData) {
  const requirements = [];
  const flammable = isFlammable(safetyData?.flammabilityClass);
  if (state.installationLocation === 'outdoor') {
    requirements.push(required({
      id: 'outdoor.prevent-refrigerant-entry',
      category: 'location',
      title: 'Austritt in Gebäudeöffnungen verhindern',
      requirement: 'Bei Aufstellung im Freien darf austretendes Kältemittel nicht in Gebäude, Frischluftöffnungen, Türöffnungen, Bodenklappen oder ähnliche Öffnungen eindringen und keine Personen gefährden.',
      measure: 'Aufstellort, Abstände, Öffnungen und Luftführung so planen, dass austretendes Kältemittel nicht in Gebäude oder gefährdete Bereiche gelangt.',
      source: SOURCE.arrangement
    }));
    requirements.push(checkBoolean({
      id: 'isOutdoorPublicAccessible',
      category: 'location',
      title: 'Öffentlich zugängliche Außenaufstellung bewertet',
      requirement: 'Öffentlich zugängliche kältemitteltechnische Komponenten im Freien müssen gegen Eingriff geschützt werden.',
      measure: 'Falls öffentlich zugänglich: Schutzabdeckung oder vergleichbaren Eingriffsschutz vorsehen.',
      source: SOURCE.arrangement,
      value: state.isOutdoorPublicAccessible,
      priority: 'conditional'
    }));
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
  if (flammable && state.installationLocation === 'outdoor') {
    requirements.push(required({
      id: 'outdoor.ignition-sources',
      category: 'location',
      title: 'Zündquellen bei brennbaren Kältemitteln vermeiden',
      requirement: 'Für Kältemittel der Klassen 2L, 2 und 3 sind Anforderungen bezüglich Zündquellen zu berücksichtigen.',
      measure: 'Zündquellen im relevanten Bereich vermeiden oder fachlich bewerten.',
      source: SOURCE.arrangement
    }));
  }
  return requirements;
}

function buildMachineryRoomRequirements(state, safetyData) {
  if (!yes(state.hasMachineryRoom) && state.installationLocation !== 'machinery-room') return [];
  const requirements = [];
  const flammable = isFlammable(safetyData?.flammabilityClass) || safetyData?.toxicityClass === 'B';
  const ventilation = calculateMachineryRoomEmergencyVentilationFlow(state.chargeKg);

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
  requirements.push(required({
    id: 'machinery-room.emergency-ventilation-flow',
    category: 'ventilation',
    title: 'Mechanische Notlüftung dimensionieren',
    requirement: 'Der Luftstrom der mechanischen Notlüftung muss mindestens V = 0,014 × m^(2/3) betragen; 15 Luftwechsel je Stunde sind ausreichend.',
    measure: `Mechanische Notlüftung mit mindestens ${ventilation.flowM3s ?? 'nicht bestimmbar'} m³/s bzw. ${ventilation.flowM3h ?? 'nicht bestimmbar'} m³/h für die größte Füllmenge im Maschinenraum auslegen.`,
    source: SOURCE.machineryRoomVentilation,
    details: ventilation,
    missingInputs: ventilation.flowM3s == null ? ['chargeKg'] : []
  }));
  requirements.push(checkBoolean({
    id: 'hasEmergencyVentilation',
    category: 'ventilation',
    title: 'Mechanische Notlüftung vorhanden',
    requirement: 'Wenn ein Gaswarnsystem erforderlich ist, muss die mechanische Notlüftung durch Detektor(en) aktiviert werden.',
    measure: 'Notlüftung mit Detektoraktivierung und zwei voneinander unabhängigen Notsteuerungen vorsehen.',
    source: SOURCE.machineryRoomVentilation,
    value: state.hasEmergencyVentilation
  }));
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
  const concentrationRisk = chargeLimitAssessment?.status === 'failed' || yes(state.hasGasWarningSystem);
  const flammable = isFlammable(safetyData?.flammabilityClass);
  const detectorPreset = calculateDetectorPreset({ safetyData });

  if (!concentrationRisk && !flammable && !isR717(safetyData)) return requirements;

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
  if (flammable) {
    requirements.push(required({
      id: 'detector.flammable-classes',
      category: 'detection',
      title: 'Detektor für brennbare Kältemittel',
      requirement: 'Für Kältemittel der Klassen A2, A2L, B2L außer R-717, B2, A3 und B3 muss der Detektor bei maximal 25 % der LFL auslösen, Alarm auslösen, mechanische Lüftung starten und die Kälteanlage abschalten.',
      measure: 'Detektor mit Alarm-, Lüftungs- und Abschaltfunktion in die Steuerung einbinden.',
      source: SOURCE.detectors
    }));
  }
  if (isR717(safetyData)) {
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
  const alarmRequired = chargeLimitAssessment?.status === 'failed' || yes(state.hasGasWarningSystem) || yes(state.hasDetector) || isR717(safetyData);
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

  const requirements = [
    ...buildArrangementRequirements(currentState, safetyData),
    ...buildMachineryRoomRequirements(currentState, safetyData),
    ...buildAlternativePrecautionRequirements(currentState, safetyData, chargeLimitAssessment),
    ...buildDetectorRequirements(currentState, safetyData, chargeLimitAssessment),
    ...buildAlarmRequirements(currentState, safetyData, chargeLimitAssessment),
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
