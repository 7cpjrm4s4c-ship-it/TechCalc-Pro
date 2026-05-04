/**
 * TechCalc Pro - HX-Engine (Mollier) Module v2 (FIXED)
 * Psychrometrische Berechnungen + Canvas Placeholder (Phase 4)
 */

// ════════════════════════════════════════════════════════════════
// PSYCHROMETRIE (Placeholder für Phase 4)
// ════════════════════════════════════════════════════════════════

function hxCalculateAirState(t, phi) {
  // Placeholder für Phase 4
  // In Phase 4: Vollständige psychrometrische Berechnung + Canvas
  return {
    t: t,
    phi: phi,
    status: 'Phase 4: Canvas Mollier Diagram'
  };
}

function calcHXEngine() {
  let t1 = window.parseNum(window.$('hx-t1')?.value) || 20;
  let phi1 = window.parseNum(window.$('hx-phi1')?.value) || 50;

  let state = hxCalculateAirState(t1, phi1);

  window.$('hx-result').innerHTML = 
    `T: ${window.loc(state.t, 1)}°C, φ: ${window.loc(state.phi, 1)}%`;
}

// ════════════════════════════════════════════════════════════════
// UI AUFBAU (Placeholder für Canvas Phase 4)
// ════════════════════════════════════════════════════════════════

function buildHXEngineUI() {
  const container = window.$('hx-section');
  if (!container) {
    console.warn('⚠️  hx-section not found');
    return;
  }

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
    'Canvas-basiertes Mollier-Diagramm wird in Phase 4 hinzugefügt. Aktuell: Psychrometrische Berechnungen.'
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
  window.$('hx-t1')?.addEventListener('input', calcHXEngine);
  window.$('hx-phi1')?.addEventListener('input', calcHXEngine);
  calcHXEngine();
}

document.addEventListener('DOMContentLoaded', initHXEngine);

window.hxCalculateAirState = hxCalculateAirState;
window.calcHXEngine = calcHXEngine;
