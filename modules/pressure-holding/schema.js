import { defineFormSchema, FIELD_TYPES } from '../../core/ui/formSchema.js';

export const pressureHoldingSchema = defineFormSchema({
  fields: [
    { key: 'plantName', label: 'Anlagenbezeichnung', type: FIELD_TYPES.TEXT },
    { key: 'systemType', label: 'System', type: FIELD_TYPES.SEGMENT, options: [{ value: 'heating', label: 'Heizung' }, { value: 'cooling', label: 'Kälte' }] },
    { key: 'holdingType', label: 'Druckhaltung', type: FIELD_TYPES.SELECT, options: [{ value: 'mag', label: 'MAG' }, { value: 'dynamic', label: 'Dynamisch' }] },
    { key: 'heatPowerKw', label: 'Leistung', type: FIELD_TYPES.DECIMAL, unit: 'kW' },
    { key: 'systemVolumeL', label: 'Anlageninhalt', type: FIELD_TYPES.DECIMAL, unit: 'l' },
    { key: 'specificWaterContent', label: 'Spez. Wasserinhalt', type: FIELD_TYPES.DECIMAL, unit: 'l/kW' },
    { key: 'tMaxC', label: 'Max. Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'tMinC', label: 'Min. Temperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'staticHeightM', label: 'Statische Höhe', type: FIELD_TYPES.DECIMAL, unit: 'm' },
    { key: 'safetyValveBar', label: 'Sicherheitsventil', type: FIELD_TYPES.DECIMAL, unit: 'bar' },
    { key: 'useServitec', label: 'Servitec verwenden', type: FIELD_TYPES.SEGMENT, options: [{ value: 'true', label: 'Ja' }, { value: 'false', label: 'Nein' }], default: 'true' },
    { key: 'servitecType', label: 'Servitec-Typ', type: FIELD_TYPES.SELECT, options: [
      { value: 'auto', label: 'Automatik' },
      { value: 'mini', label: 'Servitec Mini' },
      { value: 's', label: 'Servitec S' },
      { value: '35', label: 'Servitec 35' },
      { value: '60', label: 'Servitec 60' },
      { value: '75', label: 'Servitec 75' },
      { value: '95', label: 'Servitec 95' },
      { value: '120t', label: 'Servitec 120 T' }
    ] },
    { key: 'feedType', label: 'Nachspeisung', type: FIELD_TYPES.SEGMENT, options: [{ value: 'manual', label: 'Manuell' }, { value: 'auto', label: 'Automatisch' }] },
    { key: 'feedPressureBar', label: 'Fließdruck vor Nachspeisung', type: FIELD_TYPES.DECIMAL, unit: 'bar' },
    { key: 'systemSeparation', label: 'Systemtrennung', type: FIELD_TYPES.SELECT, options: [
      { value: 'systemSeparator', label: 'DVGW-geprüfter Systemtrenner' },
      { value: 'networkSeparator', label: 'Netztrennbehälter' }
    ] },
    { key: 'feedLineLengthM', label: 'Länge Nachspeiseleitung', type: FIELD_TYPES.DECIMAL, unit: 'm' },
    { key: 'waterTreatmentMethod', label: 'Verfahren', type: FIELD_TYPES.SELECT, options: [
      { value: 'softening', label: 'Enthärtung' },
      { value: 'desalination', label: 'Entsalzung' }
    ] },
    { key: 'regionalWaterHardness', label: 'regionale Gesamtwasserhärte GHst', type: FIELD_TYPES.DECIMAL, unit: '°dH' }
  ],
  groups: [
    { title: 'Projekt', fields: ['plantName', 'systemType', 'holdingType'], columns: 2 },
    { title: 'Anlage', fields: ['heatPowerKw', 'systemVolumeL', 'specificWaterContent', 'tMaxC', 'tMinC'], columns: 2 },
    { title: 'Druckniveau', fields: ['staticHeightM', 'safetyValveBar'], columns: 2 },
    { title: 'Entgasung', fields: ['useServitec', 'servitecType'], columns: 2 },
    { title: 'Nachspeisung', fields: ['feedType', 'feedPressureBar', 'systemSeparation', 'feedLineLengthM'], columns: 2 },
    { title: 'Wasseraufbereitung', fields: ['waterTreatmentMethod', 'regionalWaterHardness'], columns: 2 },

  ]
});

export default pressureHoldingSchema;
