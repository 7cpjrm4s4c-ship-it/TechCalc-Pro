/**
 * TechCalc Pro - Heating-Cooling v2 PURE
 * Keine UI.* Dependencies - pure HTML strings
 */

function lambdaCW(Re, rr) {
  if (Re < 2300) return 64 / Re;
  let x = Math.log10(rr / 3.71 + 5.74 / Math.pow(Re, 0.9)) * (-2);
  return Math.pow(10, x);
}

function pdrop(lam, l, d, rho, v) {
  if (d <= 0 || v <= 0) return 0;
  return lam * (l / d) * (rho * v * v) / 2 / 100000;
}

function hcCalcPure(container) {
  if (!container) return;
  
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 3) return;

  let q = window.parseNum(inputs[0]?.value) || 0;
  let dt = window.parseNum(inputs[1]?.value) || 1;
  let m = window.parseNum(inputs[2]?.value) || 0;

  if (q <= 0 || dt <= 0 || m <= 0) {
    const resultSpans = container.querySelectorAll('.result-value');
    resultSpans.forEach(span => span.textContent = '–');
    return;
  }

  let d = Math.sqrt((4 * m) / (1000 * 3.14159 * 1.0)) * 1000;
  let v = (m / 1000) / (3.14159 * Math.pow(d / 1000, 2) / 4);
  let Re = (v * (d / 1000)) / 0.001;
  let lam = lambdaCW(Re, 0.045 / d);
  let pv = pdrop(lam, 10, d / 1000, 1000, v);

  const resultSpans = container.querySelectorAll('.result-value');
  if (resultSpans.length >= 3) {
    resultSpans[0].textContent = window.loc(pv, 3);
    resultSpans[1].textContent = window.loc(v, 2);
    resultSpans[2].textContent = window.loc(d, 1);
  }
}

function buildHeatingCoolingUI() {
  const container = window.$('hc-section');
  if (!container) {
    console.warn('❌ hc-section not found');
    return;
  }

  let html = `
    <div style="padding: 20px;">
      <h2 style="margin-top: 0; color: #90caf9;">Heizung / Kälte</h2>
      
      <div style="margin-bottom: 20px; padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <label style="display: block; color: #90caf9; font-size: 12px; margin-bottom: 5px;">Leistung (kW)</label>
        <input type="number" value="100" min="1" max="1000" step="10" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
        
        <label style="display: block; color: #90caf9; font-size: 12px; margin-top: 15px; margin-bottom: 5px;">Temperaturdifferenz (K)</label>
        <input type="number" value="10" min="1" max="50" step="1" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
        
        <label style="display: block; color: #90caf9; font-size: 12px; margin-top: 15px; margin-bottom: 5px;">Massenstrom (kg/h)</label>
        <input type="number" value="1000" min="10" max="10000" step="100" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
      </div>

      <div style="padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #90caf9; font-size: 14px;">Ergebnisse</h3>
        
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a5a7f;">
          <span style="color: #90caf9;">Druckverlust (10m)</span>
          <span style="color: white;"><span class="result-value">–</span> bar</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a5a7f;">
          <span style="color: #90caf9;">Strömungsgeschwindigkeit</span>
          <span style="color: white;"><span class="result-value">–</span> m/s</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 10px 0;">
          <span style="color: #90caf9;">Rohrdurchmesser</span>
          <span style="color: white;"><span class="result-value">–</span> mm</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ Heating-Cooling v2 rendered');
}

function initHeatingCooling() {
  buildHeatingCoolingUI();
  const container = window.$('hc-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => hcCalcPure(container));
    input.addEventListener('change', () => hcCalcPure(container));
  });

  hcCalcPure(container);
}

document.addEventListener('DOMContentLoaded', initHeatingCooling);

window.hcCalcPure = hcCalcPure;
window.lambdaCW = lambdaCW;
window.pdrop = pdrop;
