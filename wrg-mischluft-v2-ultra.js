/**
 * TechCalc Pro - WRG Module v2 (ULTRA ROBUST)
 */

function _pws(t) {
  return 610.5 * Math.exp((17.27 * t) / (t + 237.3));
}

function _x(t, phi) {
  let pws = _pws(t);
  let pw = (phi / 100) * pws;
  return (0.622 * pw) / (101325 - pw);
}

function calcWRGUltra(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 2) return;

  let tAbluft = window.parseNum(inputs[0]?.value) || 20;
  let eta = window.parseNum(inputs[1]?.value) || 0.8;

  let tZuluft = tAbluft * eta;
  
  const results = container.querySelectorAll('[class*="result"]');
  if (results.length >= 1) {
    results[0].innerHTML = window.loc(tZuluft, 1);
  }
}

function buildWRGUI() {
  const container = window.$('wrg-section');
  if (!container) return;

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

  container.innerHTML = 
    title +
    UI.Card('Eingaben', inputAbT + inputEta) +
    UI.Card('Ergebnisse', resultZuT);

  console.log('✅ WRG v2 initialized');
}

function initWRG() {
  buildWRGUI();

  const container = window.$('wrg-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcWRGUltra(container));
    input.addEventListener('change', () => calcWRGUltra(container));
  });

  calcWRGUltra(container);
}

document.addEventListener('DOMContentLoaded', initWRG);

window.calcWRGUltra = calcWRGUltra;
window._pws = _pws;
window._x = _x;
