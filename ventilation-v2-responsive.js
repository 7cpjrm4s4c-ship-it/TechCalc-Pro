function rhoAir(t) { return 1.2 * (273 / (273 + t)); }

function calcLuftResponsive(containerId) {
  const container = document.getElementById(containerId);
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

function buildVentDesktopUI() {
  const container = window.$('vent-section');
  if (!container) return;

  let html = `
    <div class="tab-inner">
      <div class="vent-desktop-left">
        <div class="gc">
          <div class="slbl">Lüftung</div>
          
          <div class="igrp">
            <div class="ilbl">Volumenstrom (m³/h)</div>
            <div class="iwrap">
              <input class="inp vent-input" type="number" value="5000" min="100" max="50000" step="500" inputmode="decimal"/>
              <span class="iunit">m³/h</span>
            </div>
          </div>
          
          <div class="igrp" style="margin-bottom:0">
            <div class="ilbl">Zuluft Temperatur (°C)</div>
            <div class="iwrap">
              <input class="inp vent-input" type="number" value="20" min="-20" max="50" step="1" inputmode="decimal"/>
              <span class="iunit">°C</span>
            </div>
          </div>
        </div>
      </div>

      <div class="vent-desktop-right">
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
    </div>
  `;

  container.innerHTML = html;
}

function buildVentMobileUI() {
  const container = window.$('mobile-vent');
  if (!container) return;

  let html = `
    <div class="mobile-module-screen">
      <div class="gc">
        <div class="slbl">Lüftung</div>
        
        <div class="igrp">
          <div class="ilbl">Volumenstrom (m³/h)</div>
          <div class="iwrap">
            <input class="inp vent-input" type="number" value="5000" min="100" max="50000" step="500" inputmode="decimal"/>
            <span class="iunit">m³/h</span>
          </div>
        </div>
        
        <div class="igrp" style="margin-bottom:0">
          <div class="ilbl">Zuluft Temperatur (°C)</div>
          <div class="iwrap">
            <input class="inp vent-input" type="number" value="20" min="-20" max="50" step="1" inputmode="decimal"/>
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
}

function initVentilation() {
  buildVentDesktopUI();
  let desktop = window.$('vent-section');
  if (desktop) {
    const inputs = desktop.querySelectorAll('.vent-input');
    inputs.forEach(input => {
      input.addEventListener('input', () => calcLuftResponsive('vent-section'));
      input.addEventListener('change', () => calcLuftResponsive('vent-section'));
    });
    calcLuftResponsive('vent-section');
  }

  buildVentMobileUI();
  let mobile = window.$('mobile-vent');
  if (mobile) {
    const inputs = mobile.querySelectorAll('.vent-input');
    inputs.forEach(input => {
      input.addEventListener('input', () => calcLuftResponsive('mobile-vent'));
      input.addEventListener('change', () => calcLuftResponsive('mobile-vent'));
    });
    calcLuftResponsive('mobile-vent');
  }

  console.log('✅ Ventilation v2 RESPONSIVE initialized');
}

document.addEventListener('DOMContentLoaded', initVentilation);

window.calcLuftResponsive = calcLuftResponsive;
window.rhoAir = rhoAir;
