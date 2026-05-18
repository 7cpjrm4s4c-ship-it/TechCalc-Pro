import { num } from '../../utils/calculations.js';

export const CONSUMERS = [
  { id:'basin', label:'Waschtisch / Bidet', short:'Waschtisch / Bidet', vr:0.07, pmin:0.10, neGroup:'basin', hotWater:true },
  { id:'kitchenSink', label:'Küchenspüle', short:'Küchenspüle', vr:0.07, pmin:0.10, neGroup:'kitchenSink', hotWater:true },
  { id:'utilitySinkMixer', label:'Ausgussbecken mit Mischbatterie', short:'Ausgussbecken MB', vr:0.15, pmin:0.10, neGroup:'utilitySink', hotWater:true },
  { id:'dishwasher', label:'Geschirrspülmaschine', short:'Geschirrspüler', vr:0.07, pmin:0.05, neGroup:'dishwasher', hotWater:false },
  { id:'wcCistern', label:'WC-Spülkasten', short:'Spülkasten', vr:0.13, pmin:0.05, neGroup:'wc', hotWater:false },
  { id:'bathShower', label:'Mischarmatur Bade-/Duschwanne', short:'Bad/Dusche', vr:0.15, pmin:0.10, neGroup:'bath', hotWater:true },
  { id:'shower', label:'Dusche', short:'Dusche', vr:0.15, pmin:0.10, neGroup:'shower', hotWater:true },
  { id:'washingMachine', label:'Waschmaschine', short:'Waschmaschine', vr:0.15, pmin:0.05, neGroup:'washing', hotWater:false },
  { id:'urinalFlush', label:'Druckspüler Urinal', short:'Urinal-Druckspüler', vr:0.30, pmin:0.10, neGroup:'urinal', hotWater:false },
  { id:'tapRegDn10', label:'Auslaufventil mit Strahlregler DN 10', short:'Auslauf DN10', vr:0.15, pmin:0.10, neGroup:'tapRegDn10', hotWater:false },
  { id:'tapDn15', label:'Auslaufventil ohne Strahlregler DN 15', short:'Auslauf DN15', vr:0.30, pmin:0.05, neGroup:'tapDn15', hotWater:false },
  { id:'tapDn20', label:'Auslaufventil ohne Strahlregler DN 20', short:'Auslauf DN20', vr:0.50, pmin:0.05, neGroup:'tapDn20', hotWater:false },
  { id:'tapDn25', label:'Auslaufventil ohne Strahlregler DN 25', short:'Auslauf DN25', vr:1.00, pmin:0.05, neGroup:'tapDn25', hotWater:false }
];

export const BUILDING_TYPES = [
  { id:'residential', label:'Wohngebäude / Nutzungseinheiten', a:1.48, b:0.19, c:0.94 },
  { id:'hotel', label:'Hotel', a:0.70, b:0.48, c:0.13 },
  { id:'hospital', label:'Bettenhaus Krankenhaus', a:0.75, b:0.44, c:0.18 },
  { id:'school', label:'Schule / Verwaltungsgebäude', a:0.70, b:0.40, c:0.13 },
  { id:'senior', label:'Wohnheim / Seniorenheim', a:0.91, b:0.31, c:0.38 }
];

let usageUnitsMemory = [];
let singleConsumersMemory = [];

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function readUsageUnits() {
  return Array.isArray(usageUnitsMemory) ? clone(usageUnitsMemory) : [];
}
export function writeUsageUnits(items) { usageUnitsMemory = Array.isArray(items) ? clone(items) : []; }
export function readSingleConsumers() {
  return Array.isArray(singleConsumersMemory) ? clone(singleConsumersMemory) : [];
}
export function writeSingleConsumers(items) { singleConsumersMemory = Array.isArray(items) ? clone(items) : []; }

export function consumerById(id) { return CONSUMERS.find(c => c.id === id) || CONSUMERS[0]; }
export function buildingById(id) { return BUILDING_TYPES.find(b => b.id === id) || BUILDING_TYPES[0]; }

export function createConsumer({ typeId, count = 1, name = '', permanent = false }) {
  const type = consumerById(typeId);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name || type.short,
    typeId: type.id,
    label: type.short,
    count: Math.max(1, Math.round(num(count) || 1)),
    vr: type.vr,
    pmin: type.pmin,
    neGroup: type.neGroup,
    hotWater: Boolean(type.hotWater),
    permanent: Boolean(permanent),
    createdAt: new Date().toISOString()
  };
}

export function createUsageUnit({ name, consumer, consumers }) {
  const list = Array.isArray(consumers) && consumers.length ? consumers : consumer ? [consumer] : [];
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name || 'Nutzungseinheit',
    consumers: list,
    createdAt: new Date().toISOString()
  };
}

export function createSingleGroup({ name, consumers }) {
  const list = Array.isArray(consumers) && consumers.length ? consumers : [];
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name || 'Einzelverbraucher',
    consumers: list,
    createdAt: new Date().toISOString()
  };
}

function hotWaterAddon(consumer, mode, index = 0) {
  if (!consumer.hotWater) return [];
  if (mode === 'central') {
    return [{
      ...consumer,
      id: `${consumer.id}-tww-${index}`,
      label: `${consumer.label} TWW`,
      neGroup: `${consumer.neGroup || consumer.typeId}-tww`,
      effectiveRole: 'PWH',
      hotWaterClone:true
    }];
  }
  return [{
    ...consumer,
    id: `${consumer.id}-dezentral-ww-${index}`,
    label: `${consumer.label} WW-Bereitung`,
    vr: 0.05,
    neGroup: `${consumer.neGroup || consumer.typeId}-wwb`,
    effectiveRole: 'WWB',
    hotWaterClone:true,
    decentralizedAddon:true
  }];
}

