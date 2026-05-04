/**
 * TechCalc Pro - HX-Engine Module v2 (ULTRA ROBUST)
 * Placeholder für Phase 4 Canvas
 */

function hxCalculateAirStateUltra(t, phi) {
  return {
    t: t,
    phi: phi,
    status: 'Phase 4: Canvas Mollier'
  };
}

function calcHXEngineUltra(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 2) return;

  let t1 = window.parseNum(inputs[0]?.value) || 20;
  let phi1 = window.parseNum(inputs[1]?.value) || 50;

  let state = hxCalculateAirStateUltra(t1, phi1);

  const results = container.querySelectorAll('[class*="result"]');
  if (results.length >= 1) {
    results[0].innerHTML = `T: ${window.loc(state.t, 1)}°C, φ: ${window.loc(state.phi, 1)}%`;
  }
}

function buildHXEngineUI() {
  const container = window.$('hx-section');
  if (!container) return;

  const title = UI.SectionTitle('HX-Engine (Mollier)');

  const inputT1 = UI.InputGroup('Temperatur (°C)', 'hx-t1', {
    value: 20,
    min: -20,
    max: 50,
    step: 1,
    unit: '°C'
  });

  const inputPhi1 = UI.InputGroup('Relative Feuchte (%)', 'hx-phi1', {
    value: 50,
    min: 10,
    max: 100,
    step: 5,
    unit: '%'
  });

  const resultState = UI.ResultCard('Zustand', 'hx-result', {
    value: '–',
    unit: '–',
    color: 'blue'
  });

  const info = UI.InfoBox(
    'Phase 4 Feature',
    'Canvas-basiertes Mollier-Diagramm wird in Phase 4 hinzugefügt.'
  );

  container.innerHTML = 
    title +
    UI.Card('Eingaben', inputT1 + inputPhi1) +
    UI.Card('Ergebnisse', resultState) +
    info;

  console.log('✅ HX-Engine v2 initialized');
}

function initHXEngine() {
  buildHXEngineUI();

  const container = window.$('hx-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcHXEngineUltra(container));
    input.addEventListener('change', () => calcHXEngineUltra(container));
  });

  calcHXEngineUltra(container);
}

document.addEventListener('DOMContentLoaded', initHXEngine);

window.hxCalculateAirStateUltra = hxCalculateAirStateUltra;
window.calcHXEngineUltra = calcHXEngineUltra;
