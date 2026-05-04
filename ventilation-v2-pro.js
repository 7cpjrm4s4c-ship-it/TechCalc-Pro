function rhoAir(t) { return 1.2 * (273 / (273 + t)); }

function calcLuftPro(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 2) return;

  let v = window.parseNum(inputs[0]?.value) || 0;
  let tzlH = window.parseNum(inputs[1]?.value) || 20;

  if (v <= 0) {
    const results = container.querySelectorAll('.out-num');
    results.forEach(el => el.textContent = '–');
    return;
  }

  let rho = rhoAir(tzlH);
  let Q = (v * rho) / 1.2;
  let qOut = (Q * 1.2 * 35) / 3600;

  const results = container.querySelectorAll('.out-num');
  if (results.length >= 2) {
    results[0].textContent = window.loc(Q, 2);
    results[1].textContent = window.loc(qOut, 2);
  }
}

function buildVentilationUI() {
  const container = window.$('vent-section');
  if (!container) return;

  let html = `
    <div class="tab-inner">
      <div class="gc">
        <div class="slbl">Lüftung</div>
        
        <div class="igrp">
          <div class="ilbl">Volumenstrom (m³/h)</div>
          <div class="iwrap">
            <input class="inp" type="number" value="5000" min="100" max="50000" step="500" inputmode="decimal"/>
            <span class="iunit">m³/h</span>
          </div>
        </div>
        
        <div class="igrp" style="margin-bottom:0">
          <div class="ilbl">Zuluft Temperatur (°C)</div>
          <div class="iwrap">
            <input class="inp" type="number" value="20" min="-20" max="50" step="1" inputmode="decimal"/>
            <span class="iunit">°C</span>
          </div>
        </div>
      </div>

      <div class="out-card">
        <div class="slbl">Ergebnisse</div>
        <div class="out-grid">
          <div class="ob">
            <div class="ob-title">Luftmassenstrom</div>
            <div class="out-row">
              <div class="out-key">kg/h</div>
              <div class="out-val"><span class="out-num">–</span><span class="u">kg/h</span></div>
            </div>
          </div>
          <div class="ob">
            <div class="ob-title">Leistung</div>
            <div class="out-row">
              <div class="out-key">kW</div>
              <div class="out-val"><span class="out-num">–</span><span class="u">kW</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="fml">
        ρ<sub>L</sub>(t) = 1.2 × (273 / (273 + t)) kg/m³
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ Ventilation v2 PRO initialized');
}

function initVentilation() {
  buildVentilationUI();
  const container = window.$('vent-section');
  if (!container) return;

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => calcLuftPro(container));
    input.addEventListener('change', () => calcLuftPro(container));
  });

  calcLuftPro(container);
}

document.addEventListener('DOMContentLoaded', initVentilation);

window.calcLuftPro = calcLuftPro;
window.rhoAir = rhoAir;