function unitEffectiveConsumers(unit, mode = 'central') {
  const byGroup = new Map();
  (unit.consumers || []).forEach(consumer => {
    const key = consumer.neGroup || consumer.typeId;
    const existing = byGroup.get(key);
    if (!existing || Number(consumer.vr) > Number(existing.vr)) byGroup.set(key, consumer);
  });

  const topFixtures = [...byGroup.values()]
    .sort((a, b) => Number(b.vr || 0) - Number(a.vr || 0))
    .slice(0, 2);

  const effective = [];
  topFixtures.forEach((consumer, index) => {
    effective.push({ ...consumer, effectiveRole: 'PWC', effectiveIndex: index });
    effective.push(...hotWaterAddon(consumer, mode, index));
  });
  return effective;
}

export function summarizeUsageUnit(unit, warmWaterMode = 'central') {
  const effective = unitEffectiveConsumers(unit, warmWaterMode);
  const effectiveFlow = effective.reduce((sum, c) => sum + Number(c.vr || 0), 0);
  const rawFlow = (unit.consumers || []).reduce((sum, c) => sum + Number(c.vr || 0) * (Number(c.count) || 1), 0);
  return {
    ...unit,
    effectiveConsumers: effective,
    consumerCount: (unit.consumers || []).reduce((sum, c) => sum + (Number(c.count)||1), 0),
    rawFlow,
    sumFlow: effectiveFlow,
    peakFlow: effectiveFlow
  };
}

function normalizeSingleGroups(items = []) {
  return items.map(item => {
    if (Array.isArray(item.consumers)) return item;
    return {
      id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: item.name || item.label || 'Einzelverbraucher',
      consumers: [item],
      createdAt: item.createdAt || new Date().toISOString()
    };
  });
}

function expandConsumersForWarmWater(consumers, warmWaterMode) {
  return consumers.flatMap((consumer, index) => [consumer, ...hotWaterAddon(consumer, warmWaterMode, index)]);
}

function simultaneity(building, sumVr) {
  if (!sumVr) return 0;
  const value = building.a * Math.pow(sumVr, building.b) - building.c;
  return Math.max(0, Math.min(sumVr, value));
}

function recommendHouseConnection(peakLs) {
  const flowM3h = peakLs * 3.6;
  const rows = [
    { limit:2.5, dn:'DN 25', meter:'Q3 4', q3:4 },
    { limit:4.0, dn:'DN 32', meter:'Q3 4', q3:4 },
    { limit:6.3, dn:'DN 32', meter:'Q3 10', q3:10 },
    { limit:10.0, dn:'DN 40', meter:'Q3 16', q3:16 },
    { limit:16.0, dn:'DN 50', meter:'Q3 25', q3:25 },
    { limit:25.0, dn:'DN 65', meter:'Q3 40', q3:40 },
    { limit:40.0, dn:'DN 80', meter:'Q3 63', q3:63 },
    { limit:63.0, dn:'DN 100', meter:'Q3 100', q3:100 }
  ];
  const match = rows.find(r => flowM3h <= r.limit) || rows[rows.length - 1];
  return { ...match, flowM3h };
}

export function calculate(s = {}) {
  const warmWaterMode = s.waterHeatingMode === 'decentral' ? 'decentral' : 'central';
  const centralWarmWater = warmWaterMode === 'central';
  const units = readUsageUnits().map(unit => summarizeUsageUnit(unit, warmWaterMode));
  const singleGroupsRaw = normalizeSingleGroups(readSingleConsumers());
  const singlesRaw = singleGroupsRaw.flatMap(group => (group.consumers || []).map(c => ({ ...c, groupId: group.id, groupName: group.name })));
  const singles = expandConsumersForWarmWater(singlesRaw, warmWaterMode);
  const building = buildingById(s.buildingType);

  const nePeakSum = units.reduce((sum, unit) => sum + unit.peakFlow, 0);
  const neSumFlow = units.reduce((sum, unit) => sum + unit.sumFlow, 0);
  const singleSumFlow = singles.reduce((sum, consumer) => sum + Number(consumer.vr || 0) * (Number(consumer.count) || 1), 0);
  const permanentFlow = singles.filter(c => c.permanent).reduce((sum, c) => sum + Number(c.vr || 0) * (Number(c.count) || 1), 0);
  const intermittentSingleFlow = singles.filter(c => !c.permanent).reduce((sum, c) => sum + Number(c.vr || 0) * (Number(c.count) || 1), 0);

  const totalSumFlow = neSumFlow + singleSumFlow;
  const simultaneityInput = nePeakSum + intermittentSingleFlow;
  const peakFlow = simultaneity(building, simultaneityInput) + permanentFlow;
  const house = recommendHouseConnection(peakFlow);

  return {
    building,
    usageUnits: units,
    singleGroups: singleGroupsRaw,
    singles,
    rawSingles: singlesRaw,
    neSumFlow,
    nePeakSum,
    singleSumFlow,
    totalSumFlow,
    permanentFlow,
    centralWarmWater,
    warmWaterMode,
    peakFlow,
    house,
    formulaText: `Vs = ${building.a.toLocaleString('de-DE')} × (ΣVR)^${building.b.toLocaleString('de-DE')} − ${building.c.toLocaleString('de-DE')}`
  };
}
