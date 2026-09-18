import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

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
    { key: 'safetyValveBar', label: 'Sicherheitsventil', type: FIELD_TYPES.DECIMAL, unit: 'bar' }
  ],
  groups: [
    { title: 'Projekt', fields: ['plantName', 'systemType', 'holdingType'], columns: 2 },
    { title: 'Anlage', fields: ['heatPowerKw', 'systemVolumeL', 'specificWaterContent', 'tMaxC', 'tMinC'], columns: 2 },
    { title: 'Druckniveau', fields: ['staticHeightM', 'safetyValveBar'], columns: 2 }
  ]
});

export default pressureHoldingSchema;
