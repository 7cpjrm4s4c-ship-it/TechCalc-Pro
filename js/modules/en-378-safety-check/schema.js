import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { buildFGasesImportOptions, hasAnyFGasesSavedSystem, hasMultipleFGasesSavedSystems, IMPORT_ACTION } from './importController.js';

const option = (value, label) => Object.freeze({ value, label });
const isMachineryRoom = state => state.installationLocation === 'machinery-room' || state.hasMachineryRoom === 'yes';
const isOutdoor = state => state.installationLocation === 'outdoor';
const usesAlternativeRiskManagement = state => state.usesAlternativeRiskManagement === 'yes';
const isHumanComfort = state => state.applicationType === 'human-comfort';
const needsMountingType = state => isHumanComfort(state) && state.isFactorySealed !== 'yes';
const needsExplosionEquipment = state => isMachineryRoom(state) && ['R-32', 'R32', 'HFKW-32', 'R-717', 'R717', 'R-290', 'R290'].includes(String(state.refrigerantId || ''));

const installationLocationOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('occupied-space', 'Aufenthaltsbereich'), option('technical-room', 'Technischer Raum'), option('machinery-room', 'Maschinenraum'), option('outdoor', 'Außenaufstellung')
]);
const installationClassOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('I', 'Klasse I – belüftetes Gehäuse'), option('II', 'Klasse II – Maschinenraum oder im Freien'), option('III', 'Klasse III – Verdichter in Maschinenraum oder im Freien'), option('IV', 'Klasse IV – mechanische Geräte im Personen-Aufenthaltsbereich')
]);
const accessAreaOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('general-access', 'Allgemeiner Zugang'), option('supervised-access', 'Beaufsichtigter Zugang'), option('authorized-access', 'Nur unterwiesene oder befugte Personen')
]);
const accessCategoryOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('a', 'a – Allgemeiner Zugangsbereich'), option('b', 'b – Überwachter Zugangsbereich'), option('c', 'c – Zugang nur für befugte Personen')
]);
const usageTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('residential', 'Wohnen'), option('commercial', 'Gewerbe'), option('industrial', 'Industrie'), option('public', 'Öffentlich zugänglicher Bereich')
]);
const applicationTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('human-comfort', 'Menschlicher Komfort'), option('other', 'Andere Anwendung')
]);
const locationLevelOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('other', 'Andere Lage'), option('upper-no-emergency-exit-or-basement', 'Oberes Geschoss ohne Notausgang oder Kellergeschoss'), option('underground', 'Unterirdisch'), option('deepest-underground', 'Tiefstes unterirdisches Geschoss')
]);
const mountingTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('floor', 'Aufstellung auf dem Boden'), option('wall', 'Wandmontage'), option('window', 'Fenstermontage'), option('ceiling', 'Deckenmontage')
]);
const ventilationTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('natural', 'Natürliche Lüftung'), option('mechanical', 'Mechanische Lüftung'), option('none', 'Keine gesicherte Lüftung')
]);
const yesNoOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('yes', 'Ja'), option('no', 'Nein')
]);

