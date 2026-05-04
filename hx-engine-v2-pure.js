function calcHXEnginePure(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 2) return;

  let t1 = window.parseNum(inputs[0]?.value) || 20;
  let phi1 = window.parseNum(inputs[1]?.value) || 50;

  const results = container.querySelectorAll('.result-value');
  if (results.length >= 1) {
    results[0].textContent = `T: ${window.loc(t1, 1)}°C, φ: ${window.loc(phi1, 1)}%`;
  }
}

function buildHXEngineUI() {
  const container = window.$('hx-section');
  if (!container) return;

  let html = `
    <div style="padding: 20px;">
      <h2 style="margin-top: 0; color: #90caf9;">HX-Engine (Mollier)</h2>
      
      <div style="margin-bottom: 20px; padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <label style="display: block; color: #90caf9; font-size: 12px; margin-bottom: 5px;">Temperatur (°C)</label>
        <input type="number" value="20" min="-20" max="50" step="1" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
        
        <label style="display: block; color: #90caf9; font-size: 12px; margin-top: 15px; margin-bottom: 5px;">Relative Feuchte (%)</label>
        <input type="number" value="50" min="10" max="100" step="5" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
      </div>

      <div style="padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; padding: 10px 0; margin-bottom: 15px;">
          <span style="color: #90caf9;">Zustand</span>
          <span style="color: white;"><span class="result-value">–</span></span>
        </div>
        <p style="color: #90caf9; font-size: 12px; margin: 0;">Phase 4: Canvas Mollier Diagramm folgt...</p>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ HX-Engine v2 rendered');
}

function initHXEngine() {
  buildHXEngineUI();
  const container = window.$('hx-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcHXEnginePure(container));
    input.addEventListener('change', () => calcHXEnginePure(container));
  });

  calcHXEnginePure(container);
}

document.addEventListener('DOMContentLoaded', initHXEngine);

window.calcHXEnginePure = calcHXEnginePure;
