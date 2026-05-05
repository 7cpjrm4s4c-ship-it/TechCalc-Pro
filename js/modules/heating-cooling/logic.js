import { heatingCooling } from '../../utils/calculations.js';
import { recommendPipe } from '../../utils/pipes.js';
export function calculate(s){ const result = heatingCooling(s); return { ...result, pipe: recommendPipe({ massFlowKgh: result.massFlowKgh }) }; }