const schema = defineFormSchema({
  version: 1,
  fields: [
    { key: 'importedSystemName', label: 'Importierte Anlage', type: FIELD_TYPES.READONLY },
    { key: 'fGasesSnapshotId', label: 'Gespeicherte F-Gase-Anlage', type: FIELD_TYPES.SELECT, options: buildFGasesImportOptions, visibleWhen: hasMultipleFGasesSavedSystems },
    { key: 'importFGasesSystem', label: 'Anlage importieren', type: FIELD_TYPES.ACTION, action: IMPORT_ACTION, variant: 'primary', disabled: state => !hasAnyFGasesSavedSystem(), visibleWhen: hasAnyFGasesSavedSystem },
    { key: 'importNotice', label: 'Hinweis', type: FIELD_TYPES.NOTICE, text: 'Speichere zuerst im Modul F-Gase eine Anlage. Danach kann der Anlagenstand hier importiert werden.', visibleWhen: state => !hasAnyFGasesSavedSystem() },
    { key: 'refrigerantId', label: 'Kältemittel', type: FIELD_TYPES.SELECT, options: [] },
    { key: 'chargeKg', label: 'Füllmenge', type: FIELD_TYPES.DECIMAL, unit: 'kg' },
    { key: 'roomVolumeM3', label: 'Raumvolumen', type: FIELD_TYPES.DECIMAL, unit: 'm³' },
    { key: 'installationLocation', label: 'Aufstellort', type: FIELD_TYPES.SELECT, options: installationLocationOptions },
    { key: 'installationClass', label: 'Aufstellungsort-Klassifikation', type: FIELD_TYPES.SELECT, options: installationClassOptions },
    { key: 'accessArea', label: 'Zugangsbereich', type: FIELD_TYPES.SELECT, options: accessAreaOptions },
    { key: 'accessCategory', label: 'Kategorie des Zugangsbereichs', type: FIELD_TYPES.SELECT, options: accessCategoryOptions },
    { key: 'usageType', label: 'Nutzung', type: FIELD_TYPES.SELECT, options: usageTypeOptions },
    { key: 'applicationType', label: 'Anwendungsart', type: FIELD_TYPES.SELECT, options: applicationTypeOptions },
    { key: 'locationLevel', label: 'Geschoss oder Lage', type: FIELD_TYPES.SELECT, options: locationLevelOptions },
    { key: 'occupantDensityBelowOnePer10m2', label: 'Personendichte kleiner als eine Person je 10 m²', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => ['b', 'c'].includes(state.accessCategory) },
    { key: 'hasEmergencyExits', label: 'Notausgänge vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.accessCategory === 'c' },
    { key: 'isPermanentlySealedSorptionSystem', label: 'Dauerhaft geschlossene Sorptionsanlage', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.accessCategory === 'a' },
    { key: 'usesAlternativeRiskManagement', label: 'Alternative Vorkehrungen nach Anhang C.3 vorgesehen', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'floorAreaM2', label: 'Raumfläche', type: FIELD_TYPES.DECIMAL, unit: 'm²', visibleWhen: isHumanComfort },
    { key: 'mountingType', label: 'Montageart', type: FIELD_TYPES.SELECT, options: mountingTypeOptions, visibleWhen: needsMountingType },
    { key: 'isFactorySealed', label: 'Werkseitig dauerhaft geschlossen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isHumanComfort },
    { key: 'ventilationType', label: 'Lüftung', type: FIELD_TYPES.SELECT, options: ventilationTypeOptions },
    { key: 'hasGasWarningSystem', label: 'Gaswarnsystem vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'hasMachineryRoom', label: 'Maschinenraum vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'hasMechanicalVentilation', label: 'Mechanische Lüftung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isMachineryRoom(state) || usesAlternativeRiskManagement(state) },
    { key: 'hasEmergencyVentilation', label: 'Mechanische Notlüftung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isMachineryRoom },
    { key: 'hasEmergencyStopOutside', label: 'Not-Aus außen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isMachineryRoom },
    { key: 'hasEmergencyStopInside', label: 'Not-Aus innen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isMachineryRoom },
    { key: 'hasEmergencyLighting', label: 'Notbeleuchtung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isMachineryRoom },
    { key: 'hasDetector', label: 'Kältemitteldetektor vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.hasGasWarningSystem === 'yes' || isMachineryRoom(state) || usesAlternativeRiskManagement(state) },
    { key: 'hasAlarm', label: 'Alarmierung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.hasGasWarningSystem === 'yes' || isMachineryRoom(state) || state.hasDetector === 'yes' },
    { key: 'hasIndependentAlarmPower', label: 'Unabhängige Alarmstromversorgung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.hasAlarm === 'yes' || state.hasGasWarningSystem === 'yes' },
    { key: 'hasSafetyShutoffValves', label: 'Sicherheitsabsperrventile vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: usesAlternativeRiskManagement },
    { key: 'hasVentilationOpenings', label: 'Verdünnungsöffnungen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: usesAlternativeRiskManagement },
    { key: 'hasExplosionProtectedElectricalEquipment', label: 'Geeignete elektrische Betriebsmittel vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsExplosionEquipment },
    { key: 'isOutdoorPublicAccessible', label: 'Außenaufstellung öffentlich zugänglich', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'additionalSafetyMeasures', label: 'Weitere Sicherheitsmaßnahmen', type: FIELD_TYPES.TEXT }
  ],
  groups: [
    { title: 'Importierter Anlagenstand', fields: ['importedSystemName', 'fGasesSnapshotId', 'importFGasesSystem', 'importNotice', 'refrigerantId', 'chargeKg'], columns: 2, accent: 'blue' },
    { title: 'Raum und Aufstellung', fields: ['roomVolumeM3', 'installationLocation', 'installationClass', 'accessArea', 'accessCategory', 'usageType', 'applicationType', 'locationLevel'], columns: 2, accent: 'blue' },
    { title: 'Detailfragen zur Füllmengenbewertung', fields: ['occupantDensityBelowOnePer10m2', 'hasEmergencyExits', 'isPermanentlySealedSorptionSystem', 'usesAlternativeRiskManagement', 'floorAreaM2', 'mountingType', 'isFactorySealed'], columns: 2, accent: 'blue' },
    { title: 'Lüftung und Sicherheitskomponenten', fields: ['ventilationType', 'hasGasWarningSystem', 'hasMachineryRoom', 'hasMechanicalVentilation', 'hasEmergencyVentilation', 'hasEmergencyStopOutside', 'hasEmergencyStopInside', 'hasEmergencyLighting', 'hasDetector', 'hasAlarm', 'hasIndependentAlarmPower', 'hasSafetyShutoffValves', 'hasVentilationOpenings', 'hasExplosionProtectedElectricalEquipment', 'isOutdoorPublicAccessible', 'additionalSafetyMeasures'], columns: 2, accent: 'blue' }
  ]
});

export default schema;
