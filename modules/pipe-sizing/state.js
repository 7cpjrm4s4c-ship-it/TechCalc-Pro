import { createModuleState } from '../../core/state/index.js';
export const state = createModuleState({
  systemId:'steel',
  flowValue:'',
  flowUnit:'kg/h',
  massFlowKgh:'',
  volumeFlowM3h:'',
  maxPressurePam:'100',
  pipeName:'',
  activePipeId:null,
  expandedPipeId:null,
  savedPipes:[]
});
