import { fmt } from '../../utils/calculations.js';

const modeLabel = value => ({ roof:'Dachfläche', property:'Grundstücksfläche' }[value] || value);
const drainLabel = mode => mode === 'property' ? 'Hoftöpfe' : 'Dacheinläufe';
const drainCapacityLabel = mode => mode === 'property' ? 'Abflussvermögen Hoftopf' : 'Abflussvermögen Dacheinlauf';
const rainLabel = mode => mode === 'property' ? 'Regenspende r(5,2)' : 'Regenspende r(5,5)';

function selectedMode(s, r) {
  return r.selectedSurface?.surfaceMode || r.mode || s.surfaceMode || 'roof';
}

function selectedLabel(r) {
  return r.selectedSurface && !r.selectedSurface.transient ? r.selectedSurface.name : 'Aktuelle Eingabe';
}

function primaryRows(s, r) {
  const mode = selectedMode(s, r);
  const rows = [
    { label:'Bereich', value:modeLabel(mode) },
    { label:'Entwässerungsmenge', value:fmt(r.qr,2), unit:'l/s' },
    { label:'Ablaufdimension', value:r.drainSize || '—' },
    { label:'Abläufe', value:r.requiredDrains, unit:'Stk.' },
    { label:'Quelle', value:selectedLabel(r) }
  ];
  if (mode === 'roof') rows.splice(2, 0,
    { label:'DN Fallleitung', value:r.stackSelection?.dn || '—' },
    { label:'Notabfluss Qnot', value:fmt(r.qNot || 0,2), unit:'l/s' }
  );
  return rows;
}

function hydraulicRows(s, r) {
  const mode = selectedMode(s, r);
  const rows = [
    { label:'Fläche', value:fmt(r.area || 0,1), unit:'m²' },
    { label:'Cs', value:fmt(r.csResulting || 0,2) },
    { label:'Cm', value:fmt(r.cmResulting || 0,2) },
    { label:rainLabel(mode), value:fmt(r.rdt || 0,1), unit:'l/(s·ha)' },
    { label:'r(5,100)', value:fmt(r.r100 || 0,1), unit:'l/(s·ha)' },
    { label:'Sammelleitung', value:r.collectorSelection?.dn || '—' },
    { label:drainCapacityLabel(mode), value:fmt(r.drainCapacity || 0,1), unit:'l/s' },
    { label:'Anstauhöhe', value:fmt(r.drainHead || 0,0), unit:'mm' }
  ];
  if (mode === 'roof') rows.push(
    { label:'Fallleitungen', value:r.stackCount || 0, unit:'Stk.' },
    { label:'Volumenstrom je Fallleitung', value:fmt(r.qPerStack || 0,2), unit:'l/s' }
  );
  return rows;
}

function emergencyRows(s, r) {
  const mode = selectedMode(s, r);
  if (mode !== 'roof') return [];
  const emergency = r.emergency || {};
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
        value:isRoof ? (r.stackSelection?.dn || '—') : r.requiredDrains,
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

export function savedRecords(s = {}, r = {}) {
  const items = (Array.isArray(r.surfaces) ? r.surfaces : [])
    .filter(item => !item.transient && String(item.id) !== '__current_input__')
    .map(item => {
      const itemMode = item.surfaceMode || s.surfaceMode || 'roof';
      const isRoof = itemMode === 'roof';
      const emergency = item.emergency || {};
      const stats = [
        { label: 'Bereich', value: modeLabel(itemMode) },
        { label: 'Flächenart', value: item.base?.name || item.areaType || '—' },
        { label: 'Fläche', value: fmt(item.area,1), unit: 'm²' },
        { label: 'Cs', value: fmt(item.cs,2) },
        { label: 'Cm', value: fmt(item.cm,2) },
        { label: rainLabel(itemMode), value: fmt(item.rdt || 0,1), unit: 'l/(s·ha)' },
        { label: 'r(5,100)', value: fmt(item.r100 || 0,1), unit: 'l/(s·ha)' },
        { label: 'Entwässerungsmenge Qr', value: fmt(item.qr || 0,2), unit: 'l/s' },
        { label: drainLabel(itemMode), value: item.requiredDrains || 0, unit: 'Stk.' },
        { label: 'Ablaufdimension', value: item.drainSize || '—' },
        { label: drainCapacityLabel(itemMode), value: fmt(item.drainCapacity || 0,1), unit: 'l/s' },
        { label: 'Anstauhöhe', value: fmt(item.drainHead || 0,0), unit: 'mm' },
        { label: 'Sammelleitung', value: item.collectorSelection?.dn || '—' }
      ];
      if (isRoof) {
        stats.push(
          { label: 'Fallleitungen', value: item.stackCount || 0, unit: 'Stk.' },
          { label: 'Volumenstrom je Fallleitung', value: fmt(item.qPerStack || 0,2), unit: 'l/s' },
          { label: 'DN Fallleitung', value: item.stackSelection?.dn || '—' },
          { label: 'Notabfluss Qnot', value: fmt(item.qNot || 0,2), unit: 'l/s' },
          { label: 'Notüberlauf-Art', value: emergency.type === 'round' ? 'Rund' : emergency.type === 'manual' ? 'Herstellerwert' : 'Rechteckig' },
          { label: 'Notüberlauf Druckhöhe', value: fmt(emergency.head || 0,0), unit: 'mm' }
        );
        if (emergency.type === 'rect') stats.push(
          { label: 'Gewählte Breite je Notüberlauf', value: fmt(emergency.width || 0,0), unit: 'mm' },
          { label: 'Erforderliche Gesamtbreite', value: fmt(emergency.rectRequiredWidth || 0,0), unit: 'mm' }
        );
        if (emergency.type === 'round') stats.push({ label: 'Durchmesser Notüberlauf', value: fmt(emergency.diameter || 0,0), unit: 'mm' });
        stats.push(
          { label: 'Abfluss je Notüberlauf', value: fmt(emergency.capacity || 0,2), unit: 'l/s' },
          { label: 'Notüberläufe', value: emergency.requiredCount || 0, unit: 'Stk.' }
        );
      }
      return {
        ...item,
        title: item.name || 'Regenfläche',
        subtitle: `${modeLabel(itemMode)} · ${fmt(item.area,1)} m² · Qr ${fmt(item.qr || 0,2)} l/s`,
        stats
      };
    });

  return {
    title: 'Gespeicherte Flächen',
    nameFieldId: 'areaName',
    nameLabel: 'Bezeichnung',
    nameValue: s.areaName || '',
    namePlaceholder: 'z. B. Dachfläche Nord',
    addAction: 'saved:add',
    updateAction: 'saved:update',
    addDisabled: Boolean(s.activeSurfaceId),
    updateDisabled: !s.activeSurfaceId,
    activeId: s.activeSurfaceId,
    expandedId: s.expandedSurfaceResultId,
    emptyText: 'Noch keine Regenflächen gespeichert.',
    loadAttr: 'data-saved-load',
    toggleAttr: 'data-saved-toggle',
    deleteAttr: 'data-saved-delete',
    dynamicAttr: 'data-rainwater-dynamic="surface-list"',
    accent: 'green',
    items
  };
}

export function buildRainwaterResultModel(s, r) {
  return results(s, r);
}
