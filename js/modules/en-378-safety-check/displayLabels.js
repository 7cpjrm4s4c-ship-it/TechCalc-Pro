const FIELD_LABELS = Object.freeze({
  refrigerantId: 'Kältemittel',
  chargeKg: 'Füllmenge',
  roomVolumeM3: 'Raumvolumen',
  installationLocation: 'Aufstellort',
  installationClass: 'Aufstellungsort-Klassifikation',
  accessArea: 'Zugangsbereich',
  accessCategory: 'Kategorie des Zugangsbereichs',
  usageType: 'Nutzung',
  applicationType: 'Anwendungsart',
  locationLevel: 'Geschoss oder Lage',
  ventilationType: 'Lüftung',
  hasEmergencyStopInside: 'Not-Aus innen',
  hasEmergencyStopOutside: 'Not-Aus außen',
  hasMechanicalVentilation: 'mechanische Lüftung',
  hasEmergencyVentilation: 'mechanische Notlüftung',
  hasDetector: 'Kältemitteldetektor',
  hasAlarm: 'Alarmierung',
  hasIndependentAlarmPower: 'unabhängige Alarmstromversorgung',
  hasSafetyShutoffValves: 'Sicherheitsabsperrventile',
  hasVentilationOpenings: 'Verdünnungsöffnungen',
  hasExplosionProtectedElectricalEquipment: 'geeignete elektrische Betriebsmittel',
  hasEmergencyLighting: 'Notbeleuchtung',
  isOutdoorPublicAccessible: 'öffentlich zugängliche Außenaufstellung',
  floorAreaM2: 'Raumfläche',
  mountingType: 'Montageart',
  isFactorySealed: 'werkseitig dauerhaft geschlossen',
  hasGasWarningSystem: 'Gaswarnsystem',
  hasMachineryRoom: 'Maschinenraum',
  hasEmergencyExits: 'Notausgänge',
  occupantDensityBelowOnePer10m2: 'Personendichte kleiner als eine Person je 10 Quadratmeter',
  usesAlternativeRiskManagement: 'alternative Vorkehrungen nach Anhang C.3',
  isPermanentlySealedSorptionSystem: 'dauerhaft geschlossene Sorptionsanlage'
});

const STATUS_LABELS = Object.freeze({
  acceptable: 'Anforderungen nach aktuellem Prüfstand erfüllt',
  'measures-required': 'Maßnahmen oder Anpassungen erforderlich',
  'ready-for-assessment': 'Bewertung teilweise offen',
  incomplete: 'Eingaben unvollständig',
  'import-rejected': 'importierter Anlagenstand abgelehnt',
  passed: 'erfüllt',
  failed: 'nicht erfüllt',
  required: 'erforderlich',
  'not-assessed': 'offen',
  'not-applicable': 'nicht anwendbar',
  imported: 'importiert',
  rejected: 'abgelehnt'
});

const CHECK_LABELS = Object.freeze({
  'charge-limit.refrigerant-data': 'Kältemitteldaten nach EN 378 prüfen',
  'charge-limit.input': 'Füllmenge und Raumvolumen prüfen',
  'charge-limit.toxicity': 'toxizitätsbezogene Füllmengengrenze',
  'charge-limit.flammability': 'brennbarkeitsbezogene Füllmengengrenze',
  'charge-limit.alternative-risk-management': 'alternative Vorkehrungen',
  'outdoor.prevent-refrigerant-entry': 'Austritt in Gebäudeöffnungen verhindern',
  'outdoor.ignition-sources': 'Zündquellen bei brennbaren Kältemitteln vermeiden',
  'occupied-space.sections-8-9': 'Personen-Aufenthaltsbereich bewerten',
  'non-occupied-room.isolated': 'Raum ohne Personenaufenthalt trennen',
  'machinery-room.access-restricted': 'Zugang auf befugte Personen beschränken',
  'machinery-room.no-refrigerant-migration': 'Kältemittelaustritt in angrenzende Bereiche verhindern',
  'machinery-room.emergency-ventilation-flow': 'mechanische Notlüftung dimensionieren',
  'machinery-room.hazardous-area-classification': 'Gefahrenbereiche bewerten',
  'detector.position': 'Detektorposition festlegen',
  'detector.preset': 'Detektor-Voreinstellwert festlegen',
  'detector.flammable-classes': 'Detektor für brennbare Kältemittel',
  'detector.r717.thresholds': 'R-717-Detektorschwellen berücksichtigen',
  'alarm.machinery-room-inside-outside': 'Alarm innen und außen am Maschinenraum',
  'alarm.occupied-space': 'Alarm im Personen-Aufenthaltsbereich',
  'alarm.supervised-location': 'Alarm an überwachtem Ort',
  'warning.machinery-room-entrance': 'Maschinenraum kennzeichnen',
  'warning.outdoor-a3-b3-over-10kg': 'Außenanlage mit A3/B3 über 10 Kilogramm kennzeichnen',
  'handover.site-inspection': 'Sichtprüfung vor Übergabe durchführen'
});

const OPTION_LABELS = Object.freeze({
  '': 'nicht angegeben',
  yes: 'ja',
  no: 'nein',
  'occupied-space': 'Personen-Aufenthaltsbereich',
  'technical-room': 'technischer Raum',
  'machinery-room': 'Maschinenraum',
  outdoor: 'Außenaufstellung',
  I: 'Klasse I – belüftetes Gehäuse',
  II: 'Klasse II – Maschinenraum oder im Freien',
  III: 'Klasse III – Verdichter in Maschinenraum oder im Freien',
  IV: 'Klasse IV – mechanische Geräte im Personen-Aufenthaltsbereich',
  'general-access': 'allgemeiner Zugangsbereich',
  'supervised-access': 'überwachter Zugangsbereich',
  'authorized-access': 'Zugang nur für befugte Personen',
  a: 'Kategorie a – allgemeiner Zugangsbereich',
  b: 'Kategorie b – überwachter Zugangsbereich',
  c: 'Kategorie c – Zugang nur für befugte Personen',
  residential: 'Wohnen',
  commercial: 'Gewerbe',
  industrial: 'Industrie',
  public: 'öffentlich zugänglicher Bereich',
  'human-comfort': 'menschlicher Komfort',
  other: 'andere Lage oder Anwendung',
  'upper-no-emergency-exit-or-basement': 'oberes Geschoss ohne Notausgang oder Kellergeschoss',
  underground: 'unterirdisch',
  'deepest-underground': 'tiefstes unterirdisches Geschoss',
  floor: 'Aufstellung auf dem Boden',
  wall: 'Wandmontage',
  window: 'Fenstermontage',
  ceiling: 'Deckenmontage',
  natural: 'natürliche Lüftung',
  mechanical: 'mechanische Lüftung',
  none: 'keine gesicherte Lüftung'
});

export function fieldLabel(key) {
  return FIELD_LABELS[key] || String(key || 'Angabe');
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || String(status || 'offen');
}

export function checkLabel(id) {
  return CHECK_LABELS[id] || fieldLabel(id);
}

export function optionLabel(value) {
  return OPTION_LABELS[value] || String(value || 'nicht angegeben');
}

export function validationIssueLabel(issue) {
  const [key, code] = String(issue || '').split(':');
  const label = fieldLabel(key);
  if (code === 'required') return `${label} fehlt.`;
  if (code === 'positive-number-required') return `${label} muss größer als null sein.`;
  return `${label} prüfen.`;
}

export default Object.freeze({ fieldLabel, statusLabel, checkLabel, optionLabel, validationIssueLabel });
