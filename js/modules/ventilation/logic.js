import { ventilation } from '../../utils/calculations.js';
export function calculate(s){ const dt = s.deltaT || Math.abs(Number(s.supplyTemp || 0) - Number(s.roomTemp || 0)) || ''; return ventilation({ ...s, deltaT:dt, tempC:s.supplyTemp || 20 }); }
