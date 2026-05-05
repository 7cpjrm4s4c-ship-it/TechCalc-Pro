import { convert, unitCategories } from '../../utils/units.js';
export function calculate(s){ return convert(s.category, s.value, s.from, s.to); }
export function unitsFor(category){ return Object.keys(unitCategories[category].units); }
