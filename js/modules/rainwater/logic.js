import { areaTypes, hydraulicTables, dnOrder, roofDrainTable } from './tables.js';
import { numberService } from '../../core/numberService.js';

export const toNumber = value => numberService.parse(value, { fallback: 0, locale: 'de-DE' });

export function getAreaType(id) {
  return areaTypes.find(item => item.id === id) || areaTypes[0];
}

export function getDrainByDn(dn) {
  return roofDrainTable.find(item => item.dn === (dn || 'DN 100')) || roofDrainTable.find(item => item.dn === 'DN 100') || roofDrainTable[0];
}

function getRainForMode(source, mode) {
  if (mode === 'property') return toNumber(source.propertyRainIntensity || source.rainIntensity || '300');
  return toNumber(source.roofRainIntensity || source.rainIntensity || '300');
}

function currentDrainSettings(source = {}, fallback = {}) {
  const preset = getDrainByDn(source.drainSize || fallback.drainSize || 'DN 100');
  const dn = source.drainSizeManual || source.drainSize || fallback.drainSizeManual || fallback.drainSize || preset?.dn || 'DN 100';
  const capacity = toNumber(source.drainCapacity || fallback.drainCapacity || preset?.capacity || fallback.roofDrainCapacity);
  const head = toNumber(source.drainHead || fallback.drainHead || preset?.head);
  return { dn, capacity, head };
}


function emergencySettings(source = {}, fallback = {}) {
  const type = source.emergencyType || fallback.emergencyType || 'rect';
  const head = Math.max(0, toNumber(source.emergencyHead || fallback.emergencyHead || '35'));
  const width = Math.max(0, toNumber(source.emergencyWidth || fallback.emergencyWidth || '300'));
  const diameter = Math.max(0, toNumber(source.emergencyDiameter || fallback.emergencyDiameter || '100'));
  const manufacturerDn = source.emergencyManufacturerDn || fallback.emergencyManufacturerDn || '';
  const manualCapacity = toNumber(source.emergencyCapacity || fallback.emergencyCapacity);
  const safetyFactor = Math.max(0, toNumber(source.emergencySafetyFactor || fallback.emergencySafetyFactor || '1,0')) || 1;
  return { type, head, width, diameter, manufacturerDn, manualCapacity, safetyFactor };
}

function calcEmergencyOverflow(qNotBase, source, mode, fallback = {}) {
  const settings = emergencySettings(source, fallback);
  const qNot = mode === 'roof' ? Math.max(0, qNotBase * settings.safetyFactor) : 0;
  const head = settings.head;
  const rectCapacity = settings.type === 'rect' && settings.width > 0 && head > 0 ? (settings.width * Math.pow(head, 1.5)) / 24000 : 0;
  // Simple preliminary round overflow capacity from opening area and pressure head.
  // Manufacturer values still override when entered manually.
  const roundCapacity = settings.type === 'round' && settings.diameter > 0 && head > 0 ? (Math.PI * Math.pow(settings.diameter / 1000, 2) / 4) * Math.sqrt(2 * 9.81 * (head / 1000)) * 1000 : 0;
  const manualCapacity = settings.manualCapacity > 0 ? settings.manualCapacity : 0;
  const capacity = settings.type === 'rect' ? (manualCapacity || rectCapacity) : settings.type === 'round' ? (manualCapacity || roundCapacity) : manualCapacity;
  const requiredCount = capacity > 0 ? Math.ceil(qNot / capacity) : 0;
  const rectRequiredWidth = qNot > 0 && head > 0 ? (qNot * 24000) / Math.pow(head, 1.5) : 0;
  const rectWidthPerOverflow = settings.type === 'rect' ? settings.width : 0;
  return {
    ...settings,
    qNot,
    qNotBase,
    capacity,
    rectCapacity,
    roundCapacity,
    rectRequiredWidth,
    rectWidthPerOverflow,
    requiredCount
  };
}

