import { calculateMixing } from '../heat-recovery/logic.js';

export function calculate(s = {}) {
  return calculateMixing({ ...s, mode: 'mixing' });
}

export default calculate;
