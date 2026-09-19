import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const bufferStorageSchema = defineFormSchema({
  fields: [
    { key: 'plantName', label: 'Anlagenbezeichnung', type: FIELD_TYPES.TEXT },
    { key: 'calculationMode', label: 'Berechnungsart', type: FIELD_TYPES.SEGMENT, options: [
      { value: 'runtime', label: 'Mindestlaufzeit' },
      { value: 'defrost', label: 'Abtauung' },
      { value: 'reserve', label: 'Reserve' }
    ] },
    { key: 'mediumMode', label: 'Medium', type: FIELD_TYPES.SEGMENT, options: [
      { value: 'water', label: 'Wasser' },
      { value: 'glycol', label: 'Glykol' }
    ] },
    { key: 'glycolType', label: 'Glykolart', type: FIELD_TYPES.SELECT, options: [
      { value: 'ethylene', label: 'Ethylenglykol' },
      { value: 'propylene', label: 'Propylenglykol' }
    ] },
    { key: 'glycolConcentration', label: 'Glykolanteil', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'qMaxKw', label: 'Max. Leistung', type: FIELD_TYPES.DECIMAL, unit: 'kW' },
    { key: 'partLoadFactor', label: 'Teillastfaktor', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'qLoadKw', label: 'Konstante Lastabnahme', type: FIELD_TYPES.DECIMAL, unit: 'kW' },
    { key: 'compressorRunTimeMin', label: 'Mindestlaufzeit', type: FIELD_TYPES.DECIMAL, unit: 'min' },
    { key: 'controllerDeltaT', label: 'Regelband', type: FIELD_TYPES.DECIMAL, unit: 'K' },
    { key: 'existingSystemVolumeL', label: 'Vorhandenes Anlagenvolumen', type: FIELD_TYPES.DECIMAL, unit: 'l' },
    { key: 'qConsumerKw', label: 'Heizleistung aktive Verbraucher', type: FIELD_TYPES.DECIMAL, unit: 'kW' },
    { key: 'qDefrostKw', label: 'Kälteleistung bei Abtauung', type: FIELD_TYPES.DECIMAL, unit: 'kW' },
    { key: 'qHeatingCircuitKw', label: 'Heizleistung verbleibender Kreis', type: FIELD_TYPES.DECIMAL, unit: 'kW' },
    { key: 'maxDefrostTimeMin', label: 'Maximale Abtauzeit', type: FIELD_TYPES.DECIMAL, unit: 'min' },
    { key: 'hydraulicDeltaT', label: 'Hydraulische Temperaturdifferenz', type: FIELD_TYPES.DECIMAL, unit: 'K' },
    { key: 'consumerFlowM3h', label: 'Volumenstrom Verbraucher', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'bridgeTimeMin', label: 'Überbrückungszeit', type: FIELD_TYPES.DECIMAL, unit: 'min' }
  ],
  groups: [
    { title: 'Projekt', fields: ['plantName', 'calculationMode'], columns: 2 },
    { title: 'Medium', fields: ['mediumMode', 'glycolType', 'glycolConcentration'], columns: 2 },
    { title: 'Mindestlaufzeit', fields: ['qMaxKw', 'partLoadFactor', 'qLoadKw', 'compressorRunTimeMin', 'controllerDeltaT', 'existingSystemVolumeL'], columns: 2 },
    { title: 'Abtaubetrieb', fields: ['qConsumerKw', 'qDefrostKw', 'qHeatingCircuitKw', 'maxDefrostTimeMin', 'hydraulicDeltaT', 'existingSystemVolumeL'], columns: 2 },
    { title: 'Wasservorlage', fields: ['consumerFlowM3h', 'bridgeTimeMin'], columns: 2 }
  ]
});

export default bufferStorageSchema;
