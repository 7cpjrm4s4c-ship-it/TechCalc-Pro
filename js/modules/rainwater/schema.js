import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { areaTypes } from './tables.js';

const areaOptions = areaTypes.map(item => ({ value: item.id, label: item.name }));

export const rainwaterSchema = defineFormSchema({
  fields: [
    { key: 'name', label: 'Berechnungsname', type: FIELD_TYPES.TEXT, placeholder: 'z. B. Dachfläche Halle 1' },
    { key: 'surfaceMode', label: 'Bereich', type: FIELD_TYPES.SEGMENT, options: [
      { value: 'roof', label: 'Dach' },
      { value: 'property', label: 'Grundstück' }
    ] },
    { key: 'areaName', label: 'Flächenbezeichnung', type: FIELD_TYPES.TEXT, placeholder: 'z. B. Dach Nord' },
    { key: 'areaSize', label: 'Fläche', type: FIELD_TYPES.DECIMAL, unit: 'm²', default: '100' },
    { key: 'areaType', label: 'Flächentyp', type: FIELD_TYPES.SELECT, options: areaOptions },
    { key: 'roofRainIntensity', label: 'Regenspende Dach', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)', default: '300' },
    { key: 'propertyRainIntensity', label: 'Regenspende Grundstück', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)', default: '300' },
    { key: 'fillRatio', label: 'Füllungsgrad', type: FIELD_TYPES.DECIMAL, default: '0,7' },
    { key: 'slopeCmM', label: 'Gefälle', type: FIELD_TYPES.DECIMAL, unit: 'cm/m', default: '1,0' },
    { key: 'drainSize', label: 'Nennweite', type: FIELD_TYPES.TEXT, default: 'DN 100' }
  ],
  groups: [
    { title: 'Projekt', fields: ['name', 'surfaceMode'], columns: 2 },
    { title: 'Fläche', fields: ['areaName', 'areaSize', 'areaType'], columns: 2 },
    { title: 'Bemessung', fields: ['roofRainIntensity', 'propertyRainIntensity', 'fillRatio', 'slopeCmM', 'drainSize'], columns: 2 }
  ]
});

export default rainwaterSchema;
