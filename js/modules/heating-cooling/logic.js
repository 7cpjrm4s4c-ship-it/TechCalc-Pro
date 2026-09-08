import { heatingCooling, recommendPipe } from '../../core/data/index.js';
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
