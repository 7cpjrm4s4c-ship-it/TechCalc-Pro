function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  return Number(String(value || '').replace(/\./g,'').replace(',','.')) || 0;
}

const steelDimensions = [
  {dn:15, dimension:'21,3 × 2,65', di:16},
  {dn:20, dimension:'26,9 × 2,65', di:21.6},
  {dn:25, dimension:'33,7 × 3,25', di:27.2},
  {dn:32, dimension:'42,4 × 3,25', di:35.9},
  {dn:40, dimension:'48,3 × 3,25', di:41.8},
  {dn:50, dimension:'60,3 × 3,65', di:53},
  {dn:65, dimension:'76,1 × 2,9', di:70.3},
  {dn:80, dimension:'88,9 × 3,2', di:82.5},
  {dn:100, dimension:'114,3 × 3,6', di:107.1},
  {dn:125, dimension:'139,7 × 4,0', di:131.7},
  {dn:150, dimension:'168,3 × 4,5', di:159.3},
  {dn:200, dimension:'219,1 × 5,9', di:207.3},
  {dn:250, dimension:'273,0 × 6,3', di:260.4},
  {dn:300, dimension:'323,9 × 7,1', di:309.7}
];

const mapressDimensions = [
  {dn:10, dimension:'12 × 1,0', di:10},
  {dn:12, dimension:'15 × 1,0', di:13},
  {dn:15, dimension:'18 × 1,0', di:16},
  {dn:20, dimension:'22 × 1,2', di:19.6},
  {dn:25, dimension:'28 × 1,2', di:25.6},
  {dn:32, dimension:'35 × 1,5', di:32},
  {dn:40, dimension:'42 × 1,5', di:39},
  {dn:50, dimension:'54 × 1,5', di:51},
  {dn:65, dimension:'76,1 × 2,0', di:72.1},
  {dn:80, dimension:'88,9 × 2,0', di:84.9},
  {dn:100, dimension:'108 × 2,0', di:104}
];


const copperDimensions = [
  {dn:10, dimension:'12 × 1,0', di:10},
  {dn:12, dimension:'15 × 1,0', di:13},
  {dn:15, dimension:'18 × 1,0', di:16},
  {dn:20, dimension:'22 × 1,0', di:20},
  {dn:25, dimension:'28 × 1,5', di:25},
  {dn:32, dimension:'35 × 1,5', di:32},
  {dn:40, dimension:'42 × 1,5', di:39},
  {dn:50, dimension:'54 × 2,0', di:50},
  {dn:65, dimension:'64 × 2,0', di:60},
  {dn:80, dimension:'76,1 × 2,0', di:72.1},
  {dn:100, dimension:'108 × 2,5', di:103}
];

const meplaDimensions = [
  {dn:12, dimension:'16 × 2,25', di:11.5},
  {dn:15, dimension:'20 × 2,5', di:15},
  {dn:20, dimension:'26 × 3,0', di:20},
  {dn:25, dimension:'32 × 3,0', di:26},
  {dn:32, dimension:'40 × 3,5', di:33},
  {dn:40, dimension:'50 × 4,0', di:42},
  {dn:50, dimension:'63 × 4,5', di:54},
  {dn:65, dimension:'75 × 4,7', di:65.6}
];

export const pipeSystems = [
  { id:'steel', label:'Stahl', normSmall:'DIN EN 10255 Reihe M', normLarge:'DIN EN 10220', roughness:0.045, maxDn:300, dimensions: steelDimensions },
  { id:'copper', label:'Kupferrohr', normSmall:'DIN EN 1057', normLarge:'DIN EN 1057', roughness:0.045, maxDn:100, dimensions: copperDimensions },
  { id:'mapress', label:'Mapress Edelstahl', normSmall:'DIN EN 10312', normLarge:'DIN EN 10312', roughness:0.0015, maxDn:100, dimensions: mapressDimensions },
  { id:'mepla', label:'Geberit Mepla', normSmall:'Geberit Mepla Systemrohr ML', normLarge:'Geberit Mepla Systemrohr ML', roughness:0.007, maxDn:65, dimensions: meplaDimensions },
  { id:'plastic', label:'Kunststoff', normSmall:'Systemabhängig', normLarge:'Systemabhängig', roughness:0.007, maxDn:160, dimensions: steelDimensions.filter(p => p.dn <= 150) }
];
export const dnTable = steelDimensions;

function swameeJainFriction(re, relativeRoughness) {
  if (!Number.isFinite(re) || re <= 0) return 0;
  if (re < 2300) return 64 / re;
  return 0.25 / Math.pow(Math.log10(relativeRoughness / 3.7 + 5.74 / Math.pow(re, 0.9)), 2);
}

function pipeHydraulics(p, flowM3s, rho, roughnessMm = 0.045) {
  const mu = 0.001;
  const d = p.di / 1000;
  const area = Math.PI * d * d / 4;
  const velocity = flowM3s / area;
  const re = rho * velocity * d / mu;
  const rel = (roughnessMm / 1000) / d;
  const f = swameeJainFriction(re, rel);
  const pressureLoss = f * rho * velocity * velocity / (2 * d);
  return { velocity, pressureLoss, re };
}

function rating(pressureLoss, maxPressurePam) {
  if (pressureLoss === null || pressureLoss === undefined || !Number.isFinite(pressureLoss)) return { key:'none', label:'—' };
  const ratio = pressureLoss / (Number(maxPressurePam) || 100);
  if (ratio < .75) return { key:'green', label:'grün' };
  if (ratio <= 1) return { key:'yellow', label:'gelb' };
  return { key:'red', label:'rot' };
}

export function recommendPipe({ massFlowKgh, volumeFlowM3h, flowValue, flowUnit = 'kg/h', maxPressurePam = 100, systemId = 'steel', density = 998 }) {
  const system = pipeSystems.find(p=>p.id===systemId) || pipeSystems[0];
  const rho = Number(density) || 998;
  let mass = parseNumber(massFlowKgh);
  let volume = parseNumber(volumeFlowM3h);
  const combined = parseNumber(flowValue);
  if (combined && flowUnit === 'kg/h') mass = combined;
  if (combined && flowUnit === 'm³/h') volume = combined;
  const flowM3s = volume ? volume/3600 : mass ? mass/rho/3600 : 0;
  if (!flowM3s) return null;

  const dimensions = (system.dimensions || dnTable).filter(x=>x.dn <= system.maxDn);
  const candidates = dimensions.map((p, index) => {
    const h = pipeHydraulics(p, flowM3s, rho, system.roughness);
    return { ...p, ...h, index, norm: p.dn <= 50 ? system.normSmall : system.normLarge, system, rating: rating(h.pressureLoss, maxPressurePam) };
  });
  const current = candidates.find(p => p.pressureLoss <= maxPressurePam);
  if (!current) {
    return {
      system,
      noDimension: true,
      candidates,
      maxPressurePam: Number(maxPressurePam) || 100,
      highest: candidates[candidates.length - 1] || null
    };
  }
  const smaller = candidates[current.index - 1] || null;
  const larger = candidates[current.index + 1] || null;
  return { ...current, smaller, larger, candidates, maxPressurePam: Number(maxPressurePam) || 100 };
}
