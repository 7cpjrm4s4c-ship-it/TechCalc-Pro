const FACTORS = {
  water: 14.32,
  ethylene: { 20: 15.89, 25: 16.41, 30: 16.96, 35: 17.55, 40: 18.15, 45: 18.87, 50: 19.57 },
  propylene: { 25: 15.72, 30: 16.07, 35: 16.44, 40: 16.86, 45: 17.35, 50: 17.91 }
};

const STANDARD_VOLUMES = [50, 80, 100, 140, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000];

function num(value){
  const n = Number(String(value ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
function round(value, digits = 2){
  return Number.isFinite(value) ? Math.round(value * 10 ** digits) / 10 ** digits : 0;
}
function nextStandardVolume(value){
  if(!Number.isFinite(value) || value <= 0) return 0;
  return STANDARD_VOLUMES.find(item => item >= value) || Math.ceil(value / 5000) * 5000;
}
function glycolFactor(type, concentration){
  const table = FACTORS[type] || FACTORS.ethylene;
  const c = String(concentration || '35');
  if(table[c]) return table[c];
  const keys = Object.keys(table).map(Number).sort((a,b)=>a-b);
  const target = num(concentration);
  if(target <= keys[0]) return table[keys[0]];
  if(target >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
  for(let i=1;i<keys.length;i++){
    if(target <= keys[i]){
      const a = keys[i-1], b = keys[i];
      const f = (target - a) / (b - a || 1);
      return table[a] + (table[b] - table[a]) * f;
    }
  }
  return table[keys[0]];
}
export function factorFor(s){
  return s.mediumMode === 'water' ? FACTORS.water : glycolFactor(s.glycolType, s.glycolConcentration);
}
export function nextVolume(value){ return nextStandardVolume(value); }

export function calculate(s){
  const factor = factorFor(s);
  const existing = Math.max(0, num(s.existingSystemVolumeL));

  const qMax = num(s.qMaxKw);
  const partLoadRaw = Math.max(0, num(s.partLoadFactor));
  const partLoad = partLoadRaw > 1 ? partLoadRaw / 100 : partLoadRaw;
  const qLoad = Math.max(0, num(s.qLoadKw));
  const runTime = Math.max(0, num(s.compressorRunTimeMin));
  const dtReg = Math.max(0, num(s.controllerDeltaT));
  const runtimePower = Math.max(0, qMax * partLoad - qLoad);
  const runtimeSystemVolume = dtReg > 0 ? runtimePower * factor * runTime / dtReg : 0;
  const runtimeBufferVolume = Math.max(0, runtimeSystemVolume - existing);

  const qConsumer = Math.max(0, num(s.qConsumerKw));
  const qDefrost = Math.max(0, num(s.qDefrostKw));
  const qHeating = Math.max(0, num(s.qHeatingCircuitKw));
  const defrostTime = Math.max(0, num(s.maxDefrostTimeMin));
  const dtHyd = Math.max(0, num(s.hydraulicDeltaT));
  const defrostPower = Math.max(0, qConsumer + qDefrost - qHeating);
  const defrostSystemVolume = dtHyd > 0 ? defrostPower * factor * defrostTime / dtHyd : 0;
  const defrostBufferVolume = Math.max(0, defrostSystemVolume - existing);

  const flow = Math.max(0, num(s.consumerFlowM3h));
  const bridgeTime = Math.max(0, num(s.bridgeTimeMin));
  const reserveVolume = flow * bridgeTime * 1000 / 60;

  const selectedByMode = s.calculationMode === 'defrost' ? defrostBufferVolume : s.calculationMode === 'reserve' ? reserveVolume : runtimeBufferVolume;
  const decisive = s.calculationMode === 'compare' ? Math.max(runtimeBufferVolume, defrostBufferVolume, reserveVolume) : selectedByMode;
  const decisiveSystem = s.calculationMode === 'defrost' ? defrostSystemVolume : s.calculationMode === 'reserve' ? reserveVolume : s.calculationMode === 'compare' ? Math.max(runtimeSystemVolume, defrostSystemVolume, reserveVolume) : runtimeSystemVolume;

  const warnings = [];
  if(s.calculationMode === 'runtime' || s.calculationMode === 'compare'){
    if(qMax <= 0) warnings.push('Maximale Geraete-/Kaelte- bzw. Heizleistung fehlt.');
    if(partLoad <= 0) warnings.push('Teillastfaktor der kleinsten Leistungsstufe fehlt.');
    if(partLoadRaw > 100) warnings.push('Teillastfaktor f ist groesser als 100 %. Eingabe pruefen.');
    if(dtReg <= 0) warnings.push('DeltaT Hydraulikkreislauf fehlt.');
    if(runtimePower <= 0 && qMax > 0) warnings.push('Konstante Lastabnahme ist groesser/gleich der kleinsten Teillaststufe; Puffervolumen fuer Mindestlaufzeit wird 0 l.');
  }
  if(s.calculationMode === 'defrost' || s.calculationMode === 'compare'){
    if(dtHyd <= 0) warnings.push('Hydraulische Temperaturdifferenz fuer den Abtaubetrieb fehlt.');
    if(defrostPower <= 0 && (qConsumer > 0 || qDefrost > 0)) warnings.push('Abtau-Leistungsbilanz ergibt kein zusaetzliches Puffervolumen.');
  }
  if(s.calculationMode === 'reserve' || s.calculationMode === 'compare'){
    if(flow <= 0) warnings.push('Volumenstrom der Verbraucher fuer die Wasservorlage fehlt.');
    if(bridgeTime <= 0) warnings.push('Ueberbrueckungszeit fuer die Wasservorlage fehlt.');
  }
  if(s.mediumMode !== 'water') warnings.push('Glykolbetrieb: Faktor wurde gemaess Tabelle der Berechnungsunterlage angepasst. Herstellerangaben pruefen.');

  return {
    factor,
    existingSystemVolume: existing,
    runtimePower: round(runtimePower, 3),
    runtimeSystemVolume: round(runtimeSystemVolume, 1),
    runtimeBufferVolume: round(runtimeBufferVolume, 1),
    defrostPower: round(defrostPower, 3),
    defrostSystemVolume: round(defrostSystemVolume, 1),
    defrostBufferVolume: round(defrostBufferVolume, 1),
    reserveVolume: round(reserveVolume, 1),
    decisiveVolume: round(decisive, 1),
    decisiveSystemVolume: round(decisiveSystem, 1),
    nextStandardVolume: nextStandardVolume(decisive),
    warnings
  };
}
