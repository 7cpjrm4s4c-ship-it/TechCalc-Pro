import { areaTypes, hydraulicTables, dnOrder, gutterCombinations } from './tables.js';

export const toNumber = value => {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function getAreaType(id) {
  return areaTypes.find(item => item.id === id) || areaTypes[0];
}

function surfaceRows(surfaces = []) {
  return surfaces.map(item => {
    const base = getAreaType(item.areaType);
    const area = Math.max(0, toNumber(item.areaSize));
    const cs = base.custom ? Math.max(0, toNumber(item.customCs)) : base.cs;
    const cm = base.custom ? Math.max(0, toNumber(item.customCm)) : base.cm;
    return { ...item, base, name: item.areaName || base.name, area, cs, cm, effectiveCs: area * cs, effectiveCm: area * cm };
  });
}

function chooseHydraulic(q, fillRatio, slopeCmM, lineType) {
  const table = hydraulicTables[String(fillRatio)] || hydraulicTables['0.7'];
  const slope = toNumber(slopeCmM);
  const row = table.find(item => item.slope >= slope) || table.at(-1);
  const minDn = lineType === 'ground' ? 'DN 100' : 'DN 70';
  const minIndex = Math.max(0, dnOrder.indexOf(minDn));
  const chosenDn = dnOrder.slice(minIndex).find(name => (row?.values?.[name] || 0) >= q);
  return { dn: chosenDn || dnOrder.at(-1), slope: row?.slope || slope, capacity: row?.values?.[chosenDn] || null };
}

function chooseGutter(q, useOutlet = true) {
  const rows = useOutlet ? gutterCombinations.withOutlet : gutterCombinations.withoutOutlet;
  return rows.find(item => item.q >= q) || rows.at(-1);
}

function validate(state, r) {
  const warnings = [];
  const slope = toNumber(state.slopeCmM);
  if (!r.surfaces.length) warnings.push('Noch keine Regenfläche erfasst.');
  if (r.qr <= 0) warnings.push('Qr ist 0 l/s. Regenspende, Fläche und Abflussbeiwert prüfen.');
  if (state.lineType === 'ground') warnings.push('Grundleitungen für Regenwasser mindestens DN 100 ausführen.');
  if (['collector','ground'].includes(state.lineType) && slope < 0.5) warnings.push('Mindestgefälle für Sammel-/Grundleitungen innerhalb von Gebäuden: 0,5 cm/m.');
  if (state.lineType === 'ground' && slope < 1) warnings.push('Außerhalb von Gebäuden sind 1,0 cm/m Gefälle und v ≥ 0,7 m/s zu prüfen.');
  if (state.calculationType === 'emergency' && toNumber(state.emergencyRainIntensity) <= toNumber(state.rainIntensity)) warnings.push('Für die Notentwässerung muss r(5,100) größer als die Berechnungsregenspende sein.');
  if (state.calculationType === 'roof-drain' && toNumber(state.roofDrainCapacity) <= 0) warnings.push('Abflussvermögen des gewählten Dachablaufs QDA eingeben.');
  warnings.push('Regenspenden sind standortbezogen aus KOSTRA-DWD zu entnehmen und manuell einzutragen.');
  return warnings;
}

export function calculate(state) {
  const surfaces = surfaceRows(state.surfaces || []);
  const area = surfaces.reduce((sum, item) => sum + item.area, 0);
  const auCs = surfaces.reduce((sum, item) => sum + item.effectiveCs, 0);
  const auCm = surfaces.reduce((sum, item) => sum + item.effectiveCm, 0);
  const csResulting = area > 0 ? auCs / area : 0;
  const cmResulting = area > 0 ? auCm / area : 0;
  const rdt = toNumber(state.rainIntensity);
  const r5100 = toNumber(state.emergencyRainIntensity);
  const qr = rdt * auCs / 10000;
  const qnot = Math.max(0, (r5100 - rdt) * auCs / 10000);
  const qda = toNumber(state.roofDrainCapacity);
  const roofDrains = qda > 0 ? Math.ceil(qr / qda) : 0;
  const lineSelection = chooseHydraulic(qr, state.fillRatio || '0.7', state.slopeCmM, state.lineType || 'collector');
  const gutter = chooseGutter(qr, true);
  const overflowWidth = toNumber(state.overflowWidth);
  const overflowHead = toNumber(state.overflowHead);
  const qOverflow = overflowWidth > 0 && overflowHead > 0 ? (overflowWidth * Math.pow(overflowHead, 1.5)) / 24000 : 0;
  const warnings = validate(state, { surfaces, qr });
  return { surfaces, area, auCs, auCm, csResulting, cmResulting, rdt, r5100, qr, qnot, qda, roofDrains, lineSelection, gutter, qOverflow, warnings };
}
