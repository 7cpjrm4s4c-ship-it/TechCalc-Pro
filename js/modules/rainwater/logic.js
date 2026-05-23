import { areaTypes, hydraulicTables, dnOrder, roofDrainTable } from './tables.js';

export const toNumber = value => {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function getAreaType(id) {
  return areaTypes.find(item => item.id === id) || areaTypes[0];
}

export function getDrainByDn(dn) {
  return roofDrainTable.find(item => item.dn === (dn || 'DN 100')) || roofDrainTable.find(item => item.dn === 'DN 100') || roofDrainTable[0];
}

function getRainForMode(state, mode) {
  if (mode === 'property') return toNumber(state.propertyRainIntensity || state.rainIntensity || '300');
  return toNumber(state.roofRainIntensity || state.rainIntensity || '300');
}

function currentDrainSettings(state) {
  const preset = getDrainByDn(state.drainSize || 'DN 100');
  const dn = state.drainSizeManual || state.drainSize || preset?.dn || 'DN 100';
  const capacity = toNumber(state.drainCapacity || preset?.capacity || state.roofDrainCapacity);
  const head = toNumber(state.drainHead || preset?.head);
  return { dn, capacity, head };
}


function emergencySettings(state) {
  const enabled = state.emergencyEnabled !== 'no';
  const type = state.emergencyType || 'rect';
  const head = Math.max(0, toNumber(state.emergencyHead || '35'));
  const width = Math.max(0, toNumber(state.emergencyWidth || '300'));
  const diameter = Math.max(0, toNumber(state.emergencyDiameter || '100'));
  const manualCapacity = toNumber(state.emergencyCapacity);
  const safetyFactor = Math.max(0, toNumber(state.emergencySafetyFactor || '1,0')) || 1;
  return { enabled, type, head, width, diameter, manualCapacity, safetyFactor };
}

function calcEmergencyOverflow(qNotBase, state, mode) {
  const settings = emergencySettings(state);
  const qNot = mode === 'roof' && settings.enabled ? Math.max(0, qNotBase * settings.safetyFactor) : 0;
  const head = settings.head;
  const rectCapacity = settings.width > 0 && head > 0 ? (settings.width * Math.pow(head, 1.5)) / 24000 : 0;
  const rectRequiredWidth = qNot > 0 && head > 0 ? (qNot * 24000) / Math.pow(head, 1.5) : 0;
  const manualCapacity = settings.manualCapacity > 0 ? settings.manualCapacity : rectCapacity;
  const requiredCount = manualCapacity > 0 ? Math.ceil(qNot / manualCapacity) : 0;
  return {
    ...settings,
    qNot,
    qNotBase,
    capacity: manualCapacity,
    rectCapacity,
    rectRequiredWidth,
    requiredCount
  };
}

function surfaceRows(state) {
  const currentMode = state.surfaceMode || state.calculationType || 'roof';
  const drain = currentDrainSettings(state);
  const stackCount = Math.max(1, Math.floor(toNumber(state.stackCount)) || 1);
  const fillRatio = state.fillRatio || '0.7';
  const slopeCmM = state.slopeCmM || '1,0';

  return (state.surfaces || []).map(item => {
    const mode = item.surfaceMode || item.calculationType || currentMode;
    const base = getAreaType(item.areaType);
    const area = Math.max(0, toNumber(item.areaSize));
    const cs = base.custom ? Math.max(0, toNumber(item.customCs)) : base.cs;
    const cm = base.custom ? Math.max(0, toNumber(item.customCm)) : base.cm;
    const rdt = getRainForMode(state, mode);
    const r100 = toNumber(state.rainHundredIntensity);
    const qr = rdt * cs * area / 10000;
    const qNotBase = mode === 'roof' ? Math.max(0, (r100 - rdt) * cs * area / 10000) : 0;
    const emergency = calcEmergencyOverflow(qNotBase, state, mode);
    const itemRequiredDrains = drain.capacity > 0 ? Math.ceil(qr / drain.capacity) : 0;
    const itemQPerStack = qr / stackCount;
    const collectorMinDn = mode === 'property' ? 'DN 100' : 'DN 70';
    const stackMinDn = mode === 'property' ? 'DN 100' : 'DN 70';
    return {
      ...item,
      surfaceMode: mode,
      base,
      name: item.areaName || base.name,
      area,
      cs,
      cm,
      rdt,
      r100,
      qr,
      emergency,
      qNot: emergency.qNot,
      effectiveCs: area * cs,
      effectiveCm: area * cm,
      requiredDrains: itemRequiredDrains,
      qPerStack: itemQPerStack,
      drainSize: drain.dn,
      drainCapacity: drain.capacity,
      drainHead: drain.head,
      stackCount,
      fillRatio,
      slopeCmM,
      collectorSelection: chooseHydraulic(qr, fillRatio, slopeCmM, collectorMinDn),
      stackSelection: chooseHydraulic(itemQPerStack, '0.7', slopeCmM, stackMinDn)
    };
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
  const mode = state.surfaceMode || state.calculationType || 'roof';
  const slope = toNumber(state.slopeCmM);
  const drain = currentDrainSettings(state);
  const stackCount = Math.max(1, Math.floor(toNumber(state.stackCount)) || 1);

  if (!r.surfaces.length) warnings.push('Noch keine Regenfläche erfasst.');
  if (!r.selectedSurface) warnings.push('Keine Fläche markiert. Bitte eine Fläche für die Ergebnisanzeige auswählen.');
  if ((r.selectedSurface?.qr || 0) <= 0) warnings.push('Qr ist 0 l/s. Regenspende, Fläche und Abflussbeiwert prüfen.');
  if (drain.capacity <= 0) warnings.push(`${mode === 'property' ? 'Abflussvermögen des Hoftopfs' : 'Abflussvermögen des Dacheinlaufs'} eingeben.`);
  if (stackCount < 1) warnings.push('Anzahl Fallleitungen muss mindestens 1 betragen.');
  if (slope < 0.5) warnings.push('Mindestgefälle für Sammel-/Grundleitungen innerhalb von Gebäuden: 0,5 cm/m.');
  if (mode === 'property' && slope < 1) warnings.push('Bei Grundleitungen außerhalb von Gebäuden sind 1,0 cm/m Gefälle und v ≥ 0,7 m/s zu prüfen.');
  warnings.push(`Regenspende ${mode === 'property' ? 'r(5,2)' : 'r(5,5)'} und r(5,100) standortbezogen über KOSTRA/OpenKo ermitteln und manuell eintragen.`);
  if (mode === 'roof' && state.emergencyEnabled !== 'no') warnings.push('Notentwässerung als Vorbemessung berücksichtigt. Überflutungsnachweis und Rückhalteraumbemessung sind nicht Bestandteil dieser Berechnung.');
  warnings.push('Die Ergebnis-Card zeigt die markierte bzw. zuletzt hinzugefügte Fläche. Weitere Flächen werden separat in den Klappcards berechnet.');
  return warnings;
}

export function calculate(state) {
  const mode = state.surfaceMode || state.calculationType || 'roof';
  const isRoof = mode === 'roof';
  const surfaces = surfaceRows(state);
  const lastSurfaceId = surfaces.length ? surfaces[surfaces.length - 1].id : null;
  const selectedId = state.activeSurfaceId || lastSurfaceId;
  const selectedSurface = surfaces.find(item => String(item.id) === String(selectedId)) || surfaces[surfaces.length - 1] || null;
  const selectedArea = selectedSurface?.area || 0;
  const rdt = getRainForMode(state, selectedSurface?.surfaceMode || mode);
  const r100 = toNumber(state.rainHundredIntensity);
  const qr = selectedSurface?.qr || 0;
  const csResulting = selectedSurface?.cs || 0;
  const cmResulting = selectedSurface?.cm || 0;
  const drain = currentDrainSettings(state);
  const requiredDrains = selectedSurface?.requiredDrains || 0;
  const stackCount = selectedSurface?.stackCount || Math.max(1, Math.floor(toNumber(state.stackCount)) || 1);
  const qPerStack = selectedSurface?.qPerStack || 0;
  const selectedIsRoof = (selectedSurface?.surfaceMode || mode) === 'roof';
  const collectorSelection = selectedSurface?.collectorSelection || chooseHydraulic(qr, state.fillRatio || '0.7', state.slopeCmM, selectedIsRoof ? 'DN 70' : 'DN 100');
  const stackSelection = selectedSurface?.stackSelection || chooseHydraulic(qPerStack, '0.7', state.slopeCmM, selectedIsRoof ? 'DN 70' : 'DN 100');
  const emergency = selectedSurface?.emergency || calcEmergencyOverflow(0, state, selectedSurface?.surfaceMode || mode);
  const warnings = validate(state, { surfaces, selectedSurface });
  return {
    mode,
    isRoof,
    surfaces,
    selectedSurface,
    selectedSurfaceId: selectedSurface?.id || null,
    area: selectedArea,
    csResulting,
    cmResulting,
    rdt,
    r100,
    qr,
    qNot: emergency.qNot || 0,
    emergency,
    drainSize: drain.dn,
    drainHead: drain.head,
    drainCapacity: drain.capacity,
    requiredDrains,
    stackCount,
    qPerStack,
    collectorSelection,
    stackSelection,
    warnings
  };
}
