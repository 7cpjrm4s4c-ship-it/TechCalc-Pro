/**
 * TechCalc Pro - Entwässerung v2 PRO
 */

function calcEWPro(container) {
  if (!container) return;

  let totalDU = 0;
  const fixtures = document.querySelectorAll('.ew-fixture-item');
  
  fixtures.forEach(fix => {
    const duInput = fix.querySelector('input[type="number"]');
    if (duInput) {
      totalDU += window.parseNum(duInput.value) || 0;
    }
  });

  let K = 0.7;
  let Qww = K * Math.sqrt(totalDU);

  let result = document.getElementById('ew-result');
  if (result) {
    result.innerHTML = `
      <div class="out-grid">
        <div class="ob">
          <div class="ob-title">DU gesamt</div>
          <div class="out-row">
            <div class="out-key">DU</div>
            <div class="out-val"><span class="out-num">${totalDU}</span><span class="u">DU</span></div>
          </div>
        </div>
        <div class="ob">
          <div class="ob-title">Schmutzwasserabfluss</div>
          <div class="out-row">
            <div class="out-key">l/s</div>
            <div class="out-val"><span class="out-num">${window.loc(Qww, 2)}</span><span class="u">l/s</span></div>
          </div>
        </div>
      </div>
    `;
  }
}

function buildEWUI() {
  const container = window.$('ew-section');
  if (!container) return;

  let html = `
    <div class="tab-inner">
      <div class="ew-desktop-left">
        <div class="gc">
          <div class="slbl">Entwässerung — Verbraucher</div>
          
          <div class="igrp">
            <div class="ilbl">Gebäude / Nutzung</div>
            <select class="gl-sel" id="ew-use">
              <option value="wohn">Wohngebäude / wohnähnlich</option>
              <option value="buero">Büro / Verwaltung</option>
              <option value="hotel">Hotel / Beherbergung</option>
              <option value="schule">Schule / Sport / öffentlich</option>
              <option value="gewerb">Gewerbe / hohe Gleichzeitigkeit</option>
            </select>
          </div>

          <div class="igrp" style="margin-bottom:0">
            <div class="ilbl">Sonderabfluss optional</div>
            <div class="iwrap">
              <input class="inp-sm" id="ew-special-q" type="number" min="0" step="0.1" value="0" inputmode="decimal"/>
              <span class="iunit">l/s</span>
            </div>
          </div>
        </div>

        <div class="gc">
          <div class="slbl">Entwässerungsgegenstände</div>
          <div id="ew-fixture-list" class="ew-list">
            <div class="ew-fixture-item" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <span style="flex:1">WC</span>
              <input class="inp-sm" type="number" value="6" min="0" step="1" inputmode="decimal" style="width:60px"/>
              <span style="color:var(--t3);font-size:12px">DU</span>
            </div>
            <div class="ew-fixture-item" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <span style="flex:1">Badewanne</span>
              <input class="inp-sm" type="number" value="2" min="0" step="1" inputmode="decimal" style="width:60px"/>
              <span style="color:var(--t3);font-size:12px">DU</span>
            </div>
            <div class="ew-fixture-item" style="display:flex;gap:8px;align-items:center">
              <span style="flex:1">Dusche</span>
              <input class="inp-sm" type="number" value="1" min="0" step="1" inputmode="decimal" style="width:60px"/>
              <span style="color:var(--t3);font-size:12px">DU</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ew-desktop-right">
        <div class="out-card">
          <div class="slbl">Ergebnis — Entwässerung</div>
          <div id="ew-result">
            <p style="color:var(--t3);font-size:12px;text-align:center;padding:12px 0">Verbraucher eingeben →</p>
          </div>
        </div>

        <div class="fml">
          Q<sub>ww</sub> = K × √ΣDU &ensp;·&ensp; Quick-Check zur Plausibilitätsprüfung
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  console.log('✅ Entwässerung v2 PRO initialized');
}

function initEW() {
  buildEWUI();
  const inputs = document.querySelectorAll('#ew-section input[type="number"]');
  inputs.forEach(input => {
    input.addEventListener('input', calcEWPro);
    input.addEventListener('change', calcEWPro);
  });

  calcEWPro();
}

document.addEventListener('DOMContentLoaded', initEW);

window.calcEWPro = calcEWPro;
