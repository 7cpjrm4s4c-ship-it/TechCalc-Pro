import { state as rainwaterState } from '../modules/rainwater/state.js';
import { areaTypes } from '../modules/rainwater/tables.js';

const clone = value => typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));

const typeById = new Map(areaTypes.map(item => [item.id, item]));
const first = (...values) => values.find(value => value !== undefined && value !== null && String(value) !== '');

export function readRainwaterSurfaceSnapshot() {
  const source = rainwaterState.get?.() || {};
  const surfaces = Array.isArray(source.surfaces) ? source.surfaces : [];
  return clone(surfaces.map((item, index) => {
    const input = item.state || item.inputState || item;
    const result = item.result || {};
    const mode = first(input.surfaceMode, input.calculationType, result.mode, item.surfaceMode, item.calculationType, 'roof');
    const areaType = first(input.areaType, result.areaType, item.areaType, item.typeId, 'custom');
    const type = typeById.get(areaType) || {};
    const area = first(input.areaSize, result.area, item.areaSize, item.area, '0');
    const cs = first(input.customCs, result.cs, item.customCs, item.cs, type.cs, '');
    const cm = first(input.customCm, result.cm, item.customCm, item.cm, type.cm, '');
    return {
      sourceModule: 'rainwater',
      sourceId: String(item.id || input.id || `rainwater-${index + 1}`),
      name: String(first(item.name, input.areaName, item.areaName, type.name, `Regenfläche ${index + 1}`)),
      category: String(mode).toLowerCase() === 'property' ? 'property' : 'roof',
      areaType: String(areaType),
      area: String(area),
      cs: String(cs),
      cm: String(cm),
      origin: 'imported',
      coefficientSource: 'imported',
      modifiedAfterImport: false,
      importedAt: new Date().toISOString(),
      isSealed: typeof type.isSealed === 'boolean' ? type.isSealed : String(mode).toLowerCase() === 'roof'
    };
  }));
}

export function hasRainwaterSurfaceSnapshot() {
  return readRainwaterSurfaceSnapshot().some(item => Number(String(item.area).replace(',', '.')) > 0);
}

export default readRainwaterSurfaceSnapshot;
