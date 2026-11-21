import { defineFormSchema, FIELD_TYPES } from '../../core/ui/formSchema.js';
import { getEN378SafetyData } from '../../core/data/index.js';
import { buildFGasesImportOptions, hasAnyFGasesSavedSystem, hasMultipleFGasesSavedSystems, IMPORT_ACTION } from './importController.js';
import { ACCESS_CATEGORY_BY_ACCESS_AREA } from './logic.js';

const option = (value, label) => Object.freeze({ value, label });
const accessCategoryByAccessArea = ACCESS_CATEGORY_BY_ACCESS_AREA;
const isMachineryRoom = state => state.installationLocation === 'machinery-room';
const yes = value => value === true || value === 'yes';
const isMachineryRoomRiskAnalysisYes = state => state.installationLocation === 'machinery-room' && state.machineryRoomRiskAnalysisResult === 'yes';
const isOutdoor = state => state.installationLocation === 'outdoor';
const isTechnicalRoom = state => state.installationLocation === 'technical-room';
// EN 378-3, 4.5: abgeschlossener Raum ohne Personenaufenthalt (4.5 Abs. 2/3)
const technicalRoomSeparated = state => isTechnicalRoom(state) && state.technicalRoomSeparatedFromOccupiedSpaces === 'yes';
// 4.5 Abs. 2 (M2): Verdichter/Druckbehälter im abgeschlossenen Raum -> Behandlung wie Maschinenraum nach Abschnitt 5
const technicalRoomMachineryRoomCase = state => technicalRoomSeparated(state) && state.technicalRoomContainsCompressorOrPressureVessel === 'yes';
// Abschnitt-5-Felder werden im Pfad 4.3 (Risikoanalyse Ergebnis "ja") ODER im Fall M2 (4.5) angezeigt
const showsSectionFiveFields = state => isMachineryRoomRiskAnalysisYes(state) || technicalRoomMachineryRoomCase(state);
// 4.5 Abs. 3 (M3-M5): abgeschlossen, keine Verdichter/Druckbehälter, lösbare Verbindungen
const needsTechnicalRoomHoodDetails = state => technicalRoomSeparated(state) && state.technicalRoomContainsCompressorOrPressureVessel === 'no' && state.technicalRoomComponentsHaveDetachableJoints === 'yes';
const outdoorBaseRequirementsPassed = state => state.isOutdoorDefinitionConfirmed === 'yes' && state.outdoorSafeArrangement === 'yes' && state.outdoorPreventBuildingEntry === 'yes' && (state.hasOutdoorProtectiveCover === 'no' || (state.hasOutdoorProtectiveCover === 'yes' && state.outdoorCoverVentilated === 'yes'));
const needsOutdoorAccumulationAssessment = state => isOutdoor(state) && outdoorBaseRequirementsPassed(state);
const needsOutdoorEN3782Confirmation = state => needsOutdoorAccumulationAssessment(state) && state.outdoorRefrigerantAccumulationPossible === 'yes' && ['2L', '2', '3'].includes(getEN378SafetyData(state.refrigerantId)?.flammabilityClass);
const needsOutdoorEN3782StandardAssessment = state => needsOutdoorEN3782Confirmation(state) && (state.outdoorEN3782_6_2_14EN60335Applicable === 'no' || (state.outdoorEN3782_6_2_14EN60335Applicable === 'yes' && state.outdoorEN3782_6_2_14EN60335Compliant === 'no'));
const needsOutdoorEN3782SurfaceTemperature = state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14ProtectionConditionsConfirmed === 'yes' && Boolean(String(state.outdoorEN3782_6_2_14ProtectionEvidenceReference || '').trim()) && ['A2', 'A2L', 'B2L', 'A3', 'B2', 'B3'].includes(`${getEN378SafetyData(state.refrigerantId)?.toxicityClass || ''}${getEN378SafetyData(state.refrigerantId)?.flammabilityClass || ''}`);
const positiveNumber = value => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const isFlammable = state => ['2L', '2', '3'].includes(getEN378SafetyData(state.refrigerantId)?.flammabilityClass);
const requiresMachineryRoomGasDetection = state => {
  if (!isMachineryRoom(state) && !technicalRoomMachineryRoomCase(state)) return false;
  const safetyData = getEN378SafetyData(state.refrigerantId);
  const charge = positiveNumber(state.chargeKg);
  const volume = positiveNumber(state.roomVolumeM3);
  const practicalLimit = positiveNumber(safetyData?.practicalLimitKgM3);
  return charge != null && volume != null && practicalLimit != null && charge / volume > practicalLimit;
};
const usesAlternativeRiskManagement = state => state.usesAlternativeRiskManagement === 'yes';
const needsC3DetailQuestions = state => usesAlternativeRiskManagement(state) && (state.installationLocation === 'occupied-space' || state.installationLocation === 'ventilated-enclosure');
const isHumanComfort = state => state.applicationType === 'human-comfort';
const needsMountingType = state => isHumanComfort(state) && state.isFactorySealed === 'no';
const needsExplosionEquipment = state => isMachineryRoom(state) && ['R-32', 'R32', 'HFKW-32', 'R-717', 'R717', 'R-290', 'R290'].includes(String(state.refrigerantId || ''));
const needsLegacyAccessCategoryField = state => !accessCategoryByAccessArea[state.accessArea] && Boolean(state.accessCategory);

const installationLocationOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('occupied-space', 'Aufenthaltsbereich'), option('technical-room', 'Technischer Raum'), option('machinery-room', 'Maschinenraum'), option('outdoor', 'Außenaufstellung'), option('ventilated-enclosure', 'Belüftetes Gehäuse')
]);
// Normativ zulässige Kombinationen aus Aufstellort und Aufstellungsort-Klasse
// (EN 378-1, Abschnitt 5): Klasse I nur bei kältemittelführenden Teilen im
// Personen-Aufenthaltsbereich; Klasse II nur bei Verdichtern und Druckbehältern
// im Maschinenraum oder im Freien; Klasse III nur bei vollständiger Aufstellung
// in Maschinenraum oder im Freien; Klasse IV nur im belüfteten Gehäuse im
// Personen-Aufenthaltsbereich. Die Plausibilitätsprüfung (stateConsistency.js)
// wertet II, III und IV gegen den Aufstellort aus.
const installationClassOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('I', 'Klasse I – Mechanische Geräte im Personen-Aufenthaltsbereich'), option('II', 'Klasse II – Verdichter im Maschinenraum oder im Freien'), option('III', 'Klasse III – Maschinenraum oder im Freien'), option('IV', 'Klasse IV – Belüftetes Gehäuse')
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
const technicalRoomAdverseConditionsOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('none', 'Keine ungünstigen Bedingungen'), option('vibrations', 'Starke Schwingungen'), option('corrosive-atmosphere', 'Korrosive Atmosphäre'), option('vibrations-and-corrosive', 'Starke Schwingungen und korrosive Atmosphäre')
]);
const riskAnalysisStatusOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('present', 'Risikoanalyse liegt vor')
]);
const riskAnalysisResultOptions = Object.freeze([
  option('', 'offen'), option('yes', 'Maschinenraum erforderlich'), option('no', 'nicht erforderlich')
]);

