import { state as rainwaterState } from '../modules/rainwater/state.js';
import { areaTypes } from '../modules/rainwater/tables.js';

const clone = value => typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));

const typeById = new Map(areaTypes.map(item => [item.id, item]));

export function readRainwaterSurfaceSnapshot() {
  const source = rainwaterState.get?.() || {};
  const surfaces = Array.isArray(source.surfaces) ? source.surfaces : [];
  return clone(surfaces.map((item, index) => {
    const type = typeById.get(item.areaType || item.typeId) || {};
    return {
      sourceModule: 'rainwater',
      sourceId: String(item.id || `rainwater-${index + 1}`),
      name: String(item.name || item.areaName || `Regenfläche ${index + 1}`),
      category: String(item.surfaceMode || item.calculationType || '').toLowerCase() === 'property' ? 'property' : 'roof',
      areaType: String(item.areaType || item.typeId || 'custom'),
      area: String(item.areaSize || item.area || '0'),
      cs: String(item.customCs || item.cs || type.cs ?? ''),
      cm: String(item.customCm || item.cm || type.cm ?? '')
    };
  }));
}

export default readRainwaterSurfaceSnapshot;
