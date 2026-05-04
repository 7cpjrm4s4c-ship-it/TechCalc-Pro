/**
 * TechCalc Pro - MAG Druckhaltung Module v2 (FIXED)
 * DIN EN 12828
 */

// ════════════════════════════════════════════════════════════════
// BERECHNUNGEN (100% unverändert)
// ════════════════════════════════════════════════════════════════

function expansionCoeff(tMin, tMax) {
  let alpha = 0.0004;
  return alpha * (tMax - tMin);
}

function calcMAG() {
  let volume = window.parseNum(window.$('mag-volume')?.value) || 100;
  let tMin = window.parseNum(window.$('mag-tmin')?.value) || 10;
  let tMax = window.parseNum(window.$('mag-tmax')?.value) || 90;

  let alpha = expansionCoeff(tMin, tMax);
  let VExp = volume * alpha;

  window.$('mag-vexp').innerHTML = window.loc(VExp, 2);
  window.$('mag-p0').innerHTML = window.loc(tMin + 0.3, 1);
}

// ════════════════════════════════════════════════════════════════
// UI AUFBAU
// ════════════════════════════════════════════════════════════════

function buildMAGUI() {
  const container = window.$('mag-section');
  if (!container) {
    console.warn('⚠️  mag-section not found');
    return;
  }

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
  window.$('mag-volume')?.addEventListener('input', calcMAG);
  window.$('mag-tmin')?.addEventListener('input', calcMAG);
  window.$('mag-tmax')?.addEventListener('input', calcMAG);
  calcMAG();
}

document.addEventListener('DOMContentLoaded', initMAG);

window.calcMAG = calcMAG;
window.expansionCoeff = expansionCoeff;
