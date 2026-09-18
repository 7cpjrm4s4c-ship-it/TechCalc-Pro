import { calculateMixing } from '../../core/engineering/hvacAir.js';

export function calculate(s = {}) {
  return calculateMixing({ ...s, mode: 'mixing' });
}

export default calculate;
