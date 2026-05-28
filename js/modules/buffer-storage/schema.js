import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const bufferStorageSchema = defineFormSchema({
  fields: [
    { key: 'plantName', label: 'Anlagenbezeichnung', type: FIELD_TYPES.TEXT },
    { key: 'calculationMode', label: 'Berechnungsart', type: FIELD_TYPES.SEGMENT, options: [
      { value: 'runtime', label: 'Mindestlaufzeit' },
      { value: 'defrost', label: 'Abtauung' },
      { value: 'reserve', label: 'Reserve' },
      { value: 'compare', label: 'Vergleich' }
    ] },
    { key: 'mediumMode', label: 'Medium', type: FIELD_TYPES.SEGMENT, options: [{ value: 'water', label: 'Wasser' }, { value: 'glycol', label: 'Glykol' }] },
    { key: 'glycolConcentration', label: 'Glykolanteil', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'qMaxKw', label: 'Max. Leistung', type: FIELD_TYPES.DECIMAL, unit: 'kW' },
    { key: 'partLoadFactor', label: 'Teillastfaktor', type: FIELD_TYPES.DECIMAL },
    { key: 'compressorRunTimeMin', label: 'Mindestlaufzeit', type: FIELD_TYPES.DECIMAL, unit: 'min' },
    { key: 'controllerDeltaT', label: 'Regelband', type: FIELD_TYPES.DECIMAL, unit: 'K' },
    { key: 'existingSystemVolumeL', label: 'Vorhandenes Anlagenvolumen', type: FIELD_TYPES.DECIMAL, unit: 'l' }
  ],
  groups: [
    { title: 'Projekt', fields: ['plantName', 'calculationMode'], columns: 2 },
    { title: 'Medium', fields: ['mediumMode', 'glycolConcentration'], columns: 2 },
    { title: 'Mindestlaufzeit', fields: ['qMaxKw', 'partLoadFactor', 'compressorRunTimeMin', 'controllerDeltaT', 'existingSystemVolumeL'], columns: 2 }
  ]
});

export default bufferStorageSchema;
