import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { MEDIA, fmt } from '../../utils/calculations.js';
import { pipeSystems } from '../../utils/pipes.js';

const calcTargetOptions = [
  { value: 'power', label: 'Q Leistung' },
  { value: 'massFlow', label: 'ṁ Massenstrom' },
  { value: 'deltaT', label: 'ΔT Temperatur' }
];

const massFlowUnitOptions = [
  { value: 'kg/h', label: 'kg/h' },
  { value: 'm3/h', label: 'm³/h' }
];

const mediumFor = id => MEDIA.find(item => item.id === id) || MEDIA[0];
const mediumStats = state => {
  const medium = mediumFor(state.mediumId);
  const rows = [
    { label: 'Dichte ρ', value: fmt(medium.density, 0), unit: 'kg/m³' },
    { label: 'cₚ', value: fmt(medium.cpWhKgK, 3), unit: 'Wh/(kg·K)' }
  ];
  if (medium.frostC !== null && medium.frostC !== undefined) rows.push({ label: 'Frostschutz', value: fmt(medium.frostC, 0), unit: '°C' });
  return rows;
};

export const heatingCoolingSchema = defineFormSchema({
  fields: [
    { key: 'mediumId', label: 'Wärmeträger', type: FIELD_TYPES.SELECT, options: MEDIA.map(item => ({ value: item.id, label: item.label })), lookup: true, commit: 'immediate' },
    { key: 'mediumStats', label: 'Mediumdaten', type: FIELD_TYPES.STATS, items: mediumStats },
    { key: 'mode', label: 'Betriebsart', type: FIELD_TYPES.SEGMENT, options: [{ value: 'heating', label: '● Heizung' }, { value: 'cooling', label: '● Kälte' }] },
    { key: 'pipeSystemId', label: 'Rohrmaterial', type: FIELD_TYPES.SELECT, options: pipeSystems.map(item => ({ value: item.id, label: item.label })), lookup: true, commit: 'immediate' },

    { key: 'heatingCalcTarget', label: 'Berechnung Heizung', type: FIELD_TYPES.SEGMENT, options: calcTargetOptions, visibleWhen: state => state.mode !== 'cooling' },
    { key: 'heatingPowerW', label: 'Heizleistung', type: FIELD_TYPES.DECIMAL, unit: 'W', visibleWhen: state => state.mode !== 'cooling' },
    { key: 'heatingMassFlowKgh', label: 'Massenstrom Heizung', type: FIELD_TYPES.DECIMAL, unit: 'kg/h', visibleWhen: state => state.mode !== 'cooling' },
    { key: 'heatingMassFlowUnit', label: 'Einheit Massenstrom Heizung', type: FIELD_TYPES.SELECT, options: massFlowUnitOptions, commit: 'immediate', visibleWhen: state => state.mode !== 'cooling' },
    { key: 'heatingDeltaT', label: 'ΔT Heizung', type: FIELD_TYPES.DECIMAL, unit: 'K', visibleWhen: state => state.mode !== 'cooling' },

    { key: 'coolingCalcTarget', label: 'Berechnung Kälte', type: FIELD_TYPES.SEGMENT, options: calcTargetOptions, visibleWhen: state => state.mode === 'cooling' },
    { key: 'coolingPowerW', label: 'Kälteleistung', type: FIELD_TYPES.DECIMAL, unit: 'W', visibleWhen: state => state.mode === 'cooling' },
    { key: 'coolingMassFlowKgh', label: 'Massenstrom Kälte', type: FIELD_TYPES.DECIMAL, unit: 'kg/h', visibleWhen: state => state.mode === 'cooling' },
    { key: 'coolingMassFlowUnit', label: 'Einheit Massenstrom Kälte', type: FIELD_TYPES.SELECT, options: massFlowUnitOptions, commit: 'immediate', visibleWhen: state => state.mode === 'cooling' },
    { key: 'coolingDeltaT', label: 'ΔT Kälte', type: FIELD_TYPES.DECIMAL, unit: 'K', visibleWhen: state => state.mode === 'cooling' }
  ],
  groups: [
    { key: 'medium', title: 'Medium', fields: ['mediumId', 'mediumStats'], columns: 2, accent: 'blue' },
    { key: 'operatingMode', title: 'Betriebsart', fields: ['mode'], columns: 1, accent: 'orange' },
    { key: 'heatingInputs', title: 'Heizung — Eingaben', fields: ['heatingCalcTarget', 'heatingPowerW', 'heatingMassFlowKgh', 'heatingMassFlowUnit', 'heatingDeltaT'], columns: 2, accent: 'orange' },
    { key: 'coolingInputs', title: 'Kälte — Eingaben', fields: ['coolingCalcTarget', 'coolingPowerW', 'coolingMassFlowKgh', 'coolingMassFlowUnit', 'coolingDeltaT'], columns: 2, accent: 'cyan' }
  ],
  layout: {
    order: ['medium', 'operatingMode', 'activeInputs', 'result', 'recommendation', 'lineSections']
  }
});

export default heatingCoolingSchema;
