import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const unitConverterSchema = defineFormSchema({
  fields: [
    { key: 'category', label: 'Kategorie', type: FIELD_TYPES.SELECT, options: [
      { value: 'pressure', label: 'Druck' },
      { value: 'flow', label: 'Volumenstrom' },
      { value: 'power', label: 'Leistung' },
      { value: 'temperature', label: 'Temperatur' }
    ] },
    { key: 'value', label: 'Wert', type: FIELD_TYPES.DECIMAL },
    { key: 'from', label: 'Von', type: FIELD_TYPES.TEXT },
    { key: 'to', label: 'Nach', type: FIELD_TYPES.TEXT }
  ],
  groups: [
    { title: 'Umrechnung', fields: ['category', 'value', 'from', 'to'], columns: 2 }
  ]
});

export default unitConverterSchema;
