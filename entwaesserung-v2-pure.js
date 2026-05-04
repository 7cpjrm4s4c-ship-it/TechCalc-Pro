function calcEntwaesserungPure(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 3) return;

  let wc = window.parseNum(inputs[0]?.value) || 0;
  let waschbecken = window.parseNum(inputs[1]?.value) || 0;
  let badewanne = window.parseNum(inputs[2]?.value) || 0;

  let wcSum = wc * 1.5 + waschbecken * 0.5 + badewanne * 1.0;

  const results = container.querySelectorAll('.result-value');
  if (results.length >= 1) results[0].textContent = window.loc(wcSum, 2);
}

function buildEntwaesserungUI() {
  const container = window.$('ew-section');
  if (!container) return;

  let html = `
    <div style="padding: 20px;">
      <h2 style="margin-top: 0; color: #90caf9;">Entwässerung</h2>
      
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
          <span style="color: #90caf9;">DU-Summe</span>
          <span style="color: white;"><span class="result-value">–</span> DU</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ Entwaesserung v2 rendered');
}

function initEntwaesserung() {
  buildEntwaesserungUI();
  const container = window.$('ew-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcEntwaesserungPure(container));
    input.addEventListener('change', () => calcEntwaesserungPure(container));
  });

  calcEntwaesserungPure(container);
}

document.addEventListener('DOMContentLoaded', initEntwaesserung);

window.calcEntwaesserungPure = calcEntwaesserungPure;
