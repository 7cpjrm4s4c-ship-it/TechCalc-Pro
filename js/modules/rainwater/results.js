import { fmt } from '../../utils/calculations.js';
import { areaTypes } from './tables.js';

const modeLabel = value => ({ roof:'Dachfläche', property:'Grundstücksfläche' }[value] || value);
const drainLabel = mode => mode === 'property' ? 'Hoftöpfe' : 'Dacheinläufe';
const drainCapacityLabel = mode => mode === 'property' ? 'Abflussvermögen Hoftopf' : 'Abflussvermögen Dacheinlauf';
const rainLabel = mode => mode === 'property' ? 'Regenspende r(5,2)' : 'Regenspende r(5,5)';

function sameId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

function areaTypeLabel(surface = {}, s = {}) {
  const id = surface.areaType || surface.state?.areaType || s.areaType;
  const type = areaTypes.find(item => item.id === id);
  return type?.name || surface.base?.name || id || '—';
}

function selectedSurface(s = {}, r = {}) {
  const activeId = s.activeSurfaceId || r.selectedSurfaceId || null;
  const candidates = [
    ...(Array.isArray(r.surfaces) ? r.surfaces : []),
    ...(Array.isArray(s.surfaces) ? s.surfaces : [])
  ];

  if (activeId) {
    const active = candidates.find(item => sameId(item?.id, activeId));
    if (active) return active;
  }

  return r.selectedSurface || candidates[candidates.length - 1] || null;
}

function selectedMode(s, r) {
  const surface = selectedSurface(s, r);
  return surface?.surfaceMode || surface?.calculationType || r.selectedSurface?.surfaceMode || r.mode || s.surfaceMode || 'roof';
}

function selectedLabel(s, r) {
  const surface = selectedSurface(s, r);
  if (!surface) return 'Aktuelle Eingabe';
  if (surface.transient || sameId(surface.id, '__current_input__')) return 'Aktuelle Eingabe';
  return surface.name || surface.areaName || surface.state?.areaName || 'Gespeicherte Fläche';
}

function selectedValue(s, r, key, fallback = undefined) {
  const surface = selectedSurface(s, r);
  return surface?.[key] ?? surface?.result?.[key] ?? r?.[key] ?? fallback;
}

function primaryRows(s, r) {
  const surface = selectedSurface(s, r);
  const mode = selectedMode(s, r);
  const rows = [
    { label:'Bereich', value:modeLabel(mode) },
    { label:'Quelle', value:selectedLabel(s, r) },
    { label:'Flächenart', value:areaTypeLabel(surface || {}, s) },
    { label:'Entwässerungsmenge', value:fmt(selectedValue(s, r, 'qr', 0),2), unit:'l/s' },
    { label:'Ablaufdimension', value:selectedValue(s, r, 'drainSize', r.drainSize || '—') },
    { label:'Abläufe', value:selectedValue(s, r, 'requiredDrains', r.requiredDrains), unit:'Stk.' }
  ];
  if (mode === 'roof') rows.splice(4, 0,
    { label:'DN Fallleitung', value:r.stackSelection?.dn || surface?.stackSelection?.dn || '—' },
    { label:'Notabfluss Qnot', value:fmt(surface?.qNot ?? r.qNot ?? 0,2), unit:'l/s' }
  );
  return rows;
}

function hydraulicRows(s, r) {
  const surface = selectedSurface(s, r);
  const mode = selectedMode(s, r);
  const rows = [
    { label:'Fläche', value:fmt(selectedValue(s, r, 'area', 0),1), unit:'m²' },
    { label:'Flächenart', value:areaTypeLabel(surface || {}, s) },
    { label:'Cs', value:fmt(selectedValue(s, r, 'cs', r.csResulting || 0),2) },
    { label:'Cm', value:fmt(selectedValue(s, r, 'cm', r.cmResulting || 0),2) },
    { label:rainLabel(mode), value:fmt(selectedValue(s, r, 'rdt', r.rdt || 0),1), unit:'l/(s·ha)' },
    { label:'r(5,100)', value:fmt(selectedValue(s, r, 'r100', r.r100 || 0),1), unit:'l/(s·ha)' },
    { label:'Sammelleitung', value:r.collectorSelection?.dn || surface?.collectorSelection?.dn || '—' },
    { label:drainCapacityLabel(mode), value:fmt(selectedValue(s, r, 'drainCapacity', r.drainCapacity || 0),1), unit:'l/s' },
    { label:'Anstauhöhe', value:fmt(selectedValue(s, r, 'drainHead', r.drainHead || 0),0), unit:'mm' }
  ];
  if (mode === 'roof') rows.push(
    { label:'Fallleitungen', value:selectedValue(s, r, 'stackCount', r.stackCount || 0), unit:'Stk.' },
    { label:'Volumenstrom je Fallleitung', value:fmt(selectedValue(s, r, 'qPerStack', r.qPerStack || 0),2), unit:'l/s' }
  );
  return rows;
}

function emergencyRows(s, r) {
  const mode = selectedMode(s, r);
  if (mode !== 'roof') return [];
  const surface = selectedSurface(s, r);
  const emergency = surface?.emergency || r.emergency || {};
  const rows = [
    { label:'Notüberlauf-Art', value:emergency.type === 'round' ? 'Rund' : emergency.type === 'manual' ? 'Herstellerwert' : 'Rechteckig' },
    { label:'Notüberlauf Druckhöhe', value:fmt(emergency.head || 0,0), unit:'mm' },
    { label:'Abfluss je Notüberlauf', value:fmt(emergency.capacity || 0,2), unit:'l/s' },
    { label:'Notüberläufe', value:emergency.requiredCount || 0, unit:'Stk.' }
  ];
  if (emergency.type === 'rect') rows.push(
    { label:'Gewählte Breite je Notüberlauf', value:fmt(emergency.width || 0,0), unit:'mm' },
    { label:'Erforderliche Gesamtbreite', value:fmt(emergency.rectRequiredWidth || 0,0), unit:'mm' }
  );
  if (emergency.type === 'round') rows.push({ label:'Durchmesser Notüberlauf', value:fmt(emergency.diameter || 0,0), unit:'mm' });
  return rows;
}

export function results(s, r) {
  const mode = selectedMode(s, r);
  const isRoof = mode === 'roof';
  const groups = [
    { title:'Hydraulische Kennwerte', rows:hydraulicRows(s, r), accent:'green' }
  ];
  const emergency = emergencyRows(s, r);
  if (emergency.length) groups.push({ title:'Notentwässerung', rows:emergency, accent:'green' });

  return {
    primary: {
      title:'Ergebnis Regenwasser',
      primary: {
        label:isRoof ? 'DN Fallleitung' : drainLabel(mode),
        value:isRoof ? (r.stackSelection?.dn || selectedSurface(s, r)?.stackSelection?.dn || '—') : selectedValue(s, r, 'requiredDrains', r.requiredDrains),
        unit:isRoof ? '' : 'Stk.'
      },
      rows:primaryRows(s, r),
      accent:'green'
    },
    groups,
    calculations: [],
    notices: [{
      title:'Normhinweise / Plausibilität',
      messages:[
        'Berechnung erfolgt auf Grundlage der DIN 1986 - 100, aktuellste Fassung.',
        ...(r.warnings || [])
      ],
      prefix:'Hinweis',
      accent:'green'
    }]
  };
}

export function buildRainwaterResultModel(s, r) {
  return results(s, r);
}
