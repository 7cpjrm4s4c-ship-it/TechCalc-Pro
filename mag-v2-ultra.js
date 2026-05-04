/**
 * TechCalc Pro - MAG Module v2 (ULTRA ROBUST)
 */

function expansionCoeff(tMin, tMax) {
  let alpha = 0.0004;
  return alpha * (tMax - tMin);
}

function calcMAGUltra(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 3) return;

  let volume = window.parseNum(inputs[0]?.value) || 100;
  let tMin = window.parseNum(inputs[1]?.value) || 10;
  let tMax = window.parseNum(inputs[2]?.value) || 90;

  let alpha = expansionCoeff(tMin, tMax);
  let VExp = volume * alpha;

  const results = container.querySelectorAll('[class*="result"]');
  if (results.length >= 2) {
    results[0].innerHTML = window.loc(VExp, 2);
    results[1].innerHTML = window.loc(tMin + 0.3, 1);
  }
}

function buildMAGUI() {
  const container = window.$('mag-section');
  if (!container) return;

  const title = UI.SectionTitle('MAG Druckhaltung');

  const inputVolume = UI.InputGroup('Anlagenvolumen (L)', 'mag-volume', {
    value: 100,
    min: 10,
    max: 10000,
    step: 10,
    unit: 'L'
  });

  const inputTMin = UI.InputGroup('Min. Temperatur (°C)', 'mag-tmin', {
    value: 10,
    min: 0,
    max: 50,
    step: 1,
    unit: '°C'
  });

  const inputTMax = UI.InputGroup('Max. Temperatur (°C)', 'mag-tmax', {
    value: 90,
    min: 50,
    max: 120,
    step: 1,
    unit: '°C'
  });

  const resultVExp = UI.ResultCard('Expansionsvolumen', 'mag-vexp', {
    value: '–',
    unit: 'L',
    color: 'blue'
  });

  const resultP0 = UI.ResultCard('Vordruck (p0)', 'mag-p0', {
    value: '–',
    unit: 'bar',
    color: 'blue'
  });

  container.innerHTML = 
    title +
    UI.Card('Eingaben', inputVolume + inputTMin + inputTMax) +
    UI.Card('Ergebnisse', resultVExp + resultP0);

  console.log('✅ MAG v2 initialized');
}

function initMAG() {
  buildMAGUI();

  const container = window.$('mag-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcMAGUltra(container));
    input.addEventListener('change', () => calcMAGUltra(container));
  });

  calcMAGUltra(container);
}

document.addEventListener('DOMContentLoaded', initMAG);

window.calcMAGUltra = calcMAGUltra;
window.expansionCoeff = expansionCoeff;
