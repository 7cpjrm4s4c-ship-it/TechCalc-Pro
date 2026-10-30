import { defineFormSchema, FIELD_TYPES } from '../../core/ui/formSchema.js';
import { numberService } from '../../core/engineering/numberService.js';
import { buildFGasesImportOptions, hasAnyFGasesSavedSystem, hasMultipleFGasesSavedSystems, IMPORT_ACTION } from './importController.js';

const option = (value, label) => Object.freeze({ value, label });
const accessCategoryByAccessArea = Object.freeze({ 'general-access': 'a', 'supervised-access': 'b', 'authorized-access': 'c' });
const isMachineryRoom = state => state.installationLocation === 'machinery-room' || state.hasMachineryRoom === 'yes';
const isOutdoor = state => state.installationLocation === 'outdoor' || ['split-system', 'multi-split'].includes(state.systemConfiguration);
const usesAlternativeRiskManagement = state => state.usesAlternativeRiskManagement === 'yes';
const isHumanComfort = state => state.applicationType === 'human-comfort';
const needsMountingType = state => isHumanComfort(state) && state.isFactorySealed === 'no';
const needsExplosionEquipment = state => isMachineryRoom(state) && ['R-32', 'R32', 'HFKW-32', 'R-717', 'R717', 'R-290', 'R290'].includes(String(state.refrigerantId || ''));
const needsLegacyAccessCategoryField = state => !accessCategoryByAccessArea[state.accessArea] && Boolean(state.accessCategory);

const systemConfigurationOptions = Object.freeze([
  option('', 'Bitte Anlagenart auswählen'),
  option('single-location', 'Kälteanlage mit Komponenten an einem Aufstellort'),
  option('split-system', 'Splitgerät mit Außen- und Inneneinheit'),
  option('multi-split', 'Multi-Split-Anlage mit mehreren Inneneinheiten'),
  option('other', 'Andere Anlagenkonfiguration')
]);
const indoorUnitLocationOptions = Object.freeze([
  option('', 'Bitte Raum der Inneneinheit auswählen'),
  option('occupied-space', 'Personen-Aufenthaltsbereich'),
  option('technical-room', 'Technischer Raum, kein Maschinenraum'),
  option('machinery-room', 'Maschinenraum'),
  option('other', 'Anderer Innenbereich')
]);
const isSplitConfiguration = state => ['split-system', 'multi-split'].includes(state.systemConfiguration);

