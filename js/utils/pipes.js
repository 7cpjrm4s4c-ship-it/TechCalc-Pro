export const pipeSystems = [
  { id:'steel', label:'Stahl', normSmall:'DIN EN 10255 Reihe M', normLarge:'DIN EN 10220', roughness:0.045, maxDn:300 },
  { id:'mapress', label:'Mapress Edelstahl', normSmall:'DIN EN 10312', normLarge:'DIN EN 10312', roughness:0.015, maxDn:100 },
  { id:'plastic', label:'Kunststoff', normSmall:'Systemabhängig', normLarge:'Systemabhängig', roughness:0.007, maxDn:160 }
];
export const dnTable = [
  {dn:15, di:16}, {dn:20, di:21.6}, {dn:25, di:27.2}, {dn:32, di:35.9}, {dn:40, di:41.8}, {dn:50, di:53}, {dn:65, di:70.3}, {dn:80, di:82.5}, {dn:100, di:107.1}, {dn:125, di:131.7}, {dn:150, di:159.3}, {dn:200, di:207.3}, {dn:250, di:260.4}, {dn:300, di:309.7}
];
export function recommendPipe({ massFlowKgh, volumeFlowM3h, maxPressurePam = 100, systemId = 'steel' }) {
  const system = pipeSystems.find(p=>p.id===systemId) || pipeSystems[0];
  const flowM3s = volumeFlowM3h ? Number(volumeFlowM3h)/3600 : Number(massFlowKgh || 0)/998/3600;
  if (!flowM3s) return null;
  const rho = 998, mu = 0.001;
  for (const p of dnTable.filter(x=>x.dn <= system.maxDn)) {
    const d = p.di/1000; const area = Math.PI*d*d/4; const v = flowM3s/area;
    const re = rho*v*d/mu; const f = re < 2300 ? 64/re : 0.3164/Math.pow(re, .25);
    const dp = f * rho * v*v / (2*d);
    if (dp <= maxPressurePam) return { ...p, velocity: v, pressureLoss: dp, norm: p.dn <= 50 ? system.normSmall : system.normLarge, system };
  }
  const last = dnTable[dnTable.length-1]; return { ...last, velocity:null, pressureLoss:null, norm: system.normLarge, system, oversized:true };
}
