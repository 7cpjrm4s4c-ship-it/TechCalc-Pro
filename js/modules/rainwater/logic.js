import { areaTypes, hydraulicTables, dnOrder, roofDrainTable } from './tables.js';

export const toNumber = value => {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function getAreaType(id) {
  return areaTypes.find(item => item.id === id) || areaTypes[0];
}

function selectedDrain(state) {
  return roofDrainTable.find(item => item.dn === (state.drainSize || 'DN 100')) || roofDrainTable.find(item => item.dn === 'DN 100') || roofDrainTable[0];
}

function surfaceRows(state) {
  const rdt = toNumber(state.rainIntensity);
  return (state.surfaces || []).map(item => {
    const base = getAreaType(item.areaType);
    const area = Math.max(0, toNumber(item.areaSize));
    const cs = base.custom ? Math.max(0, toNumber(item.customCs)) : base.cs;
    const cm = base.custom ? Math.max(0, toNumber(item.customCm)) : base.cm;
    const qr = rdt * cs * area / 10000;
    return { ...item, base, name: item.areaName || base.name, area, cs, cm, qr, effectiveCs: area * cs, effectiveCm: area * cm };
  });
}

function chooseHydraulic(q, fillRatio, slopeCmM, minDn = 'DN 70') {
  const table = hydraulicTables[String(fillRatio)] || hydraulicTables['0.7'];
  const slope = Math.max(0, toNumber(slopeCmM));
  const row = table.find(item => item.slope >= slope) || table[table.length - 1];
  const minIndex = Math.max(0, dnOrder.indexOf(minDn));
  const chosenDn = dnOrder.slice(minIndex).find(name => (row?.values?.[name] || 0) >= q);
  const fallbackDn = dnOrder[dnOrder.length - 1];
  const dn = chosenDn || fallbackDn;
  return { dn, slope: row?.slope || slope, capacity: row?.values?.[dn] || null };
}

function validate(state, r) {
  const warnings = [];
  const isRoof = (state.surfaceMode || state.calculationType || 'roof') === 'roof';
  const slope = toNumber(state.slopeCmM);
  const drain = selectedDrain(state);
  const drainSize = drain?.dn || state.drainSize || 'DN 100';
  const drainHead = drain?.head ?? null;
  const drainCapacity = toNumber(drain?.capacity || state.drainCapacity || state.roofDrainCapacity);
  const stackCount = Math.max(1, Math.floor(toNumber(state.stackCount)) || 1);

  if (!r.surfaces.length) warnings.push('Noch keine Regenfläche erfasst.');
  if (r.qr <= 0) warnings.push('Qr ist 0 l/s. Regenspende, Fläche und Abflussbeiwert prüfen.');
  if (drainCapacity <= 0) warnings.push(`${isRoof ? 'Abflussvermögen des Dacheinlaufs' : 'Abflussvermögen des Hoftopfs'} eingeben.`);
  if (stackCount < 1) warnings.push('Anzahl Fallleitungen muss mindestens 1 betragen.');
  if (slope < 0.5) warnings.push('Mindestgefälle für Sammel-/Grundleitungen innerhalb von Gebäuden: 0,5 cm/m.');
  if (!isRoof && slope < 1) warnings.push('Bei Grundleitungen außerhalb von Gebäuden sind 1,0 cm/m Gefälle und v ≥ 0,7 m/s zu prüfen.');
  warnings.push(`Regenspende ${isRoof ? 'r(5,5)' : 'r(5,2)'} und r(5,100) standortbezogen über KOSTRA/OpenKo ermitteln und manuell eintragen.`);
  warnings.push('Berechnung erfolgt flächenweise; die Dimensionierung nutzt die Summe der Entwässerungsmenge.');
  return warnings;
}

export function calculate(state) {
  const mode = state.surfaceMode || state.calculationType || 'roof';
  const isRoof = mode === 'roof';
  const surfaces = surfaceRows(state);
  const area = surfaces.reduce((sum, item) => sum + item.area, 0);
  const auCs = surfaces.reduce((sum, item) => sum + item.effectiveCs, 0);
  const auCm = surfaces.reduce((sum, item) => sum + item.effectiveCm, 0);
  const csResulting = area > 0 ? auCs / area : 0;
  const cmResulting = area > 0 ? auCm / area : 0;
  const rdt = toNumber(state.rainIntensity);
  const r100 = toNumber(state.rainHundredIntensity);
  const qr = surfaces.reduce((sum, item) => sum + item.qr, 0);
  const drain = selectedDrain(state);
  const drainSize = drain?.dn || state.drainSize || 'DN 100';
  const drainHead = drain?.head ?? null;
  const drainCapacity = toNumber(drain?.capacity || state.drainCapacity || state.roofDrainCapacity);
  const requiredDrains = drainCapacity > 0 ? Math.ceil(qr / drainCapacity) : 0;
  const stackCount = Math.max(1, Math.floor(toNumber(state.stackCount)) || 1);
  const qPerStack = qr / stackCount;
  const collectorMinDn = isRoof ? 'DN 70' : 'DN 100';
  const stackMinDn = isRoof ? 'DN 70' : 'DN 100';
  const collectorSelection = chooseHydraulic(qr, state.fillRatio || '0.7', state.slopeCmM, collectorMinDn);
  const stackSelection = chooseHydraulic(qPerStack, '0.7', state.slopeCmM, stackMinDn);
  const surfacesWithDimension = surfaces.map(item => {
    const itemRequiredDrains = drainCapacity > 0 ? Math.ceil(item.qr / drainCapacity) : 0;
    const itemQPerStack = item.qr / stackCount;
    return {
      ...item,
      requiredDrains:itemRequiredDrains,
      qPerStack:itemQPerStack,
      collectorSelection:chooseHydraulic(item.qr, state.fillRatio || '0.7', state.slopeCmM, collectorMinDn),
      stackSelection:chooseHydraulic(itemQPerStack, '0.7', state.slopeCmM, stackMinDn)
    };
  });
  const warnings = validate(state, { surfaces, qr });
  return { mode, isRoof, surfaces:surfacesWithDimension, area, auCs, auCm, csResulting, cmResulting, rdt, r100, qr, drainSize, drainHead, drainCapacity, requiredDrains, stackCount, qPerStack, collectorSelection, stackSelection, warnings };
}