const installationLocationOptions = Object.freeze([
  option('', 'Bitte Aufstellort auswählen'), option('occupied-space', 'Personen-Aufenthaltsbereich'), option('technical-room', 'Technischer Raum'), option('machinery-room', 'Maschinenraum'), option('outdoor', 'Im Freien (Außenaufstellung)')
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
const mechanicalVentilationModeOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('continuous', 'Dauerbetrieb'),
  option('detector-controlled', 'Detektorgesteuerter Betrieb')
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
    { key: 'chargeKg', label: 'Füllmenge', type: FIELD_TYPES.DECIMAL, unit: 'kg' },
    { key: 'systemConfiguration', label: 'Anlagenkonfiguration', type: FIELD_TYPES.SELECT, options: systemConfigurationOptions },
    { key: 'indoorUnitLocation', label: 'Aufstellbereich der Inneneinheit', type: FIELD_TYPES.SELECT, options: indoorUnitLocationOptions, visibleWhen: isSplitConfiguration },
    { key: 'splitLocationInfo', label: 'Hinweis zur Aufstellortableitung', type: FIELD_TYPES.NOTICE, text: 'Bei Split- und Multi-Split-Anlagen wird der angegebene Bereich der Inneneinheit als maßgeblicher Innenbereich für die weitere Prüfung verwendet. Die Außenaufstellung bleibt für zusätzliche Anforderungen relevant. Eine normative Anlagenklassifikation wird daraus nicht automatisch abgeleitet.', tone: 'compact', visibleWhen: isSplitConfiguration },
    { key: 'roomVolumeM3', label: 'Raumvolumen des maßgeblichen Aufstellbereichs (EN 378-1, Anhang C)', type: FIELD_TYPES.DECIMAL, unit: 'm³', visibleWhen: state => Boolean(state.installationLocation) },
    { key: 'installationLocation', label: 'Aufstellort der Kälteanlage / kältemittelführenden Komponenten (EN 378-1, 4.3)', type: FIELD_TYPES.SELECT, options: installationLocationOptions, visibleWhen: state => !isSplitConfiguration(state) },
    { key: 'installationClass', label: 'Klassifikation des Aufstellungsorts (EN 378-1)', type: FIELD_TYPES.SELECT, options: installationClassOptions, visibleWhen: state => Boolean(state.installationLocation) || (isSplitConfiguration(state) && Boolean(state.indoorUnitLocation)) },
    { key: 'accessArea', label: 'Zugangsbereich (EN 378-1, Kategorie a/b/c)', type: FIELD_TYPES.SELECT, options: accessAreaOptions, visibleWhen: state => Boolean(state.installationLocation) },
    { key: 'accessCategoryInfo', label: 'Hinweis zur Zugangskategorie', type: FIELD_TYPES.NOTICE, text: 'Die Kategorie des Zugangsbereichs wird aus dem gewählten Zugangsbereich abgeleitet und muss nicht zusätzlich ausgewählt werden.', tone: 'compact', visibleWhen: state => Boolean(state.accessArea) },
    { key: 'accessCategory', label: 'Kategorie des Zugangsbereichs', type: FIELD_TYPES.SELECT, options: accessCategoryOptions, visibleWhen: needsLegacyAccessCategoryField },
    { key: 'usageType', label: 'Nutzung des Aufstellbereichs', type: FIELD_TYPES.SELECT, options: usageTypeOptions, visibleWhen: state => Boolean(state.installationLocation) || (isSplitConfiguration(state) && Boolean(state.indoorUnitLocation)) },
    { key: 'applicationType', label: 'Anwendung (menschlicher Komfort / andere Anwendung)', type: FIELD_TYPES.SELECT, options: applicationTypeOptions, visibleWhen: state => Boolean(state.installationLocation) || (isSplitConfiguration(state) && Boolean(state.indoorUnitLocation)) },
    { key: 'locationLevel', label: 'Geschoss oder Lage des Aufstellbereichs', type: FIELD_TYPES.SELECT, options: locationLevelOptions, visibleWhen: state => Boolean(state.installationLocation) || (isSplitConfiguration(state) && Boolean(state.indoorUnitLocation)) },
    { key: 'occupantDensityBelowOnePer10m2', label: 'Personendichte kleiner als eine Person je 10 m²', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => ['b', 'c'].includes(accessCategoryByAccessArea[state.accessArea] || state.accessCategory) },
    { key: 'hasEmergencyExits', label: 'Notausgänge vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => (accessCategoryByAccessArea[state.accessArea] || state.accessCategory) === 'c' },
    { key: 'isPermanentlySealedSorptionSystem', label: 'Dauerhaft geschlossene Sorptionsanlage', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => (accessCategoryByAccessArea[state.accessArea] || state.accessCategory) === 'a' },
    { key: 'usesAlternativeRiskManagement', label: 'Alternative Vorkehrungen nach Anhang C.3 vorgesehen', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'alternativeRiskManagementInfo', label: 'Hinweis zu alternativen Vorkehrungen', type: FIELD_TYPES.NOTICE, text: 'Alternative Vorkehrungen nach Anhang C.3 werden nur bewertet, wenn dieser Pfad vorgesehen ist oder eine Grenzwertüberschreitung dies erfordert. Je nach Konzentration können eine oder zwei Maßnahmen erforderlich sein.', tone: 'compact', visibleWhen: usesAlternativeRiskManagement },
    { key: 'floorAreaM2', label: 'Grundfläche des Aufstellraums', type: FIELD_TYPES.DECIMAL, unit: 'm²', visibleWhen: state => Boolean(state.installationLocation) || (isSplitConfiguration(state) && Boolean(state.indoorUnitLocation)), format: value => value === '' || value === null || value === undefined ? '' : numberService.format(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { key: 'isFactorySealed', label: 'Werkseitig dauerhaft geschlossen', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isHumanComfort },
    { key: 'mountingType', label: 'Montageart', type: FIELD_TYPES.SELECT, options: mountingTypeOptions, visibleWhen: needsMountingType },
    { key: 'ventilationType', label: 'Lüftung', type: FIELD_TYPES.SELECT, options: ventilationTypeOptions },
    { key: 'limitInfo', label: 'Hinweis zu Grenzwerten', type: FIELD_TYPES.NOTICE, text: 'RCL ist der Kältemittel-Konzentrationsgrenzwert. QLMV beschreibt den Grenzwert für Mindestlüftung. QLAV beschreibt den Grenzwert für zusätzliche Lüftung. Diese Werte werden nur angezeigt, wenn sie für die Bewertung benötigt werden.', tone: 'compact', visibleWhen: usesAlternativeRiskManagement },
    { key: 'hasGasWarningSystem', label: 'Gaswarnsystem vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'hasMachineryRoom', label: 'Maschinenraum vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'hasMechanicalVentilation', label: 'Mechanische Lüftung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: state => isMachineryRoom(state) || usesAlternativeRiskManagement(state) },
    { key: 'mechanicalVentilationMode', label: 'Betriebsart der mechanischen Lüftung', type: FIELD_TYPES.SELECT, options: mechanicalVentilationModeOptions, visibleWhen: state => usesAlternativeRiskManagement(state) && state.hasMechanicalVentilation === 'yes' },
    { key: 'hasEmergencyVentilation', label: 'Mechanische Notlüftung vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions, visibleWhen: isMachineryRoom },
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
    { key: 'additionalSafetyMeasures', label: 'Weitere Sicherheitsmaßnahmen', type: FIELD_TYPES.TEXT }
  ],
  groups: [
    { title: 'Importierter Anlagenstand', fields: ['importedSystemName', 'importFGasesSystem', 'fGasesSnapshotId', 'importNotice', 'importStatusMessage', 'refrigerantId', 'chargeKg'], columns: 2, accent: 'blue' },
    { title: 'Anlagenkonfiguration', fields: ['systemConfiguration', 'indoorUnitLocation', 'splitLocationInfo'], columns: 2, accent: 'blue' },
    { title: 'Anwendungsfall und Aufstellort – DIN EN 378-1, Abschnitt 4.3', fields: ['installationLocation', 'roomVolumeM3', 'floorAreaM2', 'installationClass', 'accessArea', 'accessCategoryInfo', 'accessCategory', 'usageType', 'applicationType', 'locationLevel'], columns: 2, accent: 'blue' },
    { title: 'Anwendungsabhängige Prüffragen – DIN EN 378-1, Anhang C', fields: ['occupantDensityBelowOnePer10m2', 'hasEmergencyExits', 'isPermanentlySealedSorptionSystem', 'usesAlternativeRiskManagement', 'alternativeRiskManagementInfo', 'isFactorySealed', 'mountingType'], columns: 2, accent: 'blue' },
    { title: 'Schutzmaßnahmen – DIN EN 378-3, Abschnitte 6.3, 7.3 und 9; DIN EN 378-1, Anhang C.3', fields: ['ventilationType', 'limitInfo', 'hasGasWarningSystem', 'hasMachineryRoom', 'hasMechanicalVentilation', 'mechanicalVentilationMode', 'hasEmergencyVentilation', 'hasEmergencyStopOutside', 'hasEmergencyStopInside', 'hasEmergencyLighting', 'hasDetector', 'hasAlarm', 'hasIndependentAlarmPower', 'hasSafetyShutoffValves', 'hasVentilationOpenings', 'hasExplosionProtectedElectricalEquipment', 'isOutdoorPublicAccessible', 'additionalSafetyMeasures'], columns: 2, accent: 'blue' }
  ]
});

export default schema;