function surfaceRows(state) {
  const currentMode = state.surfaceMode || state.calculationType || 'roof';
  return (state.surfaces || []).map(item => {
    const source = item?.state || item?.inputState || item || {};
    const mode = source.surfaceMode || source.calculationType || currentMode;
    const base = getAreaType(source.areaType);
    const area = Math.max(0, toNumber(source.areaSize));
    const cs = base.custom ? Math.max(0, toNumber(source.customCs)) : base.cs;
    const cm = base.custom ? Math.max(0, toNumber(source.customCm)) : base.cm;
    const rdt = getRainForMode(source, mode) || getRainForMode(state, mode);
    const r100 = toNumber(source.rainHundredIntensity || state.rainHundredIntensity);
    const drain = currentDrainSettings(source, source);
    const stackCount = mode === 'roof' ? (Math.max(1, Math.floor(toNumber(source.stackCount || state.stackCount)) || 1)) : 0;
    const fillRatio = source.fillRatio || state.fillRatio || '0.7';
    const slopeCmM = source.slopeCmM || state.slopeCmM || '1,0';
    const qr = rdt * cs * area / 10000;
    const qNotBase = mode === 'roof' ? Math.max(0, (r100 - rdt) * cs * area / 10000) : 0;
    const emergency = calcEmergencyOverflow(qNotBase, source, mode, source);
    const itemRequiredDrains = drain.capacity > 0 ? Math.ceil(qr / drain.capacity) : 0;
    const itemQPerStack = mode === 'roof' && stackCount > 0 ? qr / stackCount : 0;
    const collectorMinDn = mode === 'property' ? 'DN 100' : 'DN 70';
    const stackMinDn = mode === 'property' ? 'DN 100' : 'DN 70';
    return {
      ...item,
      ...source,
      id: item.id || source.id,
      state: item.state,
      result: item.result,
      surfaceMode: mode,
      base,
      name: item.name || source.areaName || source.name || base.name,
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
      stackSelection: mode === 'roof' ? chooseHydraulic(itemQPerStack, '0.7', slopeCmM, stackMinDn) : null
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
  const drain = currentDrainSettings(state);
  const stackCount = mode === 'roof' ? Math.max(1, Math.floor(toNumber(state.stackCount)) || 1) : 0;

  if (!r.surfaces.length) warnings.push('Noch keine Regenfläche erfasst.');
  if (!r.selectedSurface) warnings.push('Keine Fläche erfasst. Bitte eine Fläche eingeben oder gespeicherte Fläche auswählen.');
  if ((r.selectedSurface?.qr || 0) <= 0) warnings.push('Qr ist 0 l/s. Regenspende, Fläche und Abflussbeiwert prüfen.');
  if (drain.capacity <= 0) warnings.push(`${mode === 'property' ? 'Abflussvermögen des Hoftopfs' : 'Abflussvermögen des Dacheinlaufs'} eingeben.`);
  if (mode === 'roof' && stackCount < 1) warnings.push('Anzahl Fallleitungen muss mindestens 1 betragen.');
  warnings.push(`Regenspende ${mode === 'property' ? 'r(5,2)' : 'r(5,5)'} und r(5,100) standortbezogen über KOSTRA/OpenKo ermitteln und manuell eintragen.`);
  if (mode === 'roof') warnings.push('Notentwässerung als Vorbemessung berücksichtigt. Überflutungsnachweis und Rückhalteraumbemessung sind nicht Bestandteil dieser Berechnung.');
  warnings.push('Die Ergebnis-Card rechnet mit der bestätigten Eingabe. Speichern ist optional und dient nur der späteren Wiederverwendung.');
  return warnings;
}

// surfaceRowsWithCurrentDraft is kept as a named regression marker: Regenwasser calculates the current draft without requiring a saved surface.
function draftSurfaceRow(state) {
  const area = toNumber(state.areaSize);
  if (area <= 0) return null;
  const mode = state.surfaceMode || state.calculationType || 'roof';
  return surfaceRows({
    ...state,
    surfaces: [{
      id: '__current_input__',
      surfaceMode: mode,
      calculationType: mode,
      areaType: state.areaType,
      areaName: state.areaName || 'Aktuelle Eingabe',
      areaSize: state.areaSize,
      customCs: state.customCs,
      customCm: state.customCm,
      roofRainIntensity: state.roofRainIntensity,
      propertyRainIntensity: state.propertyRainIntensity,
      rainHundredIntensity: state.rainHundredIntensity,
      drainSize: state.drainSize,
      drainSizeManual: state.drainSizeManual,
      drainCapacity: state.drainCapacity,
      drainHead: state.drainHead,
      stackCount: state.stackCount,
      slopeCmM: state.slopeCmM,
      fillRatio: state.fillRatio,
      emergencyType: state.emergencyType,
      emergencyHead: state.emergencyHead,
      emergencyWidth: state.emergencyWidth,
      emergencyDiameter: state.emergencyDiameter,
      emergencyManufacturerDn: state.emergencyManufacturerDn,
      emergencyCapacity: state.emergencyCapacity,
      emergencySafetyFactor: state.emergencySafetyFactor,
      transient: true
    }]
  })[0] || null;
}

export function calculate(state) {
  const mode = state.surfaceMode || state.calculationType || 'roof';
  const isRoof = mode === 'roof';
  const persistedSurfaces = surfaceRows(state);
  const draftSurface = draftSurfaceRow(state);
  const surfaces = draftSurface ? [...persistedSurfaces, draftSurface] : persistedSurfaces;
  // Phase 36W.2H:
  // The editor state is the source of truth while a surface is selected for editing.
  // A live change such as drainSize must immediately affect calculation and result
  // rendering before the saved record is updated. Therefore the current draft
  // takes precedence over the persisted selected surface.
  const selectedSurface = draftSurface
    || (state.activeSurfaceId ? (persistedSurfaces.find(item => String(item.id) === String(state.activeSurfaceId)) || null) : null)
    || persistedSurfaces[persistedSurfaces.length - 1]
    || null;
  const selectedArea = selectedSurface?.area || 0;
  const selectedMode = selectedSurface?.surfaceMode || mode;
  const rdt = selectedSurface?.rdt || getRainForMode(state, selectedMode);
  const r100 = selectedSurface?.r100 || toNumber(state.rainHundredIntensity);
  const qr = selectedSurface?.qr || 0;
  const csResulting = selectedSurface?.cs || 0;
  const cmResulting = selectedSurface?.cm || 0;
  const drain = selectedSurface ? currentDrainSettings(selectedSurface, state) : currentDrainSettings(state);
  const requiredDrains = selectedSurface?.requiredDrains || 0;
  const selectedIsRoof = (selectedSurface?.surfaceMode || mode) === 'roof';
  const stackCount = selectedSurface?.stackCount || (selectedIsRoof ? Math.max(1, Math.floor(toNumber(state.stackCount)) || 1) : 0);
  const qPerStack = selectedSurface?.qPerStack || 0;
  const collectorSelection = selectedSurface?.collectorSelection || chooseHydraulic(qr, state.fillRatio || '0.7', state.slopeCmM, selectedIsRoof ? 'DN 70' : 'DN 100');
  const stackSelection = selectedIsRoof ? (selectedSurface?.stackSelection || chooseHydraulic(qPerStack, '0.7', state.slopeCmM, 'DN 70')) : null;
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
