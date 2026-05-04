function twCalculateTrinkwasserPure(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 3) return;

  let wcCount = window.parseNum(inputs[0]?.value) || 1;
  let waschCount = window.parseNum(inputs[1]?.value) || 1;
  let badeCount = window.parseNum(inputs[2]?.value) || 0;

  let qSum = (wcCount * 0.5 + waschCount * 0.3 + badeCount * 0.75) * 1.5;

  const results = container.querySelectorAll('.result-value');
  if (results.length >= 1) results[0].textContent = window.loc(qSum, 2);
}

function buildTrinkwasserUI() {
  const container = window.$('tw-section');
  if (!container) return;

  let html = `
    <div style="padding: 20px;">
      <h2 style="margin-top: 0; color: #90caf9;">Trinkwasser</h2>
      
      <div style="margin-bottom: 20px; padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <label style="display: block; color: #90caf9; font-size: 12px; margin-bottom: 5px;">WC Anzahl</label>
        <input type="number" value="1" min="0" max="20" step="1" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
        
        <label style="display: block; color: #90caf9; font-size: 12px; margin-top: 15px; margin-bottom: 5px;">Waschbecken Anzahl</label>
        <input type="number" value="1" min="0" max="20" step="1" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
        
        <label style="display: block; color: #90caf9; font-size: 12px; margin-top: 15px; margin-bottom: 5px;">Badewanne Anzahl</label>
        <input type="number" value="1" min="0" max="10" step="1" style="width: 100%; padding: 10px; border: none; border-radius: 4px; font-size: 16px;" />
      </div>

      <div style="padding: 15px; background: #1e3a5f; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; padding: 10px 0;">
          <span style="color: #90caf9;">Spitzenlast (QSum)</span>
          <span style="color: white;"><span class="result-value">–</span> L/min</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ Trinkwasser v2 rendered');
}

function initTrinkwasser() {
  buildTrinkwasserUI();
  const container = window.$('tw-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => twCalculateTrinkwasserPure(container));
    input.addEventListener('change', () => twCalculateTrinkwasserPure(container));
  });

  twCalculateTrinkwasserPure(container);
}

document.addEventListener('DOMContentLoaded', initTrinkwasser);

window.twCalculateTrinkwasserPure = twCalculateTrinkwasserPure;
