import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { PROCESS_OPTIONS } from './logic.js';

export const hxDiagramSchema = defineFormSchema({
  fields: [
    { key: 'label', label: 'Bezeichnung', type: FIELD_TYPES.TEXT },
    { key: 'tempC', label: 'Starttemperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'rhPercent', label: 'Relative Feuchte Start', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'targetTempC', label: 'Zieltemperatur', type: FIELD_TYPES.DECIMAL, unit: '°C' },
    { key: 'targetRhPercent', label: 'Relative Feuchte Ziel', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'process', label: 'Prozess', type: FIELD_TYPES.SELECT, options: PROCESS_OPTIONS.map(item => ({ value: item.value, label: item.label })) }
  ],
  groups: [
    { title: 'Prozess', fields: ['label', 'process'], columns: 2 },
    { title: 'Ausgang und Ziel', fields: ['tempC', 'rhPercent', 'targetTempC', 'targetRhPercent'], columns: 2 }
  ]
});

export default hxDiagramSchema;
