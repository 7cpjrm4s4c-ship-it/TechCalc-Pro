import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

const option = (value, label) => Object.freeze({ value, label });

const installationLocationOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('occupied-space', 'Aufenthaltsbereich'),
  option('technical-room', 'Technischer Raum'),
  option('machinery-room', 'Maschinenraum'),
  option('outdoor', 'Außenaufstellung')
]);

const accessAreaOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('general-access', 'Allgemeiner Zugang'),
  option('supervised-access', 'Beaufsichtigter Zugang'),
  option('authorized-access', 'Nur unterwiesene / befugte Personen')
]);

const usageTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'),
  option('residential', 'Wohnen'),
  option('commercial', 'Gewerbe'),
  option('industrial', 'Industrie'),
  option('public', 'Öffentlich zugänglicher Bereich')
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
    { key: 'accessArea', label: 'Zugangsbereich', type: FIELD_TYPES.SELECT, options: accessAreaOptions },
    { key: 'usageType', label: 'Nutzung', type: FIELD_TYPES.SELECT, options: usageTypeOptions },
    { key: 'ventilationType', label: 'Lüftung', type: FIELD_TYPES.SELECT, options: ventilationTypeOptions },
    { key: 'hasGasWarningSystem', label: 'Gaswarnsystem vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'hasMachineryRoom', label: 'Maschinenraum vorhanden', type: FIELD_TYPES.SELECT, options: yesNoOptions },
    { key: 'additionalSafetyMeasures', label: 'Weitere Sicherheitsmaßnahmen', type: FIELD_TYPES.TEXT }
  ],
  groups: [
    { title: 'Importierter Anlagenstand', fields: ['importedSystemName', 'refrigerantId', 'chargeKg'], columns: 2, accent: 'blue' },
    { title: 'Raum und Aufstellung', fields: ['roomVolumeM3', 'installationLocation', 'accessArea', 'usageType'], columns: 2, accent: 'blue' },
    { title: 'Lüftung und Schutzmaßnahmen', fields: ['ventilationType', 'hasGasWarningSystem', 'hasMachineryRoom', 'additionalSafetyMeasures'], columns: 2, accent: 'blue' }
  ]
});

export default schema;
