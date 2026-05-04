/**
 * TechCalc Pro - WRG & Mischluft v2 PRO
 */

function calcWRGPro(container) {
  if (!container) return;
  const inputs = container.querySelectorAll('input[type="number"]');
  if (inputs.length < 5) return;

  let tab = container.closest('.tab-panel');
  let abT = window.parseNum(document.getElementById('wrg-ab-t')?.value) || 0;
  let auT = window.parseNum(document.getElementById('wrg-au-t')?.value) || 0;
  let eta = window.parseNum(document.getElementById('wrg-eta')?.value) || 70;

  eta = eta / 100;

  let zlT = auT + eta * (abT - auT);
  let flT = abT - eta * (abT - auT);

  let result = document.getElementById('wrg-result');
  if (result) {
    result.innerHTML = `
      <div class="out-grid">
        <div class="ob">
          <div class="ob-title">Zuluft Temperatur</div>
          <div class="out-row">
            <div class="out-key">°C</div>
            <div class="out-val"><span class="out-num">${window.loc(zlT, 1)}</span><span class="u">°C</span></div>
          </div>
        </div>
        <div class="ob">
          <div class="ob-title">Fortluft Temperatur</div>
          <div class="out-row">
            <div class="out-key">°C</div>
            <div class="out-val"><span class="out-num">${window.loc(flT, 1)}</span><span class="u">°C</span></div>
          </div>
        </div>
      </div>
    `;
  }
}

function buildWRGUI() {
  const container = window.$('wrg-section');
  if (!container) return;

  let html = `
    <div class="tab-inner">
      <div class="gc">
        <div class="slbl">Wärmerückgewinnung (WRG)</div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)">
          <div>
            <div class="ilbl" style="color:var(--heat-t);margin-bottom:var(--gap-s)">↑ Abluft (LS1)</div>
            <div class="igrp">
              <div class="ilbl">Temperatur T</div>
              <div class="iwrap">
                <input class="inp-sm" id="wrg-ab-t" type="number" step="0.5" placeholder="22" inputmode="decimal"/>
                <span class="iunit">°C</span>
              </div>
            </div>
          </div>
          <div>
            <div class="ilbl" style="color:var(--cold-t);margin-bottom:var(--gap-s)">↓ Außenluft (LS2)</div>
            <div class="igrp">
              <div class="ilbl">Temperatur T</div>
              <div class="iwrap">
                <input class="inp-sm" id="wrg-au-t" type="number" step="0.5" placeholder="-10" inputmode="decimal"/>
                <span class="iunit">°C</span>
              </div>
            </div>
          </div>
        </div>

        <div class="igrp" style="margin-bottom:0">
          <div class="ilbl">Temperaturwirkungsgrad η<sub>t</sub></div>
          <div class="iwrap">
            <input class="inp" id="wrg-eta" type="number" min="0" max="100" step="5" value="70" inputmode="decimal"/>
            <span class="iunit">%</span>
          </div>
        </div>
      </div>

      <div class="out-card">
        <div class="slbl">Ergebnis — WRG</div>
        <div id="wrg-result">
          <p style="color:var(--t3);font-size:12px;text-align:center;padding:12px 0">Werte eingeben →</p>
        </div>
      </div>

      <div class="fml">
        T<sub>ZL</sub> = T<sub>AU</sub> + η × (T<sub>AB</sub> − T<sub>AU</sub>)
        &ensp;·&ensp;
        T<sub>FL</sub> = T<sub>AB</sub> − η × (T<sub>AB</sub> − T<sub>AU</sub>)
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ WRG v2 PRO initialized');
}

function initWRG() {
  buildWRGUI();
  const inputs = document.querySelectorAll('#wrg-ab-t, #wrg-au-t, #wrg-eta');
  inputs.forEach(input => {
    input.addEventListener('input', calcWRGPro);
    input.addEventListener('change', calcWRGPro);
  });

  calcWRGPro();
}

document.addEventListener('DOMContentLoaded', initWRG);

window.calcWRGPro = calcWRGPro;
