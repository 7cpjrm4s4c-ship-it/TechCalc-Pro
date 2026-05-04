/**
 * TechCalc Pro - WRG & Mischluft Module v2 (FIXED)
 * Psychrometrische Berechnungen
 */

// ════════════════════════════════════════════════════════════════
// PSYCHROMETRIE (100% unverändert)
// ════════════════════════════════════════════════════════════════

function _pws(t) {
  return 610.5 * Math.exp((17.27 * t) / (t + 237.3));
}

function _x(t, phi) {
  let pws = _pws(t);
  let pw = (phi / 100) * pws;
  return (0.622 * pw) / (101325 - pw);
}

function _h(t, x) {
  return 1.006 * t + x * (2501 + 1.86 * t);
}

function _phi(t, x) {
  let pws = _pws(t);
  let pw = (x / (0.622 + x)) * 101325;
  return (pw / pws) * 100;
}

function calcWRG() {
  let tAbluft = window.parseNum(window.$('wrg-ab-t')?.value) || 20;
  let eta = window.parseNum(window.$('wrg-eta')?.value) || 0.8;

  let tZuluft = tAbluft * eta;
  
  window.$('wrg-zu-t').innerHTML = window.loc(tZuluft, 1);
}

function calcMix() {
  let t1 = window.parseNum(window.$('mix-t1')?.value) || 20;
  let x1 = _x(t1, 50);
  let t2 = window.parseNum(window.$('mix-t2')?.value) || 5;
  let x2 = _x(t2, 80);

  let tMix = (t1 + t2) / 2;
  let xMix = (x1 + x2) / 2;

  window.$('mix-t-result').innerHTML = window.loc(tMix, 1);
  window.$('mix-x-result').innerHTML = window.loc(xMix, 3);
}

// ════════════════════════════════════════════════════════════════
// UI AUFBAU
// ════════════════════════════════════════════════════════════════

function buildWRGUI() {
  const container = window.$('wrg-section');
  if (!container) {
    console.warn('⚠️  wrg-section not found');
    return;
  }

  const title = UI.SectionTitle('WRG & Mischluft');

  const inputAbT = UI.InputGroup('Abluft Temperatur (°C)', 'wrg-ab-t', {
    value: 20,
    min: -20,
    max: 50,
    step: 1,
    unit: '°C'
  });

  const inputEta = UI.InputGroup('WRG Wirkungsgrad', 'wrg-eta', {
    value: 0.8,
    min: 0.5,
    max: 0.95,
    step: 0.05,
    unit: '–'
  });

  const resultZuT = UI.ResultCard('Zuluft Temperatur', 'wrg-zu-t', {
    value: '–',
    unit: '°C',
    color: 'blue'
  });

  const inputT1 = UI.InputGroup('Temperatur 1 (°C)', 'mix-t1', {
    value: 20,
    min: -20,
    max: 50,
    step: 1,
    unit: '°C'
  });

  const inputT2 = UI.InputGroup('Temperatur 2 (°C)', 'mix-t2', {
    value: 5,
    min: -20,
    max: 50,
    step: 1,
    unit: '°C'
  });

  const resultMixT = UI.ResultCard('Mischtemperatur', 'mix-t-result', {
    value: '–',
    unit: '°C',
    color: 'blue'
  });

  const resultMixX = UI.ResultCard('Misch Feuchte', 'mix-x-result', {
    value: '–',
    unit: 'g/kg',
    color: 'blue'
  });

  container.innerHTML = 
    title +
    UI.Card('WRG Berechnung', inputAbT + inputEta + resultZuT) +
    UI.Card('Mischluft', inputT1 + inputT2 + resultMixT + resultMixX);

  console.log('✅ WRG v2 initialized');
}

function initWRG() {
  buildWRGUI();
  window.$('wrg-ab-t')?.addEventListener('input', calcWRG);
  window.$('wrg-eta')?.addEventListener('input', calcWRG);
  window.$('mix-t1')?.addEventListener('input', calcMix);
  window.$('mix-t2')?.addEventListener('input', calcMix);
  calcWRG();
  calcMix();
}

document.addEventListener('DOMContentLoaded', initWRG);

window.calcWRG = calcWRG;
window.calcMix = calcMix;
window._pws = _pws;
window._x = _x;
window._h = _h;
window._phi = _phi;
