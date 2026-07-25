import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { PROCESS_OPTIONS } from './logic.js';

export const hxDiagramSchema = defineFormSchema({
  fields: [
    { key: 'label', label: 'Bezeichnung', type: FIELD_TYPES.TEXT },
    { key: 'airVolumeM3h', label: 'Luftmenge', type: FIELD_TYPES.DECIMAL, unit: 'm³/h' },
    { key: 'tempC', label: 'Starttemperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'rhPercent', label: 'Relative Feuchte Start', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'targetTempC', label: 'Zieltemperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'targetRhPercent', label: 'Relative Feuchte Ziel', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'heatingSupplyTempC', label: 'Heizung Vorlauf', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'heatingReturnTempC', label: 'Heizung Rücklauf', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'coolingSupplyTempC', label: 'Kühlung Vorlauf', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'coolingReturnTempC', label: 'Kühlung Rücklauf', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'process', label: 'Prozess', type: FIELD_TYPES.SELECT, options: PROCESS_OPTIONS.map(item => ({ value: item.value, label: item.label })) }
  ],
  groups: [
    { title: 'Prozess', fields: ['label', 'process', 'airVolumeM3h'], columns: 2 },
    { title: 'Ausgang und Ziel', fields: ['tempC', 'rhPercent', 'targetTempC', 'targetRhPercent'], columns: 2 },
    { title: 'Systemtemperaturen', fields: ['heatingSupplyTempC', 'heatingReturnTempC', 'coolingSupplyTempC', 'coolingReturnTempC'], columns: 2 }
  ]
});

export default hxDiagramSchema;