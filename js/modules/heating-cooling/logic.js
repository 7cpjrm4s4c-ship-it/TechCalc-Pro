import { heatingCooling } from '../../utils/calculations.js';
import { recommendPipe } from '../../utils/pipes.js';
export function calculate(s){
  const result = heatingCooling(s);
  return {
    ...result,
    pipe: recommendPipe({
      massFlowKgh: result.massFlowKgh,
      volumeFlowM3h: result.volumeFlowM3h,
      systemId: s.pipeSystemId,
      density: result.medium.density
    })
  };
}
