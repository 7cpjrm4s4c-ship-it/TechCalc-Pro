import { defineFormSchema, FIELD_TYPES } from '../../core/ui/formSchema.js';
import { getEN378SafetyData } from '../../core/data/index.js';
import { buildFGasesImportOptions, hasAnyFGasesSavedSystem, hasMultipleFGasesSavedSystems, IMPORT_ACTION } from './importController.js';

const option = (value, label) => Object.freeze({ value, label });
const accessCategoryByAccessArea = Object.freeze({ 'general-access': 'a', 'supervised-access': 'b', 'authorized-access': 'c' });
const isMachineryRoom = state => state.installationLocation === 'machinery-room' || state.hasMachineryRoom === 'yes';
const isOutdoor = state => state.installationLocation === 'outdoor';
const outdoorBaseRequirementsPassed = state => state.isOutdoorDefinitionConfirmed === 'yes' && state.outdoorSafeArrangement === 'yes' && state.outdoorPreventBuildingEntry === 'yes' && (state.hasOutdoorProtectiveCover === 'no' || (state.hasOutdoorProtectiveCover === 'yes' && state.outdoorCoverVentilated === 'yes'));
const needsOutdoorAccumulationAssessment = state => isOutdoor(state) && outdoorBaseRequirementsPassed(state);
const needsOutdoorEN3782Confirmation = state => needsOutdoorAccumulationAssessment(state) && state.outdoorRefrigerantAccumulationPossible === 'yes' && ['2L', '2', '3'].includes(getEN378SafetyData(state.refrigerantId)?.flammabilityClass);
const needsOutdoorEN3782StandardAssessment = state => needsOutdoorEN3782Confirmation(state) && (state.outdoorEN3782_6_2_14EN60335Applicable === 'no' || (state.outdoorEN3782_6_2_14EN60335Applicable === 'yes' && state.outdoorEN3782_6_2_14EN60335Compliant === 'no'));
const positiveNumber = value => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const requiresMachineryRoomGasDetection = state => {
  if (!isMachineryRoom(state)) return false;
  const safetyData = getEN378SafetyData(state.refrigerantId);
  const charge = positiveNumber(state.chargeKg);
  const volume = positiveNumber(state.roomVolumeM3);
  const practicalLimit = positiveNumber(safetyData?.practicalLimitKgM3);
  return charge != null && volume != null && practicalLimit != null && charge / volume > practicalLimit;
};
const usesAlternativeRiskManagement = state => state.usesAlternativeRiskManagement === 'yes';
const isHumanComfort = state => state.applicationType === 'human-comfort';
const needsMountingType = state => isHumanComfort(state) && state.isFactorySealed === 'no';
const needsExplosionEquipment = state => isMachineryRoom(state) && ['R-32', 'R32', 'HFKW-32', 'R-717', 'R717', 'R-290', 'R290'].includes(String(state.refrigerantId || ''));
const needsLegacyAccessCategoryField = state => !accessCategoryByAccessArea[state.accessArea] && Boolean(state.accessCategory);

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
    { key: 'importedSystemName', label: 'Importierte Anlage', type: FIELD_TYPES.TEXT, readonly: true },
    { key: 'importFGasesSystem', label: 'Anlage importieren', type: FIELD_TYPES.ACTION, action: IMPORT_ACTION, variant: 'primary', disabled: state => !hasAnyFGasesSavedSystem(), visibleWhen: hasAnyFGasesSavedSystem },
    { key: 'fGasesSnapshotId', label: 'Gespeicherte F-Gase-Anlage', type: FIELD_TYPES.SELECT, options: buildFGasesImportOptions, visibleWhen: hasMultipleFGasesSavedSystems },
    { key: 'importNotice', label: 'Hinweis', type: FIELD_TYPES.NOTICE, text: 'Speichere zuerst im Modul F-Gase eine Anlage. Danach kann der Anlagenstand hier importiert werden.', tone: 'compact', visibleWhen: state => !hasAnyFGasesSavedSystem() },
    { key: 'importStatusMessage', label: 'Importstatus', type: FIELD_TYPES.TEXT, readonly: true, visibleWhen: state => Boolean(state.importStatusMessage) },
    { key: 'refrigerantId', label: 'Kältemittel', type: FIELD_TYPES.SELECT, options: [] },
    { key: 'chargeKg', label: 'Gesamte Kältemittelfüllmenge der Anlage', type: FIELD_TYPES.DECIMAL, unit: 'kg' },
    { key: 'chargeScopeInfo', label: 'Hinweis zur Füllmenge', type: FIELD_TYPES.NOTICE, text: 'Gesamte Kältemittelfüllmenge der Anlage einschließlich aller kältemittelführenden Anlagenteile eingeben. Die Plausibilitätsprüfung der Füllmenge liegt in der Verantwortung des Planers.', tone: 'compact', visibleWhen: state => Boolean(state.installationLocation) },
    { key: 'roomVolumeM3', label: 'Raumvolumen', type: FIELD_TYPES.DECIMAL, unit: 'm³' },
    { key: 'installationLocation', label: 'Aufstellort', type: FIELD_TYPES.SELECT, options: installationLocationOptions },
    { key: 'installationClass', label: 'Aufstellungsort-Klassifikation', type: FIELD_TYPES.SELECT, options: installationClassOptions },
    { key: 'accessArea', label: 'Zugangsbereich', type: FIELD_TYPES.SELECT, options: accessAreaOptions },
    { key: 'accessCategoryInfo', label: 'Hinweis zur Zugangskategorie', type: FIELD_TYPES.NOTICE, text: 'Die Kategorie des Zugangsbereichs wird aus dem gewählten Zugangsbereich abgeleitet und muss nicht zusätzlich ausgewählt werden.', tone: 'compact', visibleWhen: state => Boolean(state.accessArea) },
    { key: 'accessCategory', label: 'Kategorie des Zugangsbereichs', type: FIELD_TYPES.SELECT, options: accessCategoryOptions, visibleWhen: needsLegacyAccessCategoryField },
    { key: 'usageType', label: 'Nutzung', type: FIELD_TYPES.SELECT, options: usageTypeOptions },
    { key: 'applicationType', label: 'Anwendungsart', type: FIELD_TYPES.SELECT, options: applicationTypeOptions },
    { key: 'locationLevel', label: 'Geschoss oder Lage', type: FIELD_TYPES.SELECT, options: locationLevelOptions },
    { key: 'occupantDensityBelowOnePer10m2', label: 'Personendichte kleiner als eine Person je 10 m²', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => ['b', 'c'].includes(accessCategoryByAccessArea[state.accessArea] || state.accessCategory) },
    { key: 'hasEmergencyExits', label: 'Notausgänge vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => (accessCategoryByAccessArea[state.accessArea] || state.accessCategory) === 'c' },
    { key: 'isPermanentlySealedSorptionSystem', label: 'Dauerhaft geschlossene Sorptionsanlage', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => (accessCategoryByAccessArea[state.accessArea] || state.accessCategory) === 'a' },
    { key: 'usesAlternativeRiskManagement', label: 'Alternative Vorkehrungen nach Anhang C.3 vorgesehen', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'alternativeRiskManagementInfo', label: 'Hinweis zu alternativen Vorkehrungen', type: FIELD_TYPES.NOTICE, text: 'Alternative Vorkehrungen nach Anhang C.3 werden nur bewertet, wenn dieser Pfad vorgesehen ist oder eine Grenzwertüberschreitung dies erfordert. Je nach Konzentration können eine oder zwei Maßnahmen erforderlich sein.', tone: 'compact', visibleWhen: usesAlternativeRiskManagement },
    { key: 'floorAreaM2', label: 'Raumfläche', type: FIELD_TYPES.DECIMAL, unit: 'm²', visibleWhen: isHumanComfort },
    { key: 'isFactorySealed', label: 'Werkseitig dauerhaft geschlossen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isHumanComfort },
    { key: 'mountingType', label: 'Montageart', type: FIELD_TYPES.SELECT, options: mountingTypeOptions, visibleWhen: needsMountingType },
    { key: 'ventilationType', label: 'Lüftung', type: FIELD_TYPES.SELECT, options: ventilationTypeOptions },
    { key: 'limitInfo', label: 'Hinweis zu Grenzwerten', type: FIELD_TYPES.NOTICE, text: 'RCL ist der Kältemittel-Konzentrationsgrenzwert. QLMV beschreibt den Grenzwert für Mindestlüftung. QLAV beschreibt den Grenzwert für zusätzliche Lüftung. Diese Werte werden nur angezeigt, wenn sie für die Bewertung benötigt werden.', tone: 'compact', visibleWhen: usesAlternativeRiskManagement },
    { key: 'hasGasWarningSystem', label: 'Gaswarnsystem vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'hasMachineryRoom', label: 'Maschinenraum vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'hasMechanicalVentilation', label: 'Mechanische Lüftung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isMachineryRoom(state) || usesAlternativeRiskManagement(state) || (isOutdoor(state) && state.outdoorRefrigerantAccumulationPossible === 'yes') },
    { key: 'outdoorVentilationGeneralConfirmed', label: 'Lüftungsführung nach EN 378-3, 5.13.1 geprüft', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isOutdoor(state) && state.outdoorRefrigerantAccumulationPossible === 'yes' },
    { key: 'outdoorVentilationNationalRulesConfirmed', label: 'Nationale Lüftungsvorschriften nach EN 378-3, 5.13.2 eingehalten', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isOutdoor(state) && state.outdoorRefrigerantAccumulationPossible === 'yes' },
    { key: 'outdoorMechanicalVentilationOpeningsConfirmed', label: 'Öffnungen für mechanische Lüftung nach EN 378-3, 5.13.5 geprüft', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isOutdoor(state) && state.outdoorRefrigerantAccumulationPossible === 'yes' && state.hasMechanicalVentilation === 'yes' },
    { key: 'machineryRoomLargestSystemChargeKg', label: 'Füllmenge der größten Kälteanlage mit Anlagenteil im Maschinenraum', type: FIELD_TYPES.DECIMAL, unit: 'kg', visibleWhen: requiresMachineryRoomGasDetection },
    { key: 'hasEmergencyVentilation', label: 'Mechanische Notlüftung durch Detektoren aktiviert', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: requiresMachineryRoomGasDetection },
    { key: 'hasEmergencyVentilationControlOutside', label: 'Unabhängige Notsteuerung der Notlüftung außen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: requiresMachineryRoomGasDetection },
    { key: 'hasEmergencyVentilationControlInside', label: 'Unabhängige Notsteuerung der Notlüftung innen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: requiresMachineryRoomGasDetection },
    { key: 'hasEmergencyStopOutside', label: 'Not-Aus außen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isMachineryRoom },
    { key: 'hasEmergencyStopInside', label: 'Not-Aus innen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isMachineryRoom },
    { key: 'hasEmergencyLighting', label: 'Notbeleuchtung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isMachineryRoom },
    { key: 'hasDetector', label: 'Kältemitteldetektor vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.hasGasWarningSystem === 'yes' || isMachineryRoom(state) || usesAlternativeRiskManagement(state) },
    { key: 'hasAlarm', label: 'Alarmierung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.hasGasWarningSystem === 'yes' || isMachineryRoom(state) || state.hasDetector === 'yes' || usesAlternativeRiskManagement(state) },
    { key: 'hasIndependentAlarmPower', label: 'Unabhängige Alarmstromversorgung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.hasAlarm === 'yes' || state.hasGasWarningSystem === 'yes' },
    { key: 'hasSafetyShutoffValves', label: 'Sicherheitsabsperrventile vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: usesAlternativeRiskManagement },
    { key: 'hasVentilationOpenings', label: 'Verdünnungsöffnungen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: usesAlternativeRiskManagement },
    { key: 'hasExplosionProtectedElectricalEquipment', label: 'Geeignete elektrische Betriebsmittel vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsExplosionEquipment },
    { key: 'isOutdoorPublicAccessible', label: 'Außenaufstellung öffentlich zugänglich', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'isOutdoorDefinitionConfirmed', label: 'Definition „im Freien“ durch Planer bestätigt', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'outdoorSafeArrangement', label: 'Außenaufstellung schützt Personen und Sachwerte bei Leckage', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'outdoorPreventBuildingEntry', label: 'Eindringen in Gebäude- und Frischluftöffnungen ausgeschlossen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'hasOutdoorProtectiveCover', label: 'Schutzabdeckung für kältetechnische Komponenten vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'outdoorCoverVentilated', label: 'Schutzabdeckung ausreichend natürlich oder mechanisch belüftet', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isOutdoor(state) && state.hasOutdoorProtectiveCover === 'yes' },
    { key: 'outdoorRefrigerantAccumulationPossible', label: 'Kältemittelansammlung möglich', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorAccumulationAssessment },
    { key: 'outdoorEN3782_6_2_14EN60335Applicable', label: 'EN-60335-Normenreihe anwendbar', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782Confirmation },
    { key: 'outdoorEN3782_6_2_14EN60335Compliant', label: 'Anlage erfüllt die anwendbaren EN-60335-Anforderungen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782Confirmation(state) && state.outdoorEN3782_6_2_14EN60335Applicable === 'yes' },
    { key: 'outdoorEN3782_6_2_14EN60335EvidenceReference', label: 'Nachweisreferenz EN 60335', type: FIELD_TYPES.TEXT, visibleWhen: state => needsOutdoorEN3782Confirmation(state) && state.outdoorEN3782_6_2_14EN60335Applicable === 'yes' && state.outdoorEN3782_6_2_14EN60335Compliant === 'yes' },
    { key: 'outdoorEN3782_6_2_14HazardousAreaConfirmed', label: 'Potenziell entflammbaren Bereich extern ermittelt', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782StandardAssessment },
    { key: 'outdoorEN3782_6_2_14HazardousAreaEvidenceReference', label: 'Dokumentreferenz Gefahrenbereichsermittlung', type: FIELD_TYPES.TEXT, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14HazardousAreaConfirmed === 'yes' },
    { key: 'outdoorEN3782_6_2_14ComponentAssessmentConfirmed', label: 'Relevante Komponenten extern bewertet', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782StandardAssessment },
    { key: 'outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference', label: 'Dokumentreferenz Komponentenbewertung', type: FIELD_TYPES.TEXT, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14ComponentAssessmentConfirmed === 'yes' },
    { key: 'outdoorEN3782_6_2_14ProtectionConditionsConfirmed', label: 'Mindestens eine zutreffende Schutzbedingung je relevanter Komponente nachgewiesen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782StandardAssessment },
    { key: 'outdoorEN3782_6_2_14ProtectionEvidenceReference', label: 'Dokumentreferenz Schutzbedingungen', type: FIELD_TYPES.TEXT, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14ProtectionConditionsConfirmed === 'yes' },
    { key: 'outdoorEN3782_6_2_14AirflowProtectionUsed', label: 'Luftstromabhängiger Schutz wird verwendet', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782StandardAssessment },
    { key: 'outdoorEN3782_6_2_14AirflowAvailabilityConfirmed', label: 'Dauerhafte Verfügbarkeit des erforderlichen Luftstroms sichergestellt', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14AirflowProtectionUsed === 'yes' },
    { key: 'outdoorEN3782_6_2_14AirflowInterlockConfirmed', label: 'Einschalten bei unzureichendem Luftstrom verriegelt', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14AirflowProtectionUsed === 'yes' },
    { key: 'outdoorEN3782_6_2_14SurfaceTemperatureConfirmed', label: 'Zulässige Oberflächentemperaturen extern nachgewiesen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782StandardAssessment },
    { key: 'outdoorEN3782_6_2_14HazardousAreaExceedsEquipment', label: 'Entflammbarer Bereich reicht über Geräteabmessungen hinaus', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782StandardAssessment },
    { key: 'outdoorEN3782_6_2_14EquipmentDocumentationUpdated', label: 'Erweiterter entflammbarer Bereich in Gerätedokumentation angegeben', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14HazardousAreaExceedsEquipment === 'yes' },
    { key: 'additionalSafetyMeasures', label: 'Weitere Sicherheitsmaßnahmen', type: FIELD_TYPES.TEXT }
  ],
  groups: [
    { title: 'Importierter Anlagenstand', fields: ['importedSystemName', 'importFGasesSystem', 'fGasesSnapshotId', 'importNotice', 'importStatusMessage', 'refrigerantId', 'chargeKg', 'chargeScopeInfo'], columns: 2, accent: 'blue' },
    { title: 'Raum und Aufstellung', fields: ['roomVolumeM3', 'installationLocation', 'installationClass', 'accessArea', 'accessCategoryInfo', 'accessCategory', 'usageType', 'applicationType', 'locationLevel'], columns: 2, accent: 'blue' },
    { title: 'Detailfragen zur Füllmengenbewertung', fields: ['occupantDensityBelowOnePer10m2', 'hasEmergencyExits', 'isPermanentlySealedSorptionSystem', 'usesAlternativeRiskManagement', 'alternativeRiskManagementInfo', 'floorAreaM2', 'isFactorySealed', 'mountingType'], columns: 2, accent: 'blue' },
    { title: 'Lüftung und Sicherheitskomponenten', fields: ['ventilationType', 'limitInfo', 'hasGasWarningSystem', 'hasMachineryRoom', 'hasMechanicalVentilation', 'machineryRoomLargestSystemChargeKg', 'hasEmergencyVentilation', 'hasEmergencyVentilationControlOutside', 'hasEmergencyVentilationControlInside', 'hasEmergencyStopOutside', 'hasEmergencyStopInside', 'hasEmergencyLighting', 'hasDetector', 'hasAlarm', 'hasIndependentAlarmPower', 'hasSafetyShutoffValves', 'hasVentilationOpenings', 'hasExplosionProtectedElectricalEquipment', 'isOutdoorPublicAccessible', 'outdoorSafeArrangement', 'outdoorPreventBuildingEntry', 'hasOutdoorProtectiveCover', 'outdoorCoverVentilated', 'outdoorRefrigerantAccumulationPossible', 'outdoorEN3782_6_2_14EN60335Applicable', 'outdoorEN3782_6_2_14EN60335Compliant', 'outdoorEN3782_6_2_14EN60335EvidenceReference', 'outdoorEN3782_6_2_14HazardousAreaConfirmed', 'outdoorEN3782_6_2_14HazardousAreaEvidenceReference', 'outdoorEN3782_6_2_14ComponentAssessmentConfirmed', 'outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference', 'outdoorEN3782_6_2_14ProtectionConditionsConfirmed', 'outdoorEN3782_6_2_14ProtectionEvidenceReference', 'outdoorEN3782_6_2_14AirflowProtectionUsed', 'outdoorEN3782_6_2_14AirflowAvailabilityConfirmed', 'outdoorEN3782_6_2_14AirflowInterlockConfirmed', 'outdoorEN3782_6_2_14SurfaceTemperatureConfirmed', 'outdoorEN3782_6_2_14HazardousAreaExceedsEquipment', 'outdoorEN3782_6_2_14EquipmentDocumentationUpdated', 'outdoorVentilationGeneralConfirmed', 'outdoorVentilationNationalRulesConfirmed', 'outdoorMechanicalVentilationOpeningsConfirmed', 'additionalSafetyMeasures'], columns: 2, accent: 'blue' }
  ]
});

export default schema;
