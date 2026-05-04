/**
 * TechCalc Pro - Ventilation Module v2 (ULTRA ROBUST)
 */

function rhoAir(t) {
  return 1.2 * (273 / (273 + t));
}

function calcLuftUltra(container) {
  if (!container) return;

  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 2) return;

  let v = window.parseNum(inputs[0]?.value) || 0;
  let tzlH = window.parseNum(inputs[1]?.value) || 20;

  if (v <= 0) {
    const results = container.querySelectorAll('[class*="result"]');
    results.forEach(el => el.innerHTML = '–');
    return;
  }

  let rho = rhoAir(tzlH);
  let Q = (v * rho) / 1.2;
  let qOut = (Q * 1.2 * 35) / 3600;

  const results = container.querySelectorAll('[class*="result"]');
  if (results.length >= 2) {
    results[0].innerHTML = window.loc(Q, 2);
    results[1].innerHTML = window.loc(qOut, 2);
  }
}

function buildVentilationUI() {
  const container = window.$('vent-section');
  if (!container) return;

  const title = UI.SectionTitle('Lüftung');

  const inputV = UI.InputGroup('Volumenstrom (m³/h)', 'vent-v', {
    value: 5000,
    min: 100,
    max: 50000,
    step: 500,
    unit: 'm³/h'
  });

  const inputT = UI.InputGroup('Zuluft Temperatur (°C)', 'vent-tzl-h', {
    value: 20,
    min: -20,
    max: 50,
    step: 1,
    unit: '°C'
  });

  const resultQ = UI.ResultCard('Luftmassenstrom', 'vent-q', {
    value: '–',
    unit: 'kg/h',
    color: 'blue'
  });

  const resultPower = UI.ResultCard('Leistung', 'vent-leistung', {
    value: '–',
    unit: 'kW',
    color: 'blue'
  });

  container.innerHTML = 
    title +
    UI.Card('Eingaben', inputV + inputT) +
    UI.Card('Ergebnisse', resultQ + resultPower);

  console.log('✅ Ventilation v2 initialized');
}

function initVentilation() {
  buildVentilationUI();

  const container = window.$('vent-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcLuftUltra(container));
    input.addEventListener('change', () => calcLuftUltra(container));
  });

  calcLuftUltra(container);
}

document.addEventListener('DOMContentLoaded', initVentilation);

window.calcLuftUltra = calcLuftUltra;
window.rhoAir = rhoAir;
