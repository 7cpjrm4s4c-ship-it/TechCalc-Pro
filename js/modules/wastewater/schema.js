import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { fmt, fmtInput } from '../../utils/calculations.js';
import { fixtureTypes, usageTypes } from './tables.js';
import { getFixture } from './logic.js';
import { lineFamilyValue, lineVentilationValue } from './lineModel.js';

const fixtureOptions = fixtureTypes.map(item => ({ value: item.id, label: item.name }));
const usageOptions = usageTypes.map(item => ({ value: item.value, label: item.label }));
const yesNoOptions = [{ value:'no', label:'automatisch / nein' }, { value:'yes', label:'ja' }];
const branchOptions = [{ value:'with-radius', label:'mit Innenradius' }, { value:'without-radius', label:'ohne Innenradius' }];
const fillOptions = [{ value:'0.5', label:'h/di 0,5' }, { value:'0.7', label:'h/di 0,7' }, { value:'1.0', label:'h/di 1,0' }];
const lineFamilies = [
  { value:'single', label:'Einzelanschluss' },
  { value:'branch', label:'Anschlussleitung' },
  { value:'stack', label:'Fallleitung' },
  { value:'collector', label:'Sammelleitung' },
  { value:'ground-inside', label:'Grund innen' },
  { value:'ground-outside', label:'Grund außen' }
];
const ventilationOptions = [{ value:'unvented', label:'unbelüftet' }, { value:'vented', label:'belüftet' }];

const isCustomFixture = s => getFixture(s.fixtureType || 'washbasin')?.custom;
const lineFamily = s => lineFamilyValue(s.lineType);
const lineVentilation = s => lineVentilationValue(s.lineType);
const usesVentilationChoice = s => ['single','branch'].includes(lineFamily(s));
const usesFillRatio = s => ['branch-vented','collector','ground-inside','ground-outside'].includes(s.lineType);
const usesBranchType = s => s.lineType === 'stack';
const showLength = s => ['single-unvented','single-vented','branch-unvented'].includes(s.lineType);
const showBends = s => ['single-unvented','branch-unvented','branch-vented'].includes(s.lineType);
const usageK = s => usageTypes.find(item => item.value === s.usageType)?.k;

function fixtureItems(state = {}, context = {}) {
  return (context.result?.fixtures || []).map(item => ({
    id: item.id,
    title: item.name,
    quantity: item.qty,
    subtitle: `ΣDU ${fmt(item.totalDu,1)} l/s · DU/Stk. ${fmt(item.du,1)} l/s · Einzelanschluss ${item.dn || '—'}`
  }));
}

export const wastewaterSchema = defineFormSchema({
  fields: [
    { key:'usageType', label:'Nutzungsart', type:FIELD_TYPES.SELECT, options:usageOptions, commit:'immediate', lookup:true },
    { key:'kStats', label:'K-Wert', type:FIELD_TYPES.STATS, items:s => s.usageType === 'custom' ? [] : [{ label:'K', value:fmt(usageK(s) || 0,1) }], visibleWhen:s => s.usageType !== 'custom' },
    { key:'kValue', label:'Abflusskennzahl K', type:FIELD_TYPES.DECIMAL, visibleWhen:s => s.usageType === 'custom' },
    { key:'lineFamily', label:'Leitungsart', type:FIELD_TYPES.SEGMENT, options:lineFamilies, value:lineFamily, accent:'green' },
    { key:'lineVentilation', label:'Ausführung', type:FIELD_TYPES.SEGMENT, options:ventilationOptions, value:lineVentilation, accent:'green', visibleWhen:usesVentilationChoice },
    { key:'branchType', label:'Abzweigart Fallleitung', type:FIELD_TYPES.SELECT, options:branchOptions, visibleWhen:usesBranchType },
    { key:'fillRatio', label:'Füllungsgrad', type:FIELD_TYPES.SELECT, options:fillOptions, visibleWhen:usesFillRatio },
    { key:'slopeCmM', label:'Gefälle', type:FIELD_TYPES.DECIMAL, unit:'cm/m', default:'1,0' },
    { key:'pipeLengthM', label:'Rohrlänge', type:FIELD_TYPES.DECIMAL, unit:'m', visibleWhen:showLength },
    { key:'bends90', label:'90°-Umlenkungen', type:FIELD_TYPES.INTEGER, unit:'Stk.', visibleWhen:showBends },
    { key:'fixtureType', label:'Gegenstand hinzufügen', type:FIELD_TYPES.SELECT, options:fixtureOptions, commit:'immediate', lookup:true },
    { key:'fixtureQuantity', label:'Anzahl', type:FIELD_TYPES.INTEGER, unit:'Stk.', default:'1' },
    { key:'fixtureCustomName', label:'Bezeichnung', type:FIELD_TYPES.TEXT, placeholder:'z. B. Laborbecken', visibleWhen:isCustomFixture },
    { key:'fixtureCustomDu', label:'DU', type:FIELD_TYPES.DECIMAL, unit:'l/s', visibleWhen:isCustomFixture },
    { key:'fixtureCustomDn', label:'Mindest-DN', type:FIELD_TYPES.TEXT, placeholder:'DN 50', visibleWhen:isCustomFixture },
    { key:'fixtureAdd', label:'Gegenstand hinzufügen', type:FIELD_TYPES.ACTION, text:'Gegenstand hinzufügen', collection:'fixtures', variant:'secondary' },
    { key:'fixtures', label:'Erfasste Entwässerungsgegenstände', type:FIELD_TYPES.COLLECTION, collection:'fixtures', items:fixtureItems, emptyText:'Noch keine Entwässerungsgegenstände hinzugefügt.', quantityLabel:'Anzahl', quantityUnit:'Stk.' },
    { key:'continuousFlow', label:'Dauerabfluss Qc', type:FIELD_TYPES.DECIMAL, unit:'l/s' },
    { key:'pumpFlow', label:'Pumpenförderstrom Qp', type:FIELD_TYPES.DECIMAL, unit:'l/s' },
    { key:'rainFlow', label:'verunreinigtes Niederschlagswasser Qr,a', type:FIELD_TYPES.DECIMAL, unit:'l/s' },
    { key:'hasWc', label:'WC angeschlossen', type:FIELD_TYPES.SELECT, options:yesNoOptions }
  ],
  groups: [
    { title:'Nutzung', fields:['usageType','kStats','kValue'], columns:2, accent:'green' },
    { title:'Leitungsart / Randbedingungen', fields:['lineFamily','lineVentilation','branchType','fillRatio','slopeCmM','pipeLengthM','bends90'], columns:2, accent:'green' },
    { title:'Entwässerungsgegenstände', fields:['fixtureType','fixtureQuantity','fixtureCustomName','fixtureCustomDu','fixtureCustomDn','fixtureAdd','fixtures'], columns:2, accent:'green' },
    { title:'Zusatzabflüsse', fields:['continuousFlow','pumpFlow','rainFlow','hasWc'], columns:2, accent:'green' }
  ]
});

export default wastewaterSchema;
