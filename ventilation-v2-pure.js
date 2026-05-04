/**
 * TechCalc Pro - Ventilation v2 PURE
 */

function rhoAir(t) {
  return 1.2 * (273 / (273 + t));
}

function calcLuftPure(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 2) return;

  let v = window.parseNum(inputs[0]?.value) || 0;
  let tzlH = window.parseNum(inputs[1]?.value) || 20;

  if (v <= 0) {
    const results = container.querySelectorAll('.result-value');
    results.forEach(el => el.textContent = '–');
    return;
  }

  let rho = rhoAir(tzlH);
  let Q = (v * rho) / 1.2;
  let qOut = (Q * 1.2 * 35) / 3600;

  const results = container.querySelectorAll('.result-value');
  if (results.length >= 2) {
    results[0].textContent = window.loc(Q, 2);
    results[1].textContent = window.loc(qOut, 2);
  }
}

function buildVentilationUI() {
  const container = window.$('vent-section');
  if (!container) return;

  let html = `
    <div style="padding: 20px;">
      <h2 style="margin-top: 0; color: #90caf9;">Lüftung</h2>
      
      <div style="margin-bottom: 20px; padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <label style="display: block; color: #90caf9; font-size: 12px; margin-bottom: 5px;">Volumenstrom (m³/h)</label>
        <input type="number" value="5000" min="100" max="50000" step="500" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
        
        <label style="display: block; color: #90caf9; font-size: 12px; margin-top: 15px; margin-bottom: 5px;">Zuluft Temperatur (°C)</label>
        <input type="number" value="20" min="-20" max="50" step="1" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
      </div>

      <div style="padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #90caf9; font-size: 14px;">Ergebnisse</h3>
        
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a5a7f;">
          <span style="color: #90caf9;">Luftmassenstrom</span>
          <span style="color: white;"><span class="result-value">–</span> kg/h</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 10px 0;">
          <span style="color: #90caf9;">Leistung</span>
          <span style="color: white;"><span class="result-value">–</span> kW</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ Ventilation v2 rendered');
}

function initVentilation() {
  buildVentilationUI();
  const container = window.$('vent-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcLuftPure(container));
    input.addEventListener('change', () => calcLuftPure(container));
  });

  calcLuftPure(container);
}

document.addEventListener('DOMContentLoaded', initVentilation);

window.calcLuftPure = calcLuftPure;
window.rhoAir = rhoAir;
