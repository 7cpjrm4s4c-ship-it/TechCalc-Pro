import { num } from '../../utils/calculations.js';

export const CONSUMERS = [
  { id:'basin', label:'Waschtisch / Bidet / Küchenspüle', short:'Waschtisch', vr:0.07, pmin:0.10, neGroup:'basin', hotWater:true },
  { id:'kitchenSink', label:'Küchenspüle', short:'Küchenspüle', vr:0.07, pmin:0.10, neGroup:'basin', hotWater:true },
  { id:'dishwasher', label:'Geschirrspülmaschine', short:'Geschirrspüler', vr:0.07, pmin:0.05, neGroup:'dishwasher' },
  { id:'wcCistern', label:'WC-Spülkasten', short:'Spülkasten', vr:0.13, pmin:0.05, neGroup:'wc' },
  { id:'bathShower', label:'Mischarmatur Bade-/Duschwanne', short:'Bad/Dusche', vr:0.15, pmin:0.10, neGroup:'bath', hotWater:true },
  { id:'shower', label:'Dusche', short:'Dusche', vr:0.15, pmin:0.10, neGroup:'bath', hotWater:true },
  { id:'washingMachine', label:'Waschmaschine', short:'Waschmaschine', vr:0.15, pmin:0.05, neGroup:'washing' },
  { id:'urinalFlush', label:'Druckspüler Urinal', short:'Urinal-Druckspüler', vr:0.30, pmin:0.10, neGroup:'urinal' },
  { id:'tapRegDn10', label:'Auslaufventil mit Strahlregler DN 10', short:'Auslauf DN10', vr:0.15, pmin:0.10, neGroup:'tap', hotWater:true },
  { id:'tapDn15', label:'Auslaufventil ohne Strahlregler DN 15', short:'Auslauf DN15', vr:0.30, pmin:0.05, neGroup:'tap', hotWater:true },
  { id:'tapDn20', label:'Auslaufventil ohne Strahlregler DN 20', short:'Auslauf DN20', vr:0.50, pmin:0.05, neGroup:'tap', hotWater:true },
  { id:'tapDn25', label:'Auslaufventil ohne Strahlregler DN 25', short:'Auslauf DN25', vr:1.00, pmin:0.05, neGroup:'tap', hotWater:true }
];

export const BUILDING_TYPES = [
  { id:'residential', label:'Wohngebäude / Nutzungseinheiten', a:1.48, b:0.19, c:0.94 },
  { id:'hotel', label:'Hotel', a:0.70, b:0.48, c:0.13 },
  { id:'hospital', label:'Bettenhaus Krankenhaus', a:0.75, b:0.44, c:0.18 },
  { id:'school', label:'Schule / Verwaltungsgebäude', a:0.70, b:0.40, c:0.13 },
  { id:'senior', label:'Wohnheim / Seniorenheim', a:0.91, b:0.31, c:0.38 }
];

const UNIT_STORAGE_KEY = 'techcalcPro.drinkingWater.usageUnits';
const SINGLE_STORAGE_KEY = 'techcalcPro.drinkingWater.singleConsumers';

export function readUsageUnits() {
  try { return JSON.parse(localStorage.getItem(UNIT_STORAGE_KEY) || '[]'); }
  catch { return []; }
}
export function writeUsageUnits(items) { localStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify(items)); }
export function readSingleConsumers() {
  try { return JSON.parse(localStorage.getItem(SINGLE_STORAGE_KEY) || '[]'); }
  catch { return []; }
}
export function writeSingleConsumers(items) { localStorage.setItem(SINGLE_STORAGE_KEY, JSON.stringify(items)); }

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

function unitEffectiveConsumers(unit, includeHotWater = false) {
  const expanded = [];
  (unit.consumers || []).forEach(consumer => {
    for (let i = 0; i < Math.max(1, Number(consumer.count) || 1); i++) {
      expanded.push(consumer);
      if (includeHotWater && consumer.hotWater) {
        expanded.push({ ...consumer, id: `${consumer.id}-tww-${i}`, label: `${consumer.label} TWW`, neGroup: `${consumer.neGroup || consumer.typeId}-tww` });
      }
    }
  });

  // Innerhalb einer NE werden mehrfach vorhandene gleichartige Entnahmestellen nur einmal angesetzt.
  const byGroup = new Map();
  for (const consumer of expanded) {
    const key = consumer.neGroup || consumer.typeId;
    const existing = byGroup.get(key);
    if (!existing || Number(consumer.vr) > Number(existing.vr)) byGroup.set(key, consumer);
  }
  return [...byGroup.values()];
}

export function summarizeUsageUnit(unit, includeHotWater = false) {
  const effective = unitEffectiveConsumers(unit, includeHotWater);
  const topTwoFlow = effective
    .map(c => Number(c.vr || 0))
    .sort((a,b) => b-a)
    .slice(0, 2)
    .reduce((sum, v) => sum + v, 0);
  const rawFlow = (unit.consumers || []).reduce((sum, c) => sum + Number(c.vr || 0) * (Number(c.count) || 1), 0);
  return {
    ...unit,
    effectiveConsumers: effective,
    consumerCount: (unit.consumers || []).reduce((sum, c) => sum + (Number(c.count)||1), 0),
    rawFlow,
    // DIN-NE-Ansatz für die weitere Gesamtberechnung: zwei größte wirksame Entnahmestellen.
    sumFlow: topTwoFlow,
    peakFlow: topTwoFlow
  };
}

function simultaneity(building, sumVr) {
  if (!sumVr) return 0;
  const value = building.a * Math.pow(sumVr, building.b) - building.c;
  return Math.max(0, Math.min(sumVr, value));
}

function recommendHouseConnection(peakLs) {
  const flowM3h = peakLs * 3.6;
  // Vorbemessung nach Q3-Auswahl: der Wasserzähler muss den Spitzendurchfluss abdecken.
  // DN bleibt bewusst konservativ, aber kleine Wohnanlagen mit ca. 1 m³/h fallen nicht mehr auf DN 32 / Q3 10.
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
  const centralWarmWater = s.waterHeatingMode !== 'decentral';
  const units = readUsageUnits().map(unit => summarizeUsageUnit(unit, centralWarmWater));
  const singlesRaw = readSingleConsumers();
  const singles = centralWarmWater
    ? singlesRaw.flatMap(consumer => consumer.hotWater ? [consumer, { ...consumer, id: `${consumer.id}-tww`, name: `${consumer.name || consumer.label} TWW`, label: `${consumer.label} TWW`, hotWaterClone:true }] : [consumer])
    : singlesRaw;
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
    singles,
    rawSingles: singlesRaw,
    neSumFlow,
    nePeakSum,
    singleSumFlow,
    totalSumFlow,
    permanentFlow,
    centralWarmWater,
    peakFlow,
    house,
    formulaText: `Vs = ${building.a.toLocaleString('de-DE')} × (ΣVR)^${building.b.toLocaleString('de-DE')} − ${building.c.toLocaleString('de-DE')}`
  };
}
