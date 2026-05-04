function _pws(t) { return 610.5 * Math.exp((17.27 * t) / (t + 237.3)); }
function _x(t, phi) { let pws = _pws(t); let pw = (phi / 100) * pws; return (0.622 * pw) / (101325 - pw); }

function calcWRGPure(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 2) return;

  let tAbluft = window.parseNum(inputs[0]?.value) || 20;
  let eta = window.parseNum(inputs[1]?.value) || 0.8;
  let tZuluft = tAbluft * eta;
  
  const results = container.querySelectorAll('.result-value');
  if (results.length >= 1) results[0].textContent = window.loc(tZuluft, 1);
}

function buildWRGUI() {
  const container = window.$('wrg-section');
  if (!container) return;

  let html = `
    <div style="padding: 20px;">
      <h2 style="margin-top: 0; color: #90caf9;">WRG & Mischluft</h2>
      
      <div style="margin-bottom: 20px; padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <label style="display: block; color: #90caf9; font-size: 12px; margin-bottom: 5px;">Abluft Temperatur (°C)</label>
        <input type="number" value="20" min="-20" max="50" step="1" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
        
        <label style="display: block; color: #90caf9; font-size: 12px; margin-top: 15px; margin-bottom: 5px;">WRG Wirkungsgrad</label>
        <input type="number" value="0.8" min="0.5" max="0.95" step="0.05" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
      </div>

      <div style="padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; padding: 10px 0;">
          <span style="color: #90caf9;">Zuluft Temperatur</span>
          <span style="color: white;"><span class="result-value">–</span> °C</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ WRG v2 rendered');
}

function initWRG() {
  buildWRGUI();
  const container = window.$('wrg-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcWRGPure(container));
    input.addEventListener('change', () => calcWRGPure(container));
  });

  calcWRGPure(container);
}

document.addEventListener('DOMContentLoaded', initWRG);

window.calcWRGPure = calcWRGPure;
window._pws = _pws;
window._x = _x;