const schema = defineFormSchema({
  version: 2,
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
    { key: 'classIiCompressorsOutsideOrMachineryRoom', label: 'Alle Verdichter und Druckbehälter befinden sich im Maschinenraum oder im Freien', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.installationLocation === 'occupied-space' && state.installationClass === 'II' },
    { key: 'machineryRoomRiskAnalysisStatus', label: 'Risikoanalyse Maschinenraum', type: FIELD_TYPES.SELECT, options: riskAnalysisStatusOptions, visibleWhen: state => state.installationLocation === 'machinery-room' },
    { key: 'machineryRoomRiskAnalysisResult', label: 'Ergebnis der Risikoanalyse', type: FIELD_TYPES.SELECT, options: riskAnalysisResultOptions, visibleWhen: state => state.installationLocation === 'machinery-room' },
    { key: 'machineryRoomRiskAnalysisNotes', label: 'Bemerkungen zur Risikoanalyse', type: FIELD_TYPES.TEXTAREA, visibleWhen: state => state.installationLocation === 'machinery-room' },
    { key: 'accessArea', label: 'Zugangsbereich', type: FIELD_TYPES.SELECT, options: accessAreaOptions },
    { key: 'accessCategoryInfo', label: 'Hinweis zur Zugangskategorie', type: FIELD_TYPES.NOTICE, text: 'Die Kategorie des Zugangsbereichs wird aus dem gewählten Zugangsbereich abgeleitet und muss nicht zusätzlich ausgewählt werden.', tone: 'compact', visibleWhen: state => Boolean(state.accessArea) },
    { key: 'accessCategory', label: 'Kategorie des Zugangsbereichs', type: FIELD_TYPES.SELECT, options: accessCategoryOptions, visibleWhen: needsLegacyAccessCategoryField },
    { key: 'usageType', label: 'Nutzung', type: FIELD_TYPES.SELECT, options: usageTypeOptions },
    { key: 'applicationType', label: 'Anwendungsart', type: FIELD_TYPES.SELECT, options: applicationTypeOptions },
    { key: 'locationLevel', label: 'Geschoss oder Lage', type: FIELD_TYPES.SELECT, options: locationLevelOptions },
    // Die gesonderte Kellergeschoss-Abfrage ist beabsichtigt: Für den Maschinenraum-Pfad (EN 378-3, 4.3) ist die Unterscheidung unterirdischer Geschosse normativ erforderlich und darf nicht aus der Geschosslage allein abgeleitet werden.
    { key: 'isBasementLocation', label: 'Kellergeschoss', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.locationLevel === 'upper-no-emergency-exit-or-basement' },
    { key: 'occupantDensityBelowOnePer10m2', label: 'Personendichte kleiner als eine Person je 10 m²', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => ['b', 'c'].includes(accessCategoryByAccessArea[state.accessArea] || state.accessCategory) },
    { key: 'hasEmergencyExits', label: 'Notausgänge vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => (accessCategoryByAccessArea[state.accessArea] || state.accessCategory) === 'c' },
    { key: 'isPermanentlySealedSorptionSystem', label: 'Dauerhaft geschlossene Sorptionsanlage', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => (accessCategoryByAccessArea[state.accessArea] || state.accessCategory) === 'a' },
    { key: 'usesAlternativeRiskManagement', label: 'Alternative Vorkehrungen nach Anhang C.3 vorgesehen', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'alternativeRiskManagementInfo', label: 'Hinweis zu alternativen Vorkehrungen', type: FIELD_TYPES.NOTICE, text: 'Alternative Vorkehrungen nach Anhang C.3 werden nur bewertet, wenn dieser Pfad vorgesehen ist oder eine Grenzwertüberschreitung dies erfordert. Je nach Konzentration können eine oder zwei Maßnahmen erforderlich sein.', tone: 'compact', visibleWhen: usesAlternativeRiskManagement },
    { key: 'floorAreaM2', label: 'Raumfläche', type: FIELD_TYPES.DECIMAL, unit: 'm²', visibleWhen: isHumanComfort },
    { key: 'isFactorySealed', label: 'Werkseitig dauerhaft geschlossen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isHumanComfort },
    { key: 'c3FactoryBuiltConnections', label: 'Alle Verzweigungen aus fabrikmäßig zusammengebauten Verbindungsstücken', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsC3DetailQuestions },
    { key: 'c3NoValvesOrConsumerConnections', label: 'Keine Ventile oder Verbraucheranschlüsse im Personen-Aufenthaltsbereich außerhalb der fabrikmäßigen Einheiten', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsC3DetailQuestions },
    { key: 'c3PipingProtected', label: 'Rohrleitungen gegen Beschädigung geschützt', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsC3DetailQuestions },
    { key: 'c3DoorsNotTightClosing', label: 'Türen schließen nicht dicht', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsC3DetailQuestions },
    { key: 'mountingType', label: 'Montageart', type: FIELD_TYPES.SELECT, options: mountingTypeOptions, visibleWhen: needsMountingType },
    // ventilationType und hasMechanicalVentilation bleiben beide bestehen, da sie normativ Verschiedenes aussagen: ventilationType wird im Außenpfad (EN 378-3, 5.13.5) und im Maschinenraumpfad (4.3) benötigt; hasMechanicalVentilation gehört ausschließlich zur Sicherheitsmaßnahme mechanische Lüftung der alternativen Vorkehrungen (EN 378-3, 6.3.3, C.3-Pfad). Widersprüche (ventilationType 'none' bei hasMechanicalVentilation 'yes') wertet die Plausibilitätsprüfung als Konflikt aus.
    { key: 'ventilationType', label: 'Lüftung', type: FIELD_TYPES.SELECT, options: ventilationTypeOptions },
    { key: 'limitInfo', label: 'Hinweis zu Grenzwerten', type: FIELD_TYPES.NOTICE, text: 'RCL ist der Kältemittel-Konzentrationsgrenzwert. QLMV beschreibt den Grenzwert für Mindestlüftung. QLAV beschreibt den Grenzwert für zusätzliche Lüftung. Diese Werte werden nur angezeigt, wenn sie für die Bewertung benötigt werden.', tone: 'compact', visibleWhen: usesAlternativeRiskManagement },
    { key: 'hasGasWarningSystem', label: 'Gaswarnsystem vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'machineryRoomOccupied', label: 'Personenaufenthalt im Maschinenraum möglich', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: showsSectionFiveFields },
    { key: 'machineryRoomRequiredAirChangeAchievable', label: 'Erforderlicher vierfacher Luftwechsel erreichbar', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => showsSectionFiveFields(state) && yes(state.machineryRoomOccupied) },
    { key: 'machineryRoomEmergencyFanSuitable', label: 'Notentlüftungsventilator geeignet', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => showsSectionFiveFields(state) && isFlammable(state) },
    { key: 'machineryRoomR717ContainmentProvided', label: 'Auffangsystem für R-717 vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => showsSectionFiveFields(state) && state.refrigerantId === 'R-717' },
    { key: 'machineryRoomR717EyeWashProvided', label: 'Augenspülung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => showsSectionFiveFields(state) && state.refrigerantId === 'R-717' },
    { key: 'machineryRoomR717EmergencyShowerProvided', label: 'Notdusche vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => showsSectionFiveFields(state) && state.refrigerantId === 'R-717' && positiveNumber(state.chargeKg) > 1000 },
    { key: 'machineryRoomR717SprinklerInstalled', label: 'Sprinkleranlage installiert', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => showsSectionFiveFields(state) && state.refrigerantId === 'R-717' },
    { key: 'machineryRoomR717SprinklerConditionsConfirmed', label: 'Sprinkler-Bedingungen erfüllt', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => showsSectionFiveFields(state) && state.refrigerantId === 'R-717' && state.machineryRoomR717SprinklerInstalled === 'yes' },
    { key: 'hasMechanicalVentilation', label: 'Mechanische Lüftung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: usesAlternativeRiskManagement },
    { key: 'outdoorVentilationGeneralConfirmed', label: 'Lüftungsführung nach EN 378-3, 5.13.1 geprüft', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isOutdoor(state) && state.outdoorRefrigerantAccumulationPossible === 'yes' },
    { key: 'outdoorVentilationNationalRulesConfirmed', label: 'Nationale Lüftungsvorschriften nach EN 378-3, 5.13.2 eingehalten', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isOutdoor(state) && state.outdoorRefrigerantAccumulationPossible === 'yes' },
    { key: 'outdoorMechanicalVentilationOpeningsConfirmed', label: 'Öffnungen für mechanische Lüftung nach EN 378-3, 5.13.5 geprüft', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isOutdoor(state) && state.outdoorRefrigerantAccumulationPossible === 'yes' && state.ventilationType === 'mechanical' },
    { key: 'machineryRoomLargestSystemChargeKg', label: 'Füllmenge der größten Kälteanlage mit Anlagenteil im Maschinenraum', type: FIELD_TYPES.DECIMAL, unit: 'kg', visibleWhen: showsSectionFiveFields },
    { key: 'hasEmergencyVentilation', label: 'Mechanische Notlüftung durch Detektoren aktiviert', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: requiresMachineryRoomGasDetection },
    { key: 'hasEmergencyVentilationControlOutside', label: 'Unabhängige Notsteuerung der Notlüftung außen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: showsSectionFiveFields },
    { key: 'hasEmergencyVentilationControlInside', label: 'Unabhängige Notsteuerung der Notlüftung innen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: showsSectionFiveFields },



    { key: 'hasDetector', label: 'Kältemitteldetektor vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.hasGasWarningSystem === 'yes' || isMachineryRoom(state) || usesAlternativeRiskManagement(state) },
    // EN 378-3 Abschnitte 8 und 9: Alarmierung ist nur sinnvoll schaltbar, wenn eine
    // Auslösehardware vorhanden ist (Gaswarnsystem oder Detektor); sonst deaktiviert.
    { key: 'hasAlarm', label: 'Alarmierung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.hasGasWarningSystem === 'yes' || isMachineryRoom(state) || state.hasDetector === 'yes' || usesAlternativeRiskManagement(state), disabled: state => state.hasGasWarningSystem !== 'yes' && state.hasDetector !== 'yes' },
    { key: 'hasIndependentAlarmPower', label: 'Unabhängige Alarmstromversorgung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => state.hasAlarm === 'yes' || state.hasGasWarningSystem === 'yes', disabled: state => state.hasGasWarningSystem !== 'yes' && state.hasDetector !== 'yes' },
    { key: 'hasSafetyShutoffValves', label: 'Sicherheitsabsperrventile vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: usesAlternativeRiskManagement },
    { key: 'hasVentilationOpenings', label: 'Verdünnungsöffnungen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: usesAlternativeRiskManagement },
    { key: 'hasExplosionProtectedElectricalEquipment', label: 'Geeignete elektrische Betriebsmittel vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsExplosionEquipment },
    { key: 'isOutdoorPublicAccessible', label: 'Außenaufstellung öffentlich zugänglich', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'isOutdoorDefinitionConfirmed', label: 'Erfüllt der Aufstellort die Definition „im Freien“ nach EN 378-3, Abschnitt 4.2?', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'outdoorSafeArrangement', label: 'Außenaufstellung schützt Personen und Sachwerte bei Leckage', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'outdoorPreventBuildingEntry', label: 'Eindringen in Gebäude- und Frischluftöffnungen ausgeschlossen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'hasOutdoorProtectiveCover', label: 'Schutzabdeckung für kältetechnische Komponenten vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isOutdoor },
    { key: 'outdoorCoverVentilated', label: 'Schutzabdeckung ausreichend natürlich oder mechanisch belüftet', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isOutdoor(state) && state.hasOutdoorProtectiveCover === 'yes' },
    { key: 'outdoorRefrigerantAccumulationPossible', label: 'Kältemittelansammlung möglich', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorAccumulationAssessment },
    { key: 'outdoorEN3782_6_2_14EN60335Applicable', label: 'EN-60335-Normenreihe anwendbar', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782Confirmation },
    { key: 'outdoorEN3782_6_2_14EN60335Compliant', label: 'Anlage erfüllt die anwendbaren EN-60335-Anforderungen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782Confirmation(state) && state.outdoorEN3782_6_2_14EN60335Applicable === 'yes' },
    { key: 'outdoorEN3782_6_2_14EN60335EvidenceReference', label: 'Nachweisreferenz EN 60335', type: FIELD_TYPES.TEXT, commit: 'immediate', visibleWhen: state => needsOutdoorEN3782Confirmation(state) && state.outdoorEN3782_6_2_14EN60335Applicable === 'yes' && state.outdoorEN3782_6_2_14EN60335Compliant === 'yes' },
    { key: 'outdoorEN3782_6_2_14HazardousAreaConfirmed', label: 'Potenziell entflammbaren Bereich extern ermittelt', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782StandardAssessment },
    { key: 'outdoorEN3782_6_2_14HazardousAreaEvidenceReference', label: 'Dokumentreferenz Gefahrenbereichsermittlung', type: FIELD_TYPES.TEXT, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14HazardousAreaConfirmed === 'yes' },
    { key: 'outdoorEN3782_6_2_14ComponentAssessmentConfirmed', label: 'Relevante Komponenten extern bewertet', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14HazardousAreaConfirmed === 'yes' && Boolean(String(state.outdoorEN3782_6_2_14HazardousAreaEvidenceReference || '').trim()) },
    { key: 'outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference', label: 'Dokumentreferenz Komponentenbewertung', type: FIELD_TYPES.TEXT, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14ComponentAssessmentConfirmed === 'yes' },
    { key: 'outdoorEN3782_6_2_14ProtectionConditionsConfirmed', label: 'Mindestens eine zutreffende Schutzbedingung je relevanter Komponente nachgewiesen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14ComponentAssessmentConfirmed === 'yes' && Boolean(String(state.outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference || '').trim()) },
    { key: 'outdoorEN3782_6_2_14ProtectionEvidenceReference', label: 'Dokumentreferenz Schutzbedingungen', type: FIELD_TYPES.TEXT, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14ProtectionConditionsConfirmed === 'yes' },
    { key: 'outdoorEN3782_6_2_14AirflowProtectionUsed', label: 'Luftstromabhängiger Schutz wird verwendet', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14ProtectionConditionsConfirmed === 'yes' && Boolean(String(state.outdoorEN3782_6_2_14ProtectionEvidenceReference || '').trim()) },
    { key: 'outdoorEN3782_6_2_14AirflowAvailabilityConfirmed', label: 'Dauerhafte Verfügbarkeit des erforderlichen Luftstroms sichergestellt', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14AirflowProtectionUsed === 'yes' },
    { key: 'outdoorEN3782_6_2_14AirflowInterlockConfirmed', label: 'Einschalten bei unzureichendem Luftstrom verriegelt', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14AirflowProtectionUsed === 'yes' },
    { key: 'outdoorEN3782_6_2_14SurfaceTemperatureConfirmed', label: 'Zulässige Oberflächentemperaturen extern nachgewiesen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsOutdoorEN3782SurfaceTemperature },
    { key: 'outdoorEN3782_6_2_14HazardousAreaExceedsEquipment', label: 'Entflammbarer Bereich reicht über Geräteabmessungen hinaus', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14ProtectionConditionsConfirmed === 'yes' && Boolean(String(state.outdoorEN3782_6_2_14ProtectionEvidenceReference || '').trim()) },
    { key: 'outdoorEN3782_6_2_14EquipmentDocumentationUpdated', label: 'Erweiterter entflammbarer Bereich in Gerätedokumentation angegeben', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => needsOutdoorEN3782StandardAssessment(state) && state.outdoorEN3782_6_2_14ProtectionConditionsConfirmed === 'yes' && Boolean(String(state.outdoorEN3782_6_2_14ProtectionEvidenceReference || '').trim()) && state.outdoorEN3782_6_2_14HazardousAreaExceedsEquipment === 'yes' },
    { key: 'additionalSafetyMeasures', label: 'Weitere Sicherheitsmaßnahmen', type: FIELD_TYPES.TEXT },
    // EN 378-3, Abschnitt 4.5: Raum ohne Personenaufenthalt (nicht als Maschinenraum ausgewiesen)
    { key: 'technicalRoomSeparatedFromOccupiedSpaces', label: 'Raum gegenüber Personen-Aufenthaltsbereichen abgeschlossen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isTechnicalRoom },
    { key: 'technicalRoomNotSeparatedNotice', label: 'Hinweis zur Umleitung auf Abschnitt 4.4', type: FIELD_TYPES.NOTICE, text: 'Der Raum ist nicht gegenüber jeglichem Personen-Aufenthaltsbereich abgeschlossen: Die kältetechnischen Komponenten sind als im Personen-Aufenthaltsbereich befindlich anzusehen; die Bewertung erfolgt nach EN 378-3 Abschnitt 4.4.', tone: 'compact', visibleWhen: state => isTechnicalRoom(state) && state.technicalRoomSeparatedFromOccupiedSpaces === 'no' },
    { key: 'technicalRoomContainsCompressorOrPressureVessel', label: 'Verdichter oder Druckbehälter im Raum vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => technicalRoomSeparated(state) },
    { key: 'technicalRoomComponentsHaveDetachableJoints', label: 'Komponenten mit lösbaren Verbindungen vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => technicalRoomSeparated(state) && state.technicalRoomContainsCompressorOrPressureVessel !== 'yes' },
    { key: 'technicalRoomAdverseConditions', label: 'Ungünstige Bedingungen (EN 378-3, 4.5, Anmerkung 1)', type: FIELD_TYPES.SELECT, options: technicalRoomAdverseConditionsOptions, visibleWhen: needsTechnicalRoomHoodDetails },
    { key: 'technicalRoomExhaustHoodFlowRateM3s', label: 'Luftwechselrate je Abzugshaube', type: FIELD_TYPES.DECIMAL, unit: 'm³/s', visibleWhen: needsTechnicalRoomHoodDetails },
    { key: 'technicalRoomVentilationActivatesDetector', label: 'Lüftung wird durch Kältemittel-Detektor aktiviert', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: needsTechnicalRoomHoodDetails }
  ],
  groups: [
    { title: 'Importierter Anlagenstand', fields: ['importedSystemName', 'importFGasesSystem', 'fGasesSnapshotId', 'importNotice', 'importStatusMessage', 'refrigerantId', 'chargeKg', 'chargeScopeInfo'], columns: 2, accent: 'blue' },
    { title: 'Raum und Aufstellung', fields: ['roomVolumeM3', 'installationLocation', 'installationClass', 'classIiCompressorsOutsideOrMachineryRoom', 'accessArea', 'accessCategoryInfo', 'accessCategory', 'usageType', 'applicationType', 'locationLevel', 'isBasementLocation', 'machineryRoomRiskAnalysisStatus', 'machineryRoomRiskAnalysisResult', 'machineryRoomRiskAnalysisNotes'], columns: 2, accent: 'blue' },
    { title: 'Raum ohne Personenaufenthalt (EN 378-3, 4.5)', fields: ['technicalRoomSeparatedFromOccupiedSpaces', 'technicalRoomNotSeparatedNotice', 'technicalRoomContainsCompressorOrPressureVessel', 'technicalRoomComponentsHaveDetachableJoints', 'technicalRoomAdverseConditions', 'technicalRoomExhaustHoodFlowRateM3s', 'technicalRoomVentilationActivatesDetector'], columns: 2, accent: 'blue' },
    { title: 'Detailfragen zur Füllmengenbewertung', fields: ['occupantDensityBelowOnePer10m2', 'hasEmergencyExits', 'isPermanentlySealedSorptionSystem', 'usesAlternativeRiskManagement', 'alternativeRiskManagementInfo', 'floorAreaM2', 'isFactorySealed', 'mountingType', 'c3FactoryBuiltConnections', 'c3NoValvesOrConsumerConnections', 'c3PipingProtected', 'c3DoorsNotTightClosing'], columns: 2, accent: 'blue' },
    { title: 'Lüftung und Sicherheitskomponenten', fields: ['ventilationType', 'limitInfo', 'hasGasWarningSystem', 'machineryRoomOccupied', 'machineryRoomRequiredAirChangeAchievable', 'machineryRoomLargestSystemChargeKg', 'hasEmergencyVentilation', 'hasEmergencyVentilationControlOutside', 'hasEmergencyVentilationControlInside', 'hasDetector', 'hasAlarm', 'hasIndependentAlarmPower', 'hasSafetyShutoffValves', 'hasVentilationOpenings', 'hasExplosionProtectedElectricalEquipment', 'machineryRoomEmergencyFanSuitable', 'machineryRoomR717ContainmentProvided', 'machineryRoomR717EyeWashProvided', 'machineryRoomR717EmergencyShowerProvided', 'machineryRoomR717SprinklerInstalled', 'machineryRoomR717SprinklerConditionsConfirmed', 'isOutdoorPublicAccessible', 'isOutdoorDefinitionConfirmed', 'outdoorSafeArrangement', 'outdoorPreventBuildingEntry', 'hasOutdoorProtectiveCover', 'outdoorCoverVentilated', 'outdoorRefrigerantAccumulationPossible', 'outdoorVentilationGeneralConfirmed', 'outdoorVentilationNationalRulesConfirmed', 'outdoorMechanicalVentilationOpeningsConfirmed', 'additionalSafetyMeasures'], columns: 2, accent: 'blue' },
    { title: 'EN 378-2, 6.2.14 – Brand- und Explosionsschutz', fields: ['outdoorEN3782_6_2_14EN60335Applicable', 'outdoorEN3782_6_2_14EN60335Compliant', 'outdoorEN3782_6_2_14EN60335EvidenceReference', 'outdoorEN3782_6_2_14HazardousAreaConfirmed', 'outdoorEN3782_6_2_14HazardousAreaEvidenceReference', 'outdoorEN3782_6_2_14ComponentAssessmentConfirmed', 'outdoorEN3782_6_2_14ComponentAssessmentEvidenceReference', 'outdoorEN3782_6_2_14ProtectionConditionsConfirmed', 'outdoorEN3782_6_2_14ProtectionEvidenceReference', 'outdoorEN3782_6_2_14AirflowProtectionUsed', 'outdoorEN3782_6_2_14AirflowAvailabilityConfirmed', 'outdoorEN3782_6_2_14AirflowInterlockConfirmed', 'outdoorEN3782_6_2_14SurfaceTemperatureConfirmed', 'outdoorEN3782_6_2_14HazardousAreaExceedsEquipment', 'outdoorEN3782_6_2_14EquipmentDocumentationUpdated'], columns: 2, accent: 'blue' },
  ]
});

export default schema;
