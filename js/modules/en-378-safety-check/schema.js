import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

const option = (value, label) => Object.freeze({ value, label });

const installationLocationOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('occupied-space', 'Aufenthaltsbereich'),
  option('technical-room', 'Technischer Raum'),
  option('machinery-room', 'Maschinenraum'),
  option('outdoor', 'Außenaufstellung')
]);

const installationClassOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('I', 'Klasse I – belüftetes Gehäuse'),
  option('II', 'Klasse II – Maschinenraum oder im Freien'),
  option('III', 'Klasse III – Verdichter in Maschinenraum oder im Freien'),
  option('IV', 'Klasse IV – mechanische Geräte im Personen-Aufenthaltsbereich')
]);

const accessAreaOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('general-access', 'Allgemeiner Zugang'),
  option('supervised-access', 'Beaufsichtigter Zugang'),
  option('authorized-access', 'Nur unterwiesene / befugte Personen')
]);

const accessCategoryOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('a', 'a – Allgemeiner Zugangsbereich'),
  option('b', 'b – Überwachter Zugangsbereich'),
  option('c', 'c – Zugang nur für befugte Personen')
]);

const usageTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('residential', 'Wohnen'),
  option('commercial', 'Gewerbe'),
  option('industrial', 'Industrie'),
  option('public', 'Öffentlich zugänglicher Bereich')
]);

const applicationTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('human-comfort', 'Menschlicher Komfort'),
  option('other', 'Andere Anwendung')
]);

const locationLevelOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('other', 'Andere Lage'),
  option('upper-no-emergency-exit-or-basement', 'Oberes Geschoss ohne Notausgang oder Kellergeschoss'),
  option('underground', 'Unterirdisch'),
  option('deepest-underground', 'Tiefstes unterirdisches Geschoss')
]);

const mountingTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('floor', 'Aufstellung auf dem Boden'),
  option('wall', 'Wandmontage'),
  option('window', 'Fenstermontage'),
  option('ceiling', 'Deckenmontage')
]);

const ventilationTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('natural', 'Natürliche Lüftung'),
  option('mechanical', 'Mechanische Lüftung'),
  option('none', 'Keine gesicherte Lüftung')
]);

const yesNoOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('yes', 'Ja'),
  option('no', 'Nein')
]);

const schema = defineFormSchema({
  version: 1,
  fields: [
    { key: 'importedSystemName', label: 'Importierte Anlage', type: FIELD_TYPES.READONLY },
    { key: 'refrigerantId', label: 'Kältemittel', type: FIELD_TYPES.SELECT, options: [] },
    { key: 'chargeKg', label: 'Füllmenge', type: FIELD_TYPES.DECIMAL, unit: 'kg' },
    { key: 'roomVolumeM3', label: 'Raumvolumen', type: FIELD_TYPES.DECIMAL, unit: 'm³' },
    { key: 'installationLocation', label: 'Aufstellort', type: FIELD_TYPES.SELECT, options: installationLocationOptions },
    { key: 'installationClass', label: 'Aufstellungsort-Klassifikation', type: FIELD_TYPES.SELECT, options: installationClassOptions },
    { key: 'accessArea', label: 'Zugangsbereich', type: FIELD_TYPES.SELECT, options: accessAreaOptions },
    { key: 'accessCategory', label: 'Kategorie des Zugangsbereichs', type: FIELD_TYPES.SELECT, options: accessCategoryOptions },
    { key: 'usageType', label: 'Nutzung', type: FIELD_TYPES.SELECT, options: usageTypeOptions },
    { key: 'applicationType', label: 'Anwendungsart', type: FIELD_TYPES.SELECT, options: applicationTypeOptions },
    { key: 'locationLevel', label: 'Geschoss / Lage', type: FIELD_TYPES.SELECT, options: locationLevelOptions },
    { key: 'occupantDensityBelowOnePer10m2', label: 'Personendichte < 1 Person je 10 m²', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'hasEmergencyExits', label: 'Notausgänge vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'isPermanentlySealedSorptionSystem', label: 'Dauerhaft geschlossene Sorptionsanlage', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'usesAlternativeRiskManagement', label: 'Alternative Vorkehrungen nach C.3 vorgesehen', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'floorAreaM2', label: 'Raumfläche', type: FIELD_TYPES.DECIMAL, unit: 'm²' },
    { key: 'mountingType', label: 'Montageart', type: FIELD_TYPES.SELECT, options: mountingTypeOptions },
    { key: 'isFactorySealed', label: 'Werkseitig dauerhaft geschlossen', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'ventilationType', label: 'Lüftung', type: FIELD_TYPES.SELECT, options: ventilationTypeOptions },
    { key: 'hasGasWarningSystem', label: 'Gaswarnsystem vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'hasMachineryRoom', label: 'Maschinenraum vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'additionalSafetyMeasures', label: 'Weitere Sicherheitsmaßnahmen', type: FIELD_TYPES.TEXT }
  ],
  groups: [
    { title: 'Importierter Anlagenstand', fields: ['importedSystemName', 'refrigerantId', 'chargeKg'], columns: 2, accent: 'blue' },
    { title: 'Raum und Aufstellung', fields: ['roomVolumeM3', 'installationLocation', 'installationClass', 'accessArea', 'accessCategory', 'usageType', 'applicationType', 'locationLevel'], columns: 2, accent: 'blue' },
    { title: 'Detailfragen zur Füllmengenbewertung', fields: ['occupantDensityBelowOnePer10m2', 'hasEmergencyExits', 'isPermanentlySealedSorptionSystem', 'usesAlternativeRiskManagement', 'floorAreaM2', 'mountingType', 'isFactorySealed'], columns: 2, accent: 'blue' },
    { title: 'Lüftung und Schutzmaßnahmen', fields: ['ventilationType', 'hasGasWarningSystem', 'hasMachineryRoom', 'additionalSafetyMeasures'], columns: 2, accent: 'blue' }
  ]
});

export default schema;
