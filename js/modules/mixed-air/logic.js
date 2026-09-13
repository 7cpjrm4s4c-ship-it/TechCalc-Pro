import { calculateMixing } from '../../core/hvacAir.js';

export function calculate(s = {}) {
  return calculateMixing({ ...s, mode: 'mixing' });
}

export default calculate;
