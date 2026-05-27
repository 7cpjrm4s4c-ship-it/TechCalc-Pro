import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { fixtureTypes, usageTypes } from './tables.js';

export const wastewaterSchema = defineFormSchema({
  fields: [
    { key: 'name', label: 'Berechnungsname', type: FIELD_TYPES.TEXT, placeholder: 'z. B. Strang A' },
    { key: 'usageType', label: 'Nutzungsart', type: FIELD_TYPES.SELECT, options: usageTypes.map(item => ({ value: item.value, label: item.label })) },
    { key: 'lineType', label: 'Leitungsart', type: FIELD_TYPES.SELECT, options: [
      { value: 'single-unvented', label: 'Einzelanschluss unbelüftet' },
      { value: 'single-vented', label: 'Einzelanschluss belüftet' },
      { value: 'branch-unvented', label: 'Anschlussleitung unbelüftet' },
      { value: 'branch-vented', label: 'Anschlussleitung belüftet' },
      { value: 'stack', label: 'Fallleitung' },
      { value: 'collector', label: 'Sammelleitung' },
      { value: 'ground-inside', label: 'Grundleitung innen' },
      { value: 'ground-outside', label: 'Grundleitung außen' }
    ] },
    { key: 'fixtureType', label: 'Entwässerungsgegenstand', type: FIELD_TYPES.SELECT, options: fixtureTypes.map(item => ({ value: item.id, label: item.name })) },
    { key: 'fixtureQuantity', label: 'Anzahl', type: FIELD_TYPES.INTEGER, default: '1' },
    { key: 'kValue', label: 'K-Wert', type: FIELD_TYPES.DECIMAL, default: '0,5' },
    { key: 'fillRatio', label: 'Füllungsgrad', type: FIELD_TYPES.DECIMAL, default: '0,5' },
    { key: 'slopeCmM', label: 'Gefälle', type: FIELD_TYPES.DECIMAL, unit: 'cm/m', default: '1,0' }
  ],
  groups: [
    { title: 'Projekt', fields: ['name', 'usageType'], columns: 2 },
    { title: 'Leitung', fields: ['lineType', 'kValue', 'fillRatio', 'slopeCmM'], columns: 2 },
    { title: 'Entwässerungsgegenstand', fields: ['fixtureType', 'fixtureQuantity'], columns: 2 }
  ]
});

export default wastewaterSchema;
