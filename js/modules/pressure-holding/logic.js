import { parseNumber } from '../../core/numberService.js';

const WATER = [
  [0,0,0,1000],[10,0,0,1000],[20,0.13,0,998],[30,0.37,0,996],[40,0.72,0,992],[50,1.15,0,988],[60,1.66,0,983],[70,2.24,0,978],[80,2.88,0,972],[90,3.58,0,965],[100,4.34,0.01,958],[105,4.74,0.43,955],[110,5.15,0.98,951],[120,6.03,1.70,943],[130,6.96,2.61,935],[140,7.96,3.76,926],[150,9.03,5.18,917],[160,10.20,6.30,907]
];
const GLYCOL20 = [[0,0.07,0,1039],[10,0.26,0,1037],[20,0.54,0,1035],[30,0.90,0,1031],[40,1.33,0,1026],[50,1.83,0,1022],[60,2.37,0,1016],[70,2.95,0,1010],[80,3.57,0,1004],[90,4.23,0,998],[100,4.92,0,991],[110,5.64,0.33,985],[120,6.40,0.85,978],[130,7.19,1.52,970],[140,8.02,2.38,963],[150,8.89,3.47,955],[160,9.79,4.38,947]];
const GLYCOL34 = [[0,0.35,0,1066],[10,0.66,0,1063],[20,1.04,0,1059],[30,1.49,0,1054],[40,1.99,0,1049],[50,2.53,0,1043],[60,3.11,0,1037],[70,3.71,0,1031],[80,4.35,0,1025],[90,5.01,0,1019],[100,5.68,0,1012],[110,6.39,0.23,1005],[120,7.11,0.70,999],[130,7.85,1.33,992],[140,8.62,2.13,985],[150,9.41,3.15,978],[160,10.20,4.41,970]];
const STANDARD_VOLUMES = [8,12,18,25,35,50,80,100,140,200,250,300,400,500,600,800,1000,1500,2000,3000,4000,5000];
const REFLEX_N_VOLUMES = [8,12,18,25,35,50,80,100,140,200,250,300,400,500,600,800,1000];

function num(v){ return parseNumber(v, { fallback: 0 }); }
function tableFor(mode){ return mode === 'glycol20' ? GLYCOL20 : mode === 'glycol34' ? GLYCOL34 : WATER; }
function interp(table, t, col){
  const temp = Math.max(table[0][0], Math.min(table[table.length-1][0], num(t)));
  for(let i=1;i<table.length;i++){
    if(temp <= table[i][0]){
      const a=table[i-1], b=table[i], f=(temp-a[0])/(b[0]-a[0] || 1);
      return a[col] + (b[col]-a[col])*f;
    }
  }
  return table[table.length-1][col];
}
function round(v, d=2){ return Number.isFinite(v) ? Math.round(v * 10**d) / 10**d : 0; }
function nextVolume(v){ return STANDARD_VOLUMES.find(x => x >= v) || Math.ceil(v / 500) * 500; }
function reflexNLabel(volume){
  if(!volume || volume <= 0) return '—';
  const n = REFLEX_N_VOLUMES.find(x => x >= volume);
  return n ? `Reflex N ${n}` : `Reflex G/SL ${nextVolume(volume)}`;
}
function dynamicLabel(type, volume){
  const v = nextVolume(volume);
  if(!volume || volume <= 0) return type === 'variomat' ? 'Variomat —' : 'Reflexomat —';
  return type === 'variomat' ? `Variomat, VG Grundgefäß ${v} l` : `Reflexomat, RG Grundgefäß ${v} l`;
}

export function calculate(s){
  const table = tableFor(s.frostMode);
  const nMax = interp(table, s.tMaxC, 1);
  const nMin = interp(table, s.tMinC, 1);
  const expansionPct = Math.max(0, nMax - nMin);
  const vaporPressure = interp(table, s.tMaxC, 2);
  const heightPressure = num(s.staticHeightM) / 10;
  const staticPressure = num(s.staticHeightM) > 0 ? heightPressure : num(s.staticPressureBar);
  const pumpPressure = s.connectionType === 'pressure' ? num(s.pumpPressureBar) : 0;
  const baseVolume = s.waterContentMode === 'estimated'
    ? num(s.heatPowerKw) * num(s.specificWaterContent)
    : num(s.systemVolumeL);
  const systemVolume = Math.max(0, baseVolume + num(s.additionalVolumeL));
  const p0Raw = staticPressure + vaporPressure + (s.connectionType === 'pressure' ? pumpPressure : 0.2);
  const p0 = s.systemType === 'heating' ? Math.max(1, p0Raw) : p0Raw;
  const psv = num(s.safetyValveBar);
  const asv = psv <= 0 ? 0 : psv <= 5 ? 0.5 : 0.1 * psv;
  const pe = Math.max(0, psv - asv);
  const ve = systemVolume * expansionPct / 100;
  const vv = systemVolume > 0 ? Math.max(3, 0.005 * systemVolume) : 0;
  const servitecAdd = s.includeServitec === 'true' ? 5 : 0;
  const denominator = pe - p0;
  const factor = denominator > 0 ? (pe + 1) / denominator : 0;
  const vnMag = denominator > 0 ? (ve + vv + servitecAdd) * factor : 0;
  const ad = s.dynamicType === 'reflexomat' ? 0.2 : 0.4;
  const paMin = p0 + 0.3;
  const peDynamicMin = paMin + ad;
  const vnDynamic = 1.1 * (ve + vv);
  const selected = s.holdingType === 'dynamic' ? vnDynamic : vnMag;
  const warnings = [];
  if(systemVolume <= 0) warnings.push('Anlagenvolumen fehlt.');
  if(psv <= 0) warnings.push('Sicherheitsventil-Ansprechdruck fehlt.');
  if(psv > 0 && pe <= p0) warnings.push('Sicherheitsventil pSV zu klein: Enddruck pe muss größer als Mindestbetriebsdruck p0 sein.');
  if(s.holdingType === 'mag' && denominator <= 0) warnings.push('MAG-Nennvolumen kann erst berechnet werden, wenn pe > p0 ist. Sicherheitsventil größer wählen oder statischen Druck prüfen.');
  if(s.holdingType === 'dynamic' && pe < peDynamicMin) warnings.push('Enddruck pe liegt unter p0 + 0,3 bar + Arbeitsbereich AD. Sicherheitsventil/Station prüfen.');
  if(num(s.tMaxC) > 70) warnings.push('Bei dauerhafter Temperatur > 70 °C am MAG/Vordruckgefäß Vorschaltgefäß prüfen.');
  const standard = selected > 0 ? nextVolume(selected) : 0;
  const productLabel = s.holdingType === 'dynamic' ? dynamicLabel(s.dynamicType, selected) : reflexNLabel(selected);
  return { nMax, nMin, expansionPct, vaporPressure, staticPressure, pumpPressure, systemVolume, p0, p0Raw, psv, asv, pe, ve, vv, servitecAdd, factor, vnMag, ad, paMin, peDynamicMin, vnDynamic, selectedVolume: selected, selectedStandardVolume: standard, productLabel, warnings };
}
