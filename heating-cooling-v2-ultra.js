/**
 * TechCalc Pro - Heating-Cooling Module v2 (ULTRA ROBUST)
 * Strategie: Alle Inputs im Container finden, nicht nach festen IDs suchen
 */

// ════════════════════════════════════════════════════════════════
// BERECHNUNGEN (100% unverändert)
// ════════════════════════════════════════════════════════════════

function lambdaCW(Re, rr) {
  if (Re < 2300) return 64 / Re;
  let x = Math.log10(rr / 3.71 + 5.74 / Math.pow(Re, 0.9)) * (-2);
  return Math.pow(10, x);
}

function pdrop(lam, l, d, rho, v) {
  if (d <= 0 || v <= 0) return 0;
  return lam * (l / d) * (rho * v * v) / 2 / 100000;
}

// ════════════════════════════════════════════════════════════════
// ULTRA-ROBUSTER RECHNER (findet alle Inputs im Container)
// ════════════════════════════════════════════════════════════════

function hcCalcUltra(container) {
  if (!container) return;

  // Finde alle Input-Felder im Container
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 3) {
    console.warn('⚠️  Heating-Cooling: Nicht alle Input-Felder gefunden');
    return;
  }

  // Lese Werte aus den Inputs (erste 3)
  let q = window.parseNum(inputs[0]?.value) || 0;
  let dt = window.parseNum(inputs[1]?.value) || 1;
  let m = window.parseNum(inputs[2]?.value) || 0;

  console.log('HC Calc:', { q, dt, m });

  if (q <= 0 || dt <= 0 || m <= 0) {
    // Setze placeholder "–"
    const resultDivs = container.querySelectorAll('[class*="result"]');
    resultDivs.forEach(div => div.innerHTML = '–');
    return;
  }

  // Berechnungen
  let d = Math.sqrt((4 * m) / (1000 * 3.14159 * 1.0)) * 1000;
  let v = (m / 1000) / (3.14159 * Math.pow(d / 1000, 2) / 4);
  let Re = (v * (d / 1000)) / 0.001;
  let lam = lambdaCW(Re, 0.045 / d);
  let pv = pdrop(lam, 10, d / 1000, 1000, v);

  // Schreibe Ergebnisse: Suche nach divs die mit "–" gefüllt sind
  const resultElements = container.querySelectorAll('[class*="result"], [class*="Result"]');
  if (resultElements.length >= 3) {
    resultElements[0].innerHTML = window.loc(pv, 3);
    resultElements[1].innerHTML = window.loc(v, 2);
    resultElements[2].innerHTML = window.loc(d, 1);
  } else {
    // Fallback: Suche nach span/div die nur "–" enthalten
    const allDivs = container.querySelectorAll('div, span');
    let resultCount = 0;
    allDivs.forEach(el => {
      if (el.textContent.trim() === '–' && resultCount < 3) {
        if (resultCount === 0) el.innerHTML = window.loc(pv, 3);
        else if (resultCount === 1) el.innerHTML = window.loc(v, 2);
        else if (resultCount === 2) el.innerHTML = window.loc(d, 1);
        resultCount++;
      }
    });
  }
}

// ════════════════════════════════════════════════════════════════
// UI AUFBAU
// ════════════════════════════════════════════════════════════════

function buildHeatingCoolingUI() {
  const container = window.$('hc-section');
  if (!container) {
    console.warn('⚠️  hc-section not found');
    return;
  }

  const title = UI.SectionTitle('Heizung / Kälte');

  const inputQ = UI.InputGroup('Leistung (kW)', 'hc-q', {
    value: 100,
    min: 1,
    max: 1000,
    step: 10,
    unit: 'kW'
  });

  const inputDT = UI.InputGroup('Temperaturdifferenz (K)', 'hc-dt', {
    value: 10,
    min: 1,
    max: 50,
    step: 1,
    unit: 'K'
  });

  const inputM = UI.InputGroup('Massenstrom (kg/h)', 'hc-m', {
    value: 1000,
    min: 10,
    max: 10000,
    step: 100,
    unit: 'kg/h'
  });

  const resultPDrop = UI.ResultCard('Druckverlust (10m)', 'hc-pdrop', {
    value: '–',
    unit: 'bar',
    color: 'blue'
  });

  const resultV = UI.ResultCard('Strömungsgeschwindigkeit', 'hc-v', {
    value: '–',
    unit: 'm/s',
    color: 'blue'
  });

  const resultD = UI.ResultCard('Rohrdurchmesser', 'hc-d', {
    value: '–',
    unit: 'mm',
    color: 'blue'
  });

  container.innerHTML = 
    title +
    UI.Card('Eingaben', inputQ + inputDT + inputM) +
    UI.Card('Ergebnisse', resultPDrop + resultV + resultD);

  // WICHTIG: Speichere container-Referenz für Event Listeners
  container.hcContainer = container;

  console.log('✅ Heating-Cooling v2 initialized');
}

// ════════════════════════════════════════════════════════════════
// EVENT LISTENER (ULTRA-ROBUST)
// ════════════════════════════════════════════════════════════════

function initHeatingCooling() {
  buildHeatingCoolingUI();

  const container = window.$('hc-section');
  if (!container) return;

  // Finde ALLE Input-Felder und bind Event Listener
  const inputs = container.querySelectorAll('input');
  console.log(`Found ${inputs.length} inputs in hc-section`);

  inputs.forEach(input => {
    input.addEventListener('input', () => hcCalcUltra(container));
    input.addEventListener('change', () => hcCalcUltra(container));
  });

  // Initial calculation
  hcCalcUltra(container);
}

// ════════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', initHeatingCooling);

// Export
window.hcCalcUltra = hcCalcUltra;
window.lambdaCW = lambdaCW;
window.pdrop = pdrop;
