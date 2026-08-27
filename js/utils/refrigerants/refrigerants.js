const source = Object.freeze({
  id: 'UBA-GWP-2026-03',
  title: 'Treibhauspotentiale (GWP) ausgewählter Verbindungen und Gemische',
  publisher: 'Umweltbundesamt',
  updatedAt: '2026-03'
});

const annexIGroup1 = Object.freeze({ fluorinatedGreenhouseGas: true, hfc: true, annexIGroup1Content: true, annexIIGroup1Content: false });
const annexIIGroup1 = Object.freeze({ fluorinatedGreenhouseGas: true, hfc: false, annexIGroup1Content: false, annexIIGroup1Content: true });
const hfcBlend = Object.freeze({ fluorinatedGreenhouseGas: true, hfc: true, annexIGroup1Content: true, annexIIGroup1Content: false });
const hfcHfoBlend = Object.freeze({ fluorinatedGreenhouseGas: true, hfc: true, annexIGroup1Content: true, annexIIGroup1Content: true });
const nonFgas = Object.freeze({ fluorinatedGreenhouseGas: false, hfc: false, annexIGroup1Content: false, annexIIGroup1Content: false });

const component = (refrigerantId, massPercent) => Object.freeze({ refrigerantId, massPercent });
const refrigerant = ({ id, name = id, aliases = [], group, regulatory, components = [] }) => Object.freeze({
  id,
  name,
  aliases: Object.freeze(aliases),
  group,
  odp: null,
  safetyClassRef: null,
  gwpRef: id,
  regulatory,
  components: Object.freeze(components)
});

export const REFRIGERANT_DATASET = Object.freeze({
  version: '1.1.0',
  source,
  updatedAt: '2026-08-27',
  status: 'specified',
  scope: 'TechCalc Pro 1.5.0 core refrigerants from the provided UBA March 2026 source',
  items: Object.freeze([
    refrigerant({ id: 'HFKW-32', name: 'R32 (Difluormethan)', aliases: ['R32', 'R-32'], group: 'HFKW', regulatory: annexIGroup1 }),
    refrigerant({ id: 'HFKW-125', name: 'Pentafluorethan', group: 'HFKW', regulatory: annexIGroup1 }),
    refrigerant({ id: 'HFKW-134a', name: '1,1,1,2-Tetrafluorethan', group: 'HFKW', regulatory: annexIGroup1 }),
    refrigerant({ id: 'HFKW-143a', name: '1,1,1-Trifluorethan', group: 'HFKW', regulatory: annexIGroup1 }),
    refrigerant({ id: 'HFKW-152a', name: '1,1-Difluorethan', group: 'HFKW', regulatory: annexIGroup1 }),
    refrigerant({ id: 'HFKW-227ea', name: '1,1,1,2,3,3,3-Heptafluorpropan', group: 'HFKW', regulatory: annexIGroup1 }),
    refrigerant({ id: 'HFKW-1234yf', name: '2,3,3,3-Tetrafluorprop-1-en', group: 'HFO', regulatory: annexIIGroup1 }),
    refrigerant({ id: 'HFKW-1234ze (E)', name: 'trans-1,3,3,3-Tetrafluorprop-1-en', group: 'HFO', regulatory: annexIIGroup1 }),
    refrigerant({ id: 'R-290', name: 'Propan', group: 'halogenfrei', regulatory: nonFgas }),
    refrigerant({ id: 'R-600', name: 'n-Butan', group: 'halogenfrei', regulatory: nonFgas }),
    refrigerant({ id: 'R-600a', name: 'i-Butan (Isobutan)', group: 'halogenfrei', regulatory: nonFgas }),
    refrigerant({ id: 'R-717', name: 'Ammoniak', group: 'halogenfrei', regulatory: nonFgas }),
    refrigerant({ id: 'R-744', name: 'Kohlendioxid', group: 'halogenfrei', regulatory: nonFgas }),
    refrigerant({ id: 'R-1270', name: 'Propen (Propylen)', group: 'halogenfrei', regulatory: nonFgas }),
    refrigerant({ id: 'R-404A', group: 'HFKW-Gemisch', regulatory: hfcBlend, components: [component('HFKW-125', 44), component('HFKW-134a', 4), component('HFKW-143a', 52)] }),
    refrigerant({ id: 'R-407A', group: 'HFKW-Gemisch', regulatory: hfcBlend, components: [component('HFKW-32', 20), component('HFKW-125', 40), component('HFKW-134a', 40)] }),
    refrigerant({ id: 'R-407C', group: 'HFKW-Gemisch', regulatory: hfcBlend, components: [component('HFKW-32', 23), component('HFKW-125', 25), component('HFKW-134a', 52)] }),
    refrigerant({ id: 'R-407F', group: 'HFKW-Gemisch', regulatory: hfcBlend, components: [component('HFKW-32', 30), component('HFKW-125', 30), component('HFKW-134a', 40)] }),
    refrigerant({ id: 'R-410A', group: 'HFKW-Gemisch', regulatory: hfcBlend, components: [component('HFKW-32', 50), component('HFKW-125', 50)] }),
    refrigerant({ id: 'R-448A', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-32', 26), component('HFKW-125', 26), component('HFKW-134a', 21), component('HFKW-1234yf', 20), component('HFKW-1234ze (E)', 7)] }),
    refrigerant({ id: 'R-449A', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-32', 24.3), component('HFKW-125', 24.7), component('HFKW-134a', 25.7), component('HFKW-1234yf', 25.3)] }),
    refrigerant({ id: 'R-450A', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-134a', 42), component('HFKW-1234ze (E)', 58)] }),
    refrigerant({ id: 'R-452A', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-32', 11), component('HFKW-125', 59), component('HFKW-1234yf', 30)] }),
    refrigerant({ id: 'R-452B', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-32', 67), component('HFKW-125', 7), component('HFKW-1234yf', 26)] }),
    refrigerant({ id: 'R-454A', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-32', 35), component('HFKW-1234yf', 65)] }),
    refrigerant({ id: 'R-454B', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-32', 68.9), component('HFKW-1234yf', 31.1)] }),
    refrigerant({ id: 'R-454C', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-32', 21.5), component('HFKW-1234yf', 78.5)] }),
    refrigerant({ id: 'R-455A', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-32', 21.5), component('HFKW-1234yf', 75.5), component('R-744', 3)] }),
    refrigerant({ id: 'R-507A', group: 'HFKW-Gemisch', regulatory: hfcBlend, components: [component('HFKW-125', 50), component('HFKW-143a', 50)] }),
    refrigerant({ id: 'R-513A', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-134a', 44), component('HFKW-1234yf', 56)] }),
    refrigerant({ id: 'R-515B', group: 'HFKW/HFO-Gemisch', regulatory: hfcHfoBlend, components: [component('HFKW-227ea', 8.9), component('HFKW-1234ze (E)', 91.1)] })
  ])
});

export default REFRIGERANT_DATASET;
