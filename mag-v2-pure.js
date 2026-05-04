function expansionCoeff(tMin, tMax) { return 0.0004 * (tMax - tMin); }

function calcMAGPure(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 3) return;

  let volume = window.parseNum(inputs[0]?.value) || 100;
  let tMin = window.parseNum(inputs[1]?.value) || 10;
  let tMax = window.parseNum(inputs[2]?.value) || 90;

  let alpha = expansionCoeff(tMin, tMax);
  let VExp = volume * alpha;

  const results = container.querySelectorAll('.result-value');
  if (results.length >= 2) {
    results[0].textContent = window.loc(VExp, 2);
    results[1].textContent = window.loc(tMin + 0.3, 1);
  }
}

function buildMAGUI() {
  const container = window.$('mag-section');
  if (!container) return;

  let html = `
    <div style="padding: 20px;">
      <h2 style="margin-top: 0; color: #90caf9;">MAG Druckhaltung</h2>
      
      <div style="margin-bottom: 20px; padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <label style="display: block; color: #90caf9; font-size: 12px; margin-bottom: 5px;">Anlagenvolumen (L)</label>
        <input type="number" value="100" min="10" max="10000" step="10" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
        
        <label style="display: block; color: #90caf9; font-size: 12px; margin-top: 15px; margin-bottom: 5px;">Min. Temperatur (°C)</label>
        <input type="number" value="10" min="0" max="50" step="1" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
        
        <label style="display: block; color: #90caf9; font-size: 12px; margin-top: 15px; margin-bottom: 5px;">Max. Temperatur (°C)</label>
        <input type="number" value="90" min="50" max="120" step="1" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
      </div>

      <div style="padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a5a7f;">
          <span style="color: #90caf9;">Expansionsvolumen</span>
          <span style="color: white;"><span class="result-value">–</span> L</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 10px 0;">
          <span style="color: #90caf9;">Vordruck (p0)</span>
          <span style="color: white;"><span class="result-value">–</span> bar</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ MAG v2 rendered');
}

function initMAG() {
  buildMAGUI();
  const container = window.$('mag-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcMAGPure(container));
    input.addEventListener('change', () => calcMAGPure(container));
  });

  calcMAGPure(container);
}

document.addEventListener('DOMContentLoaded', initMAG);

window.calcMAGPure = calcMAGPure;
window.expansionCoeff = expansionCoeff;
