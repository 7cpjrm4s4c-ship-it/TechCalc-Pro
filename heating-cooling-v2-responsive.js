/**
 * TechCalc Pro - Heating-Cooling v2 RESPONSIVE
 * Desktop: 2-column layout in tabs
 * Mobile: Fullscreen via Pill Navigation
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

function hcCalcResponsive(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 3) return;

  let q = window.parseNum(inputs[0]?.value) || 0;
  let dt = window.parseNum(inputs[1]?.value) || 1;
  let m = window.parseNum(inputs[2]?.value) || 0;

  if (q <= 0 || dt <= 0 || m <= 0) {
    const resultDivs = container.querySelectorAll('.out-num');
    resultDivs.forEach(div => div.textContent = '–');
    return;
  }

  let d = Math.sqrt((4 * m) / (1000 * 3.14159 * 1.0)) * 1000;
  let v = (m / 1000) / (3.14159 * Math.pow(d / 1000, 2) / 4);
  let Re = (v * (d / 1000)) / 0.001;
  let lam = lambdaCW(Re, 0.045 / d);
  let pv = pdrop(lam, 10, d / 1000, 1000, v);

  const resultDivs = container.querySelectorAll('.out-num');
  if (resultDivs.length >= 3) {
    resultDivs[0].textContent = window.loc(pv, 3);
    resultDivs[1].textContent = window.loc(v, 2);
    resultDivs[2].textContent = window.loc(d, 1);
  }
}

function buildHCDesktopUI() {
  const container = window.$('hc-section');
  if (!container) return;

  let html = `
    <div class="tab-inner">
      <div class="hc-desktop-left">
        <div class="gc">
          <div class="slbl">Heizung / Kälte</div>
          
          <div class="igrp">
            <div class="ilbl">Leistung (kW)</div>
            <div class="iwrap">
              <input class="inp hc-input" type="number" value="100" min="1" max="1000" step="10" inputmode="decimal"/>
              <span class="iunit">kW</span>
            </div>
          </div>
          
          <div class="igrp">
            <div class="ilbl">Temperaturdifferenz (K)</div>
            <div class="iwrap">
              <input class="inp hc-input" type="number" value="10" min="1" max="50" step="1" inputmode="decimal"/>
              <span class="iunit">K</span>
            </div>
          </div>
          
          <div class="igrp" style="margin-bottom:0">
            <div class="ilbl">Massenstrom (kg/h)</div>
            <div class="iwrap">
              <input class="inp hc-input" type="number" value="1000" min="10" max="10000" step="100" inputmode="decimal"/>
              <span class="iunit">kg/h</span>
            </div>
          </div>
        </div>
      </div>

      <div class="hc-desktop-right">
        <div class="out-card">
          <div class="slbl">Ergebnisse</div>
          <div class="out-grid">
            <div class="ob">
              <div class="ob-title">Druckverlust (10m)</div>
              <div class="out-row">
                <div class="out-key">bar</div>
                <div class="out-val"><span class="out-num">–</span><span class="u">bar</span></div>
              </div>
            </div>
            <div class="ob">
              <div class="ob-title">Strömungsgeschwindigkeit</div>
              <div class="out-row">
                <div class="out-key">m/s</div>
                <div class="out-val"><span class="out-num">–</span><span class="u">m/s</span></div>
              </div>
            </div>
            <div class="ob">
              <div class="ob-title">Rohrdurchmesser</div>
              <div class="out-row">
                <div class="out-key">mm</div>
                <div class="out-val"><span class="out-num">–</span><span class="u">mm</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="fml">
          ṁ = <em>Q</em> / (<em>c<sub>p</sub></em> × <em>ΔT</em>)
          &ensp;·&ensp;
          Q = <em>ṁ</em> × <em>c<sub>p</sub></em> × <em>ΔT</em>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ Heating-Cooling Desktop UI initialized');
}

function buildHCMobileUI() {
  const container = window.$('mobile-hc');
  if (!container) return;

  let html = `
    <div class="mobile-module-screen">
      <div class="gc">
        <div class="slbl">Heizung / Kälte</div>
        
        <div class="igrp">
          <div class="ilbl">Leistung (kW)</div>
          <div class="iwrap">
            <input class="inp hc-input" type="number" value="100" min="1" max="1000" step="10" inputmode="decimal"/>
            <span class="iunit">kW</span>
          </div>
        </div>
        
        <div class="igrp">
          <div class="ilbl">Temperaturdifferenz (K)</div>
          <div class="iwrap">
            <input class="inp hc-input" type="number" value="10" min="1" max="50" step="1" inputmode="decimal"/>
            <span class="iunit">K</span>
          </div>
        </div>
        
        <div class="igrp" style="margin-bottom:0">
          <div class="ilbl">Massenstrom (kg/h)</div>
          <div class="iwrap">
            <input class="inp hc-input" type="number" value="1000" min="10" max="10000" step="100" inputmode="decimal"/>
            <span class="iunit">kg/h</span>
          </div>
        </div>
      </div>

      <div class="out-card">
        <div class="slbl">Ergebnisse</div>
        <div class="out-grid">
          <div class="ob">
            <div class="ob-title">Druckverlust (10m)</div>
            <div class="out-row">
              <div class="out-key">bar</div>
              <div class="out-val"><span class="out-num">–</span><span class="u">bar</span></div>
            </div>
          </div>
          <div class="ob">
            <div class="ob-title">Strömungsgeschwindigkeit</div>
            <div class="out-row">
              <div class="out-key">m/s</div>
              <div class="out-val"><span class="out-num">–</span><span class="u">m/s</span></div>
            </div>
          </div>
          <div class="ob">
            <div class="ob-title">Rohrdurchmesser</div>
            <div class="out-row">
              <div class="out-key">mm</div>
              <div class="out-val"><span class="out-num">–</span><span class="u">mm</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="fml">
        ṁ = <em>Q</em> / (<em>c<sub>p</sub></em> × <em>ΔT</em>)
        &ensp;·&ensp;
        Q = <em>ṁ</em> × <em>c<sub>p</sub></em> × <em>ΔT</em>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ Heating-Cooling Mobile UI initialized');
}

function initHeatingCooling() {
  // Desktop version
  buildHCDesktopUI();
  let desktopContainer = window.$('hc-section');
  if (desktopContainer) {
    const inputs = desktopContainer.querySelectorAll('.hc-input');
    inputs.forEach(input => {
      input.addEventListener('input', () => hcCalcResponsive('hc-section'));
      input.addEventListener('change', () => hcCalcResponsive('hc-section'));
    });
    hcCalcResponsive('hc-section');
  }

  // Mobile version
  buildHCMobileUI();
  let mobileContainer = window.$('mobile-hc');
  if (mobileContainer) {
    const inputs = mobileContainer.querySelectorAll('.hc-input');
    inputs.forEach(input => {
      input.addEventListener('input', () => hcCalcResponsive('mobile-hc'));
      input.addEventListener('change', () => hcCalcResponsive('mobile-hc'));
    });
    hcCalcResponsive('mobile-hc');
  }

  console.log('✅ Heating-Cooling v2 RESPONSIVE initialized');
}

document.addEventListener('DOMContentLoaded', initHeatingCooling);

window.hcCalcResponsive = hcCalcResponsive;
window.lambdaCW = lambdaCW;
window.pdrop = pdrop;
