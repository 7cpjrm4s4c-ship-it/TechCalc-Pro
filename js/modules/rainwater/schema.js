import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { inlineStats, esc } from '../../core/renderer.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { toNumber } from './logic.js';
import { areaTypes, roofDrainTable } from './tables.js';

const KOSTRA_URL = 'https://www.openko.de';
const splitIndex = areaTypes.findIndex(item => item.id === 'concrete-asphalt');
const customAreaTypes = areaTypes.filter(item => item.custom);
const roofAreaTypes = areaTypes.filter((item, idx) => !item.custom && (splitIndex < 0 || idx < splitIndex));
const propertyAreaTypes = areaTypes.filter((item, idx) => !item.custom && (splitIndex < 0 || idx >= splitIndex));

export const areaOptionsForMode = mode => (mode === 'property' ? propertyAreaTypes : roofAreaTypes)
  .concat(customAreaTypes)
  .map(item => ({ value:item.id, label:item.name }));

export const defaultAreaTypeForMode = mode => (mode === 'property' ? 'concrete-asphalt' : 'metal-roof');

export const normalizeAreaType = (mode, areaType) => {
  const allowed = areaOptionsForMode(mode).map(item => item.value);
  return allowed.includes(areaType) ? areaType : defaultAreaTypeForMode(mode);
};

const mode = state => state.surfaceMode || state.calculationType || 'roof';
const areaType = state => normalizeAreaType(mode(state), state.areaType || defaultAreaTypeForMode(mode(state)));
const selectedArea = state => areaTypes.find(item => item.id === areaType(state));
const rainLabel = state => mode(state) === 'property' ? 'Regenspende r(5,2)' : 'Regenspende r(5,5)';
const activeRainField = state => mode(state) === 'property' ? 'propertyRainIntensity' : 'roofRainIntensity';
const activeRainValue = state => mode(state) === 'property'
  ? (state.propertyRainIntensity || state.rainIntensity || '300')
  : (state.roofRainIntensity || state.rainIntensity || '300');
