export const pipeSystems = [
  { id:'steel', label:'Stahl', normSmall:'DIN EN 10255 Reihe M', normLarge:'DIN EN 10220', roughness:0.045, maxDn:300 },
  { id:'mapress', label:'Mapress Edelstahl', normSmall:'DIN EN 10312', normLarge:'DIN EN 10312', roughness:0.015, maxDn:100 },
  { id:'plastic', label:'Kunststoff', normSmall:'Systemabhängig', normLarge:'Systemabhängig', roughness:0.007, maxDn:160 }
];
export const dnTable = [
  {dn:15, di:16}, {dn:20, di:21.6}, {dn:25, di:27.2}, {dn:32, di:35.9}, {dn:40, di:41.8}, {dn:50, di:53}, {dn:65, di:70.3}, {dn:80, di:82.5}, {dn:100, di:107.1}, {dn:125, di:131.7}, {dn:150, di:159.3}, {dn:200, di:207.3}, {dn:250, di:260.4}, {dn:300, di:309.7}
];

function pipeHydraulics(p, flowM3s, rho) {
  const mu = 0.001;
  const d = p.di / 1000;
  const area = Math.PI * d * d / 4;
  const velocity = flowM3s / area;
  const re = rho * velocity * d / mu;
  const f = re < 2300 ? 64 / re : 0.3164 / Math.pow(re, .25);
  const pressureLoss = f * rho * velocity * velocity / (2 * d);
  return { velocity, pressureLoss };
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
  let mass = Number(String(massFlowKgh || '').replace(/\./g,'').replace(',','.'));
  let volume = Number(String(volumeFlowM3h || '').replace(/\./g,'').replace(',','.'));
  const combined = Number(String(flowValue || '').replace(/\./g,'').replace(',','.'));
  if (combined && flowUnit === 'kg/h') mass = combined;
  if (combined && flowUnit === 'm³/h') volume = combined;
  const flowM3s = volume ? volume/3600 : mass ? mass/rho/3600 : 0;
  if (!flowM3s) return null;

  const candidates = dnTable.filter(x=>x.dn <= system.maxDn).map((p, index) => {
    const h = pipeHydraulics(p, flowM3s, rho);
    return { ...p, ...h, index, norm: p.dn <= 50 ? system.normSmall : system.normLarge, system, rating: rating(h.pressureLoss, maxPressurePam) };
  });
  let current = candidates.find(p => p.pressureLoss <= maxPressurePam);
  if (!current) {
    const last = candidates[candidates.length-1];
    current = { ...last, oversized:true };
  }
  const smaller = candidates[current.index - 1] || null;
  const larger = candidates[current.index + 1] || null;
  return { ...current, smaller, larger };
}