const drainLabel = state => mode(state) === 'property' ? 'Vorwahl Hoftopf' : 'Vorwahl Dacheinlauf';
const selectedDrainPreset = state => roofDrainTable.find(item => item.dn === (state.drainSize || 'DN 100')) || roofDrainTable.find(item => item.dn === 'DN 100') || roofDrainTable[0];
const fmtDecimalInput = (value, digits = 1) => {
  if (value === '' || value === null || value === undefined) return '';
  const n = toNumber(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const drainOptions = roofDrainTable.map(item => ({ value:item.dn, label:`${item.dn} · ${String(item.capacity).replace('.', ',')} l/s · ${item.head} mm Anstauhöhe` }));
const emergencyTypeOptions = [
  { value:'rect', label:'Rechteckiger Notüberlauf' },
  { value:'round', label:'Runder Notüberlauf' },
  { value:'manual', label:'Herstellerwert / freie Eingabe' }
];

export const rainwaterSchema = defineFormSchema({
  fields: [
    { key:'surfaceMode', label:'Berechnungsbereich', type:FIELD_TYPES.SEGMENT, options:[{ value:'roof', label:'Dachfläche' }, { value:'property', label:'Grundstücksfläche' }], accent:'green' },
    { key:'roofRainIntensity', label:rainLabel, type:FIELD_TYPES.DECIMAL, unit:'l/(s·ha)', format:(_, s) => fmtInput(activeRainValue(s), 1), visibleWhen:s => activeRainField(s) === 'roofRainIntensity' },
    { key:'propertyRainIntensity', label:rainLabel, type:FIELD_TYPES.DECIMAL, unit:'l/(s·ha)', format:(_, s) => fmtInput(activeRainValue(s), 1), visibleWhen:s => activeRainField(s) === 'propertyRainIntensity' },
    { key:'rainHundredIntensity', label:'Regenspende r(5,100)', type:FIELD_TYPES.DECIMAL, unit:'l/(s·ha)', default:'500' },
    { key:'drainSize', label:drainLabel, type:FIELD_TYPES.SELECT, options:drainOptions, default:'DN 100', commit:'immediate', lookup:true, render:'defer' },
    { key:'drainSizeManual', label:'DN manuell', type:FIELD_TYPES.TEXT, placeholder:'DN 100', format:(value, s) => value || s.drainSize || selectedDrainPreset(s)?.dn || 'DN 100' },
    { key:'drainCapacity', label:'Abflusswert', type:FIELD_TYPES.DECIMAL, unit:'l/s', readonly:true, format:(value, s) => fmtInput(value || selectedDrainPreset(s)?.capacity, 1) },
    { key:'drainHead', label:'Anstauhöhe', type:FIELD_TYPES.DECIMAL, unit:'mm', readonly:true, format:(value, s) => fmtInput(value || selectedDrainPreset(s)?.head, 0) },
    { key:'stackCount', label:'Anzahl Fallleitungen', type:FIELD_TYPES.INTEGER, unit:'Stk.', visibleWhen:s => mode(s) === 'roof' },
    { key:'emergencyType', label:'Art Notentwässerung', type:FIELD_TYPES.SELECT, options:emergencyTypeOptions, commit:'immediate', lookup:true, visibleWhen:s => mode(s) === 'roof' },
    { key:'emergencyHead', label:'Druckhöhe / Anstauhöhe', type:FIELD_TYPES.DECIMAL, unit:'mm', default:'35', visibleWhen:s => mode(s) === 'roof' },
    { key:'emergencyWidth', label:'Überlaufbreite je Notüberlauf Lw', type:FIELD_TYPES.DECIMAL, unit:'mm', default:'300', visibleWhen:s => mode(s) === 'roof' && (s.emergencyType || 'rect') === 'rect' },
    { key:'emergencyDiameter', label:'Durchmesser rund', type:FIELD_TYPES.DECIMAL, unit:'mm', default:'100', visibleWhen:s => mode(s) === 'roof' && s.emergencyType === 'round' },
    { key:'emergencyManufacturerDn', label:'Hersteller-DN', type:FIELD_TYPES.TEXT, placeholder:'DN 100', visibleWhen:s => mode(s) === 'roof' && s.emergencyType === 'manual' },
    { key:'emergencyCapacity', label:'Hersteller-Abflusswert', type:FIELD_TYPES.DECIMAL, unit:'l/s', visibleWhen:s => mode(s) === 'roof' && s.emergencyType === 'manual' },
    { key:'emergencySafetyFactor', label:'Sicherheitsfaktor', type:FIELD_TYPES.DECIMAL, format:value => fmtDecimalInput(value || '1,0', 1), visibleWhen:s => mode(s) === 'roof' },
    { key:'emergencyInfo', label:'Notentwässerung', type:FIELD_TYPES.CUSTOM, render:() => '<div class="empty-state empty-state--compact">Notentwässerung wird nur für Dachflächen vorbemessen.</div>', visibleWhen:s => mode(s) !== 'roof' },
    { key:'areaType', label:'Flächenart', type:FIELD_TYPES.SELECT, options:s => areaOptionsForMode(mode(s)), commit:'immediate', lookup:true },
    { key:'areaSize', label:'Fläche A', type:FIELD_TYPES.DECIMAL, unit:'m²', default:'100' },
    { key:'areaCoefficients', label:'Abflussbeiwerte', type:FIELD_TYPES.CUSTOM, render:s => {
      const selected = selectedArea(s);
      return selected?.custom ? '' : inlineStats([{ label:'Cs', value:fmt(selected?.cs, 2) }, { label:'Cm', value:fmt(selected?.cm, 2) }]);
    }, visibleWhen:s => !selectedArea(s)?.custom },
    { key:'customCs', label:'Spitzenabflussbeiwert Cs', type:FIELD_TYPES.DECIMAL, placeholder:'0,9', visibleWhen:s => selectedArea(s)?.custom },
    { key:'customCm', label:'mittlerer Abflussbeiwert Cm', type:FIELD_TYPES.DECIMAL, placeholder:'0,8', visibleWhen:s => selectedArea(s)?.custom }
  ],
  groups: [
    { title:'Berechnungsbereich', fields:['surfaceMode'], columns:1, accent:'green' },
    { title:'Regenspende', fields:['roofRainIntensity','propertyRainIntensity','rainHundredIntensity'], columns:2, accent:'green', afterHtml:() => `<a class="action-button action-button--secondary tc-action-link" href="${esc(KOSTRA_URL)}" target="_blank" rel="noopener">KOSTRA / OpenKo Daten öffnen</a>` },
    { title:'Dacheinläufe / Hoftöpfe', fields:['drainSize','drainSizeManual','drainCapacity','drainHead','stackCount'], columns:2, accent:'green' },
    { title:'Notentwässerung', fields:['emergencyType','emergencyHead','emergencyWidth','emergencyDiameter','emergencyManufacturerDn','emergencyCapacity','emergencySafetyFactor','emergencyInfo'], columns:2, accent:'green' },
    { title:'Regenfläche', fields:['areaType','areaSize','areaCoefficients','customCs','customCm'], columns:2, accent:'green' }
  ]
});

export default rainwaterSchema;
